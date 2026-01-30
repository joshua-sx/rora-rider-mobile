import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-guest-token',
}

/**
 * Mark Driver Arrived Edge Function
 *
 * Allows a driver to mark they have arrived at the pickup location.
 * State transition: confirmed → arrived
 *
 * Security:
 * - Only the selected driver can mark arrival
 * - Ride must be in 'confirmed' state
 * - Logs event to ride_events for audit trail
 *
 * After this:
 * - Rider is notified that driver has arrived
 * - QR scan can now be performed (claim-qr-token requires 'arrived' state)
 * - QR scan transitions ride to 'active'
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const { ride_session_id, driver_location } = await req.json()

    // Validate required fields
    if (!ride_session_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ride_session_id is required' }),
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

    // Get ride session
    const { data: rideSession, error: sessionError } = await supabaseService
      .from('ride_sessions')
      .select('*')
      .eq('id', ride_session_id)
      .single()

    if (sessionError || !rideSession) {
      return new Response(
        JSON.stringify({ success: false, error: 'Ride session not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // CRITICAL: Validate driver ownership
    if (rideSession.selected_driver_id !== driverId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'FORBIDDEN: You are not the selected driver for this ride'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Validate state transition (confirmed → arrived)
    if (rideSession.status !== 'confirmed') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `INVALID_STATE_TRANSITION: Cannot mark arrival from '${rideSession.status}' state. Expected 'confirmed'.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const arrivedAt = new Date().toISOString()

    // Update ride session to 'arrived' status
    const { error: updateError } = await supabaseService
      .from('ride_sessions')
      .update({
        status: 'arrived',
        arrived_at: arrivedAt,
        updated_at: arrivedAt,
      })
      .eq('id', ride_session_id)

    if (updateError) {
      throw new Error(`Failed to update ride session: ${updateError.message}`)
    }

    // Log ride event
    await supabaseService.from('ride_events').insert({
      ride_session_id: ride_session_id,
      event_type: 'driver_arrived',
      event_data: {
        driver_user_id: driverId,
        status_from: 'confirmed',
        status_to: 'arrived',
        driver_location: driver_location || null,
        origin_lat: rideSession.origin_lat,
        origin_lng: rideSession.origin_lng,
      },
      actor_user_id: driverId,
      actor_type: 'driver',
    })

    // Notify rider (push notification + in-app)
    if (rideSession.rider_user_id) {
      // Get driver profile for notification
      const { data: driverProfile } = await supabaseService
        .from('driver_profiles')
        .select('display_name, vehicle_make, vehicle_model, vehicle_color, license_plate')
        .eq('id', driverId)
        .single()

      const driverName = driverProfile?.display_name || 'Your driver'
      const vehicleInfo = driverProfile
        ? `${driverProfile.vehicle_color || ''} ${driverProfile.vehicle_make || ''} ${driverProfile.vehicle_model || ''}`.trim()
        : null

      // Get rider's push tokens
      const { data: devices } = await supabaseService
        .from('devices')
        .select('push_token')
        .eq('user_id', rideSession.rider_user_id)
        .eq('is_active', true)

      if (devices && devices.length > 0) {
        const pushTokens = devices.map((d: { push_token: string }) => d.push_token).filter(Boolean)

        // Send push notification
        if (pushTokens.length > 0) {
          try {
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(
                pushTokens.map((token: string) => ({
                  to: token,
                  title: 'Driver Has Arrived!',
                  body: vehicleInfo
                    ? `${driverName} has arrived. Look for the ${vehicleInfo}.`
                    : `${driverName} has arrived at the pickup location.`,
                  data: {
                    ride_session_id: ride_session_id,
                    type: 'driver_arrived',
                  },
                  sound: 'default',
                  priority: 'high',
                }))
              ),
            })
          } catch (pushError) {
            console.error('Failed to send push notification:', pushError)
            // Don't fail the operation if push fails
          }
        }
      }

      // Create in-app notification
      await supabaseService.from('notifications_inbox').insert({
        user_id: rideSession.rider_user_id,
        type: 'driver_arrived',
        title: 'Driver Has Arrived',
        body: vehicleInfo
          ? `${driverName} has arrived. Look for the ${vehicleInfo}.`
          : `${driverName} has arrived at the pickup location.`,
        metadata: {
          ride_session_id: ride_session_id,
          driver_name: driverName,
          vehicle_info: vehicleInfo,
          license_plate: driverProfile?.license_plate || null,
        },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        ride_session_id: ride_session_id,
        new_status: 'arrived',
        arrived_at: arrivedAt,
        message: 'Driver arrival marked. Rider has been notified. Proceed to scan QR code.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Mark driver arrived failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
