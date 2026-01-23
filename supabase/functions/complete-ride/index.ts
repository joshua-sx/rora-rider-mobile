import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-guest-token',
}

/**
 * Complete Ride Edge Function
 *
 * Allows a driver to mark a ride as completed.
 * State transition: active → completed
 *
 * Security: Only the selected driver can complete their own ride.
 * Supports optional fare adjustment (cash-first, negotiation-friendly model).
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const { ride_session_id, final_agreed_amount, completion_notes } = await req.json()

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

    // Validate state transition (active → completed)
    if (rideSession.status !== 'active') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `INVALID_STATE_TRANSITION: Cannot complete from '${rideSession.status}' state. Expected 'active'.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Determine final agreed amount (allow override for cash-first negotiation)
    const finalAmount = final_agreed_amount !== undefined
      ? final_agreed_amount
      : rideSession.final_agreed_amount

    // Validate fare adjustment if provided
    if (final_agreed_amount !== undefined) {
      if (typeof final_agreed_amount !== 'number' || final_agreed_amount < 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'INVALID_FARE: final_agreed_amount must be a positive number'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Update ride session to 'completed' status
    const { error: updateError } = await supabaseService
      .from('ride_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        final_agreed_amount: finalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ride_session_id)

    if (updateError) {
      throw new Error(`Failed to update ride session: ${updateError.message}`)
    }

    // Log ride event
    await supabaseService.from('ride_events').insert({
      ride_session_id: ride_session_id,
      event_type: 'ride_completed',
      event_data: {
        driver_user_id: driverId,
        status_from: 'active',
        final_agreed_amount: finalAmount,
        fare_adjusted: final_agreed_amount !== undefined && final_agreed_amount !== rideSession.final_agreed_amount,
        completion_notes: completion_notes || null,
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
                title: 'Ride Complete',
                body: 'Your ride is complete. Thanks for riding with Rora!',
                data: {
                  ride_session_id: ride_session_id,
                  type: 'ride_completed',
                  final_amount: finalAmount,
                },
              }))
            ),
          })
        }
      }

      // Create in-app notification
      await supabaseService.from('notifications').insert({
        user_id: rideSession.rider_user_id,
        type: 'ride_completed',
        title: 'Ride Complete',
        message: `Your ride is complete. Total: $${finalAmount.toFixed(2)}`,
        data: {
          ride_session_id: ride_session_id,
          final_amount: finalAmount,
        },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        ride_session_id: ride_session_id,
        new_status: 'completed',
        completed_at: new Date().toISOString(),
        final_agreed_amount: finalAmount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Complete ride failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
