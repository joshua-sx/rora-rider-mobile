import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-guest-token',
}

/**
 * Valid states from which a ride can be canceled
 */
const CANCELABLE_STATES = ['created', 'discovery', 'hold']

/**
 * Cancel Ride Edge Function
 *
 * Allows a rider to cancel their ride request.
 * This is a security boundary - all validation happens server-side.
 *
 * Flow:
 * 1. Validate user owns the ride session
 * 2. Validate ride is in a cancelable state
 * 3. Update ride status to 'canceled'
 * 4. Reject all pending offers
 * 5. Log ride event
 * 6. Notify affected driver (if any)
 *
 * Security: Enforces ride state machine transitions server-side (SPEC §7)
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const guestTokenHeader = req.headers.get('X-Guest-Token')
    const { ride_session_id, reason } = await req.json()

    // Validate required fields
    if (!ride_session_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ride_session_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client with user context for RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = authHeader?.replace('Bearer ', '') || Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    })

    // Service client for operations that bypass RLS
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

    // Get current user
    let userId: string | null = null
    let guestTokenId: string | null = null

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id || null
    }

    // If no user, validate guest token
    if (!userId && guestTokenHeader) {
      const { data: guestToken } = await supabaseService
        .from('guest_tokens')
        .select('id')
        .eq('token', guestTokenHeader)
        .single()

      if (guestToken) {
        guestTokenId = guestToken.id
      }
    }

    // Must have either user or guest token
    if (!userId && !guestTokenId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
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

    // SECURITY: Validate user owns this ride session
    if (userId) {
      if (rideSession.rider_user_id !== userId) {
        return new Response(
          JSON.stringify({ success: false, error: 'FORBIDDEN: You do not own this ride session' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }
    } else if (guestTokenId) {
      if (rideSession.guest_token_id !== guestTokenId) {
        return new Response(
          JSON.stringify({ success: false, error: 'FORBIDDEN: You do not own this ride session' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }
    }

    // SECURITY: Validate state transition
    if (!CANCELABLE_STATES.includes(rideSession.status)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `INVALID_STATE_TRANSITION: Cannot cancel ride from '${rideSession.status}' state. Cancelable states: ${CANCELABLE_STATES.join(', ')}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Store the previous state for the event log
    const previousStatus = rideSession.status
    const selectedDriverId = rideSession.selected_driver_id

    // === Begin transaction-like operations ===

    // 1. Update ride session status to 'canceled'
    const { error: updateError } = await supabaseService
      .from('ride_sessions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        canceled_by: userId ? 'rider' : 'guest',
        cancellation_reason: reason || null,
      })
      .eq('id', ride_session_id)

    if (updateError) {
      throw new Error(`Failed to cancel ride: ${updateError.message}`)
    }

    // 2. Reject all pending offers for this ride
    await supabaseService
      .from('ride_offers')
      .update({
        status: 'rejected',
        responded_at: new Date().toISOString(),
      })
      .eq('ride_session_id', ride_session_id)
      .eq('status', 'pending')

    // Also update any accepted offer that hasn't been confirmed
    if (rideSession.selected_offer_id) {
      await supabaseService
        .from('ride_offers')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
        })
        .eq('id', rideSession.selected_offer_id)
        .eq('status', 'accepted')
    }

    // 3. Log ride event (append-only audit log)
    await supabaseService.from('ride_events').insert({
      ride_session_id: ride_session_id,
      event_type: 'canceled',
      event_data: {
        previous_status: previousStatus,
        canceled_by: userId ? 'rider' : 'guest',
        reason: reason || null,
        had_selected_driver: !!selectedDriverId,
      },
      actor_user_id: userId || null,
      actor_type: userId ? 'rider' : 'guest',
    })

    // 4. Notify affected driver (if one was selected)
    if (selectedDriverId) {
      await supabaseService.from('notifications').insert({
        user_id: selectedDriverId,
        title: 'Ride Canceled',
        body: `The rider has canceled the ride from ${rideSession.origin_label} to ${rideSession.destination_label}.`,
        data: {
          type: 'ride_canceled',
          ride_session_id: ride_session_id,
        },
        read: false,
      })

      // Send push notification to driver
      const { data: driverDevices } = await supabaseService
        .from('devices')
        .select('expo_push_token')
        .eq('user_id', selectedDriverId)
        .eq('is_active', true)

      if (driverDevices && driverDevices.length > 0) {
        try {
          const messages = driverDevices
            .filter(d => d.expo_push_token)
            .map(device => ({
              to: device.expo_push_token,
              title: 'Ride Canceled',
              body: 'The rider has canceled the ride.',
              data: {
                type: 'ride_canceled',
                ride_session_id: ride_session_id,
              },
              sound: 'default',
            }))

          if (messages.length > 0) {
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(messages),
            })
          }
        } catch (pushError) {
          console.error('Failed to send push notification:', pushError)
          // Don't fail the operation if push fails
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ride_session_id: ride_session_id,
        previous_status: previousStatus,
        new_status: 'canceled',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Cancel ride failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
