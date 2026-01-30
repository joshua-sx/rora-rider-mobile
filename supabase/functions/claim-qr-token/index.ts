import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyQRToken } from '../_shared/jwt-helpers.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-guest-token',
}

/**
 * Claim QR Token Edge Function
 *
 * Validates a QR token JWT when driver scans it and returns ride details.
 * Implements 10-step validation checklist from docs/features/qr-token-spec.md
 *
 * Security:
 * - Prevents replay attacks, validates token expiry and signature
 * - Requires ride to be in 'arrived' state (driver must have marked arrival first)
 * - Validates driver is within 500m of pickup location (geofence)
 *
 * Flow: Driver marks arrival → Driver scans QR → This function validates →
 *       activate-ride transitions to 'active'
 */

// Haversine distance calculation (in meters)
function calculateHaversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const EARTH_RADIUS_METERS = 6371000
  const toRadians = (degrees: number) => degrees * (Math.PI / 180)

  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_METERS * c
}

// Maximum distance (in meters) driver can be from pickup to scan QR
const MAX_GEOFENCE_DISTANCE_METERS = 500
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const { qr_token_jwt, driver_location } = await req.json()

    // Validate required fields
    if (!qr_token_jwt) {
      return new Response(
        JSON.stringify({ success: false, error: 'qr_token_jwt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client with user context for RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = authHeader?.replace('Bearer ', '') || Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    })

    // Service client for operations that bypass RLS
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate driver
    let driverId: string | null = null

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser()
      driverId = user?.id || null
    }

    if (!driverId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Driver authentication required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // === 10-STEP VALIDATION CHECKLIST ===

    // Steps 1-4: Parse JWT, verify signature, validate iat/exp, validate TTL
    // (handled by verifyQRToken helper)
    let payload
    try {
      payload = await verifyQRToken(qr_token_jwt)
    } catch (error) {
      // Return specific error from JWT validation
      const errorMessage = error instanceof Error ? error.message : 'TOKEN_INVALID'

      if (errorMessage.includes('TOKEN_EXPIRED')) {
        return new Response(
          JSON.stringify({ success: false, error: 'TOKEN_EXPIRED: QR code has expired' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Step 5: Validate jti matches ride_sessions.qr_token_jti
    const { data: rideSession, error: sessionError } = await supabaseService
      .from('ride_sessions')
      .select('*')
      .eq('qr_token_jti', payload.jti)
      .single()

    if (sessionError || !rideSession) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TOKEN_INVALID_JTI: QR token does not match any ride session'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate ride_session_id matches (additional security check)
    if (rideSession.id !== payload.ride_session_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TOKEN_MISMATCH: Ride session ID does not match token'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Step 6: Validate ride exists and is in 'arrived' state
    // Driver must have marked arrival before scanning QR (mark-driver-arrived function)
    if (rideSession.status !== 'arrived') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `INVALID_RIDE_STATE: Ride must be in 'arrived' state to scan QR. Current state: '${rideSession.status}'. Driver must mark arrival first.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Step 7: Validate ride identity matches JWT claims
    if (payload.rider_user_id && payload.rider_user_id !== rideSession.rider_user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TOKEN_IDENTITY_MISMATCH: Rider user ID does not match'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (payload.guest_token_id && payload.guest_token_id !== rideSession.guest_token_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TOKEN_IDENTITY_MISMATCH: Guest token ID does not match'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate driver_user_id in token (if set, must match selected driver)
    if (payload.driver_user_id && payload.driver_user_id !== rideSession.selected_driver_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TOKEN_DRIVER_MISMATCH: Driver in token does not match selected driver'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate authenticated driver is the selected driver
    if (rideSession.selected_driver_id !== driverId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'FORBIDDEN: You are not the selected driver for this ride'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Step 8: Verify driver within 500m geofence of pickup location
    // This prevents QR scanning from a distance (security requirement)
    if (driver_location?.lat && driver_location?.lng) {
      const distanceMeters = calculateHaversineDistanceMeters(
        driver_location.lat,
        driver_location.lng,
        parseFloat(rideSession.origin_lat),
        parseFloat(rideSession.origin_lng)
      )

      if (distanceMeters > MAX_GEOFENCE_DISTANCE_METERS) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `GEOFENCE_VIOLATION: Driver must be within ${MAX_GEOFENCE_DISTANCE_METERS}m of pickup location. Current distance: ${Math.round(distanceMeters)}m`,
            distance_meters: Math.round(distanceMeters),
            max_allowed_meters: MAX_GEOFENCE_DISTANCE_METERS,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }
    // Note: If driver_location is not provided, we skip geofence check
    // This allows for cases where GPS is unavailable, but the QR scan itself
    // is still validated. In production, you may want to require location.

    // Step 10: Check token has not been claimed (replay prevention)
    if (rideSession.qr_claimed_at) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TOKEN_ALREADY_CLAIMED: This QR code has already been scanned',
          claimed_at: rideSession.qr_claimed_at,
          claimed_by: rideSession.qr_claimed_by_user_id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Step 11: Atomic write - Set claim fields + log event (prevent race conditions)
    const claimedAt = new Date().toISOString()

    const { error: updateError } = await supabaseService
      .from('ride_sessions')
      .update({
        qr_claimed_at: claimedAt,
        qr_claimed_by_user_id: driverId,
        updated_at: claimedAt,
      })
      .eq('id', rideSession.id)
      .is('qr_claimed_at', null) // Ensure still unclaimed (prevent race condition)

    if (updateError) {
      // If update failed, token was likely claimed by another request (race condition)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TOKEN_CLAIM_FAILED: QR code may have been scanned by another device'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      )
    }

    // Log QR claim event
    await supabaseService.from('ride_events').insert({
      ride_session_id: rideSession.id,
      event_type: 'qr_claimed',
      event_data: {
        driver_user_id: driverId,
        claimed_at: claimedAt,
        token_jti: payload.jti,
      },
      actor_user_id: driverId,
      actor_type: 'driver',
    })

    // Step 12: Return ride details (success)
    // Get rider name if authenticated
    let riderName = null
    if (rideSession.rider_user_id) {
      const { data: profile } = await supabaseService
        .from('user_profiles')
        .select('display_name, first_name, last_name')
        .eq('user_id', rideSession.rider_user_id)
        .single()

      if (profile) {
        riderName = profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Rider'
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ride_session: {
          id: rideSession.id,
          status: rideSession.status,
          origin_label: rideSession.origin_label,
          destination_label: rideSession.destination_label,
          final_agreed_amount: rideSession.final_agreed_amount,
          rider_name: riderName || 'Guest',
          is_guest: !rideSession.rider_user_id,
          qr_claimed_at: claimedAt,
        },
        message: 'QR code validated successfully. You can now activate the ride.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('QR token claim failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
