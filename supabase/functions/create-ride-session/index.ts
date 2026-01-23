import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateQRToken, getNumericDate } from '../_shared/jwt-helpers.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const {
      origin,
      destination,
      rora_fare_amount,
      pricing_rule_version_id,
      pricing_calculation_metadata,
      request_type,
      target_driver_id,
      region_id,
    } = await req.json()

    // Validate required fields
    if (!origin?.lat || !origin?.lng || !origin?.label) {
      return new Response(
        JSON.stringify({ error: 'Valid origin is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!destination?.lat || !destination?.lng || !destination?.label) {
      return new Response(
        JSON.stringify({ error: 'Valid destination is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (rora_fare_amount === undefined || rora_fare_amount === null) {
      return new Response(
        JSON.stringify({ error: 'Rora fare amount is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = authHeader?.replace('Bearer ', '') || Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    })

    // Get current user or guest token
    let userId: string | null = null
    let guestTokenId: string | null = null

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id || null
    }

    // If no user, look for guest token in headers
    if (!userId) {
      const guestTokenHeader = req.headers.get('X-Guest-Token')
      if (guestTokenHeader) {
        // Validate guest token
        const { data: guestToken } = await supabase
          .from('guest_tokens')
          .select('id')
          .eq('token', guestTokenHeader)
          .single()

        if (guestToken) {
          guestTokenId = guestToken.id
        }
      }
    }

    // Must have either user or guest token
    if (!userId && !guestTokenId) {
      return new Response(
        JSON.stringify({ error: 'Authentication or guest token required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Get region (default to Sint Maarten)
    let actualRegionId = region_id
    if (!actualRegionId) {
      const { data: region } = await supabase
        .from('regions')
        .select('id')
        .eq('country_code', 'SX')
        .eq('is_active', true)
        .single()
      actualRegionId = region?.id
    }

    if (!actualRegionId) {
      throw new Error('Region not found')
    }

    // Generate QR token JTI (unique identifier)
    const qrTokenJti = crypto.randomUUID()

    // Create ride session
    const { data: rideSession, error: insertError } = await supabase
      .from('ride_sessions')
      .insert({
        region_id: actualRegionId,
        rider_user_id: userId,
        guest_token_id: guestTokenId,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        origin_label: origin.label,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        destination_label: destination.label,
        destination_freeform_name: destination.freeform_name || null,
        rora_fare_amount,
        pricing_rule_version_id: pricing_rule_version_id || null,
        pricing_calculation_metadata,
        request_type: request_type || 'broadcast',
        target_driver_id: target_driver_id || null,
        status: 'created',
        qr_token_jti: qrTokenJti,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create ride session:', insertError)
      throw insertError
    }

    // Log ride event
    await supabase.from('ride_events').insert({
      ride_session_id: rideSession.id,
      event_type: 'created',
      event_data: {
        request_type: request_type || 'broadcast',
        origin: origin.label,
        destination: destination.label,
        rora_fare: rora_fare_amount,
      },
      actor_user_id: userId || null,
      actor_type: userId ? 'rider' : 'system',
    })

    // Generate signed QR token JWT (10-minute expiry)
    const qrToken = await generateQRToken({
      jti: qrTokenJti,
      ride_session_id: rideSession.id,
      rider_user_id: rideSession.rider_user_id,
      guest_token_id: rideSession.guest_token_id,
      driver_user_id: null,  // Not selected yet
      fare_amount: rideSession.rora_fare_amount,
      iat: getNumericDate(new Date()),
      exp: getNumericDate(new Date(Date.now() + 10 * 60 * 1000)), // 10 minutes
      ver: '1'
    })

    return new Response(
      JSON.stringify({
        success: true,
        ride_session: rideSession,
        qr_token_jti: qrTokenJti,
        qr_token: qrToken,  // Return full JWT for client to display in QR code
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Ride session creation failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
