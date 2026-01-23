import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-guest-token',
}

/**
 * Activate Ride Edge Function
 *
 * Allows a driver to mark a ride as active (started).
 * State transition: confirmed → active
 *
 * Security: Only the selected driver can activate their own ride.
 * Can be called automatically after QR scan OR manually by driver.
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

    // Validate driver ownership
    if (rideSession.selected_driver_id !== driverId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'FORBIDDEN: You are not the selected driver for this ride'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Validate state transition (confirmed → active)
    if (rideSession.status !== 'confirmed') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `INVALID_STATE_TRANSITION: Cannot activate from '${rideSession.status}' state. Expected 'confirmed'.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Update ride session to 'active' status
    const { error: updateError } = await supabaseService
      .from('ride_sessions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ride_session_id)

    if (updateError) {
      throw new Error(`Failed to update ride session: ${updateError.message}`)
    }

    // Log ride event
    await supabaseService.from('ride_events').insert({
      ride_session_id: ride_session_id,
      event_type: 'ride_started',
      event_data: {
        driver_user_id: driverId,
        status_from: 'confirmed',
        final_agreed_amount: rideSession.final_agreed_amount,
      },
      actor_user_id: driverId,
      actor_type: 'driver',
    })

    // Notify rider
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
                title: 'Ride Started',
                body: 'Your ride has started. Enjoy your trip!',
                data: {
                  ride_session_id: ride_session_id,
                  type: 'ride_started',
                },
              }))
            ),
          })
        }
      }

      // Create in-app notification
      await supabaseService.from('notifications').insert({
        user_id: rideSession.rider_user_id,
        type: 'ride_started',
        title: 'Ride Started',
        message: 'Your ride has started. Enjoy your trip!',
        data: {
          ride_session_id: ride_session_id,
        },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        ride_session_id: ride_session_id,
        new_status: 'active',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Activate ride failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
