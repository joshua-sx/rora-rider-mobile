import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-guest-token',
}

/**
 * Confirm Ride as Driver Edge Function
 *
 * Allows a driver to confirm they will pick up the rider.
 * State transition: hold → confirmed
 *
 * Security: Only the selected driver can confirm their own ride.
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const { ride_session_id } = await req.json()

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

    // Authenticate driver (DRIVER only, not rider!)
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

    // CRITICAL: Validate driver ownership (not rider!)
    if (rideSession.selected_driver_id !== driverId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'FORBIDDEN: You are not the selected driver for this ride'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Validate state transition (hold → confirmed)
    if (rideSession.status !== 'hold') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `INVALID_STATE_TRANSITION: Cannot confirm from '${rideSession.status}' state. Expected 'hold'.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if hold has expired
    if (rideSession.hold_expires_at) {
      const holdExpiresAt = new Date(rideSession.hold_expires_at).getTime()
      const now = Date.now()

      if (holdExpiresAt < now) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'HOLD_EXPIRED: The hold period has expired'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Update ride session to 'confirmed' status
    const { error: updateError } = await supabaseService
      .from('ride_sessions')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ride_session_id)

    if (updateError) {
      throw new Error(`Failed to update ride session: ${updateError.message}`)
    }

    // Log ride event
    await supabaseService.from('ride_events').insert({
      ride_session_id: ride_session_id,
      event_type: 'confirmed',
      event_data: {
        driver_user_id: driverId,
        status_from: 'hold',
        selected_offer_id: rideSession.selected_offer_id,
        final_agreed_amount: rideSession.final_agreed_amount,
      },
      actor_user_id: driverId,
      actor_type: 'driver',
    })

    // Notify rider (push notification + in-app)
    if (rideSession.rider_user_id) {
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
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(
              pushTokens.map((token: string) => ({
                to: token,
                title: 'Driver Confirmed!',
                body: 'Your driver has confirmed. Get ready for pickup.',
                data: {
                  ride_session_id: ride_session_id,
                  type: 'ride_confirmed',
                },
              }))
            ),
          })
        }
      }

      // Create in-app notification
      await supabaseService.from('notifications').insert({
        user_id: rideSession.rider_user_id,
        type: 'ride_confirmed',
        title: 'Driver Confirmed',
        message: 'Your driver has confirmed and is on the way!',
        data: {
          ride_session_id: ride_session_id,
        },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        ride_session_id: ride_session_id,
        new_status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Confirm ride failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
