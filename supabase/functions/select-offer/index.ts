import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-guest-token',
}

/**
 * Select Offer Edge Function
 *
 * Allows a rider to accept a driver's offer for their ride request.
 * This is a critical security boundary - all validation happens server-side.
 *
 * Flow:
 * 1. Validate user owns the ride session
 * 2. Validate ride is in 'discovery' status
 * 3. Validate offer exists and is pending
 * 4. Update offer status to 'accepted'
 * 5. Reject all other pending offers
 * 6. Update ride session status to 'hold' (awaiting driver confirmation)
 * 7. Log ride event
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
    const { ride_session_id, offer_id } = await req.json()

    // Validate required fields
    if (!ride_session_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ride_session_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!offer_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'offer_id is required' }),
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

    // SECURITY: Validate state transition (discovery -> hold)
    if (rideSession.status !== 'discovery') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `INVALID_STATE_TRANSITION: Cannot select offer from '${rideSession.status}' state. Expected 'discovery'.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get the offer
    const { data: offer, error: offerError } = await supabaseService
      .from('ride_offers')
      .select('*')
      .eq('id', offer_id)
      .eq('ride_session_id', ride_session_id)
      .single()

    if (offerError || !offer) {
      return new Response(
        JSON.stringify({ success: false, error: 'Offer not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Validate offer is still pending
    if (offer.status !== 'pending') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Offer is no longer available (status: ${offer.status})`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if offer has expired
    if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
      // Mark the offer as expired
      await supabaseService
        .from('ride_offers')
        .update({ status: 'expired' })
        .eq('id', offer_id)

      return new Response(
        JSON.stringify({ success: false, error: 'Offer has expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // === Begin transaction-like operations ===

    // 1. Accept the selected offer
    const { error: acceptError } = await supabaseService
      .from('ride_offers')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
      })
      .eq('id', offer_id)

    if (acceptError) {
      throw new Error(`Failed to accept offer: ${acceptError.message}`)
    }

    // 2. Reject all other pending offers for this ride
    await supabaseService
      .from('ride_offers')
      .update({
        status: 'rejected',
        responded_at: new Date().toISOString(),
      })
      .eq('ride_session_id', ride_session_id)
      .eq('status', 'pending')
      .neq('id', offer_id)

    // 3. Update ride session status to 'hold'
    const { error: updateError } = await supabaseService
      .from('ride_sessions')
      .update({
        status: 'hold',
        selected_driver_id: offer.driver_user_id,
        selected_offer_id: offer_id,
        final_fare_amount: offer.offered_amount || rideSession.rora_fare_amount,
        hold_started_at: new Date().toISOString(),
      })
      .eq('id', ride_session_id)

    if (updateError) {
      // Try to rollback offer acceptance
      await supabaseService
        .from('ride_offers')
        .update({ status: 'pending', responded_at: null })
        .eq('id', offer_id)

      throw new Error(`Failed to update ride session: ${updateError.message}`)
    }

    // 4. Log ride event (append-only audit log)
    await supabaseService.from('ride_events').insert({
      ride_session_id: ride_session_id,
      event_type: 'offer_accepted',
      event_data: {
        offer_id: offer_id,
        driver_user_id: offer.driver_user_id,
        offered_amount: offer.offered_amount,
        offer_type: offer.offer_type,
      },
      actor_user_id: userId || null,
      actor_type: userId ? 'rider' : 'guest',
    })

    // 5. Notify the driver that their offer was accepted
    await supabaseService.from('notifications').insert({
      user_id: offer.driver_user_id,
      title: 'Offer Accepted!',
      body: `Your offer for ${rideSession.origin_label} → ${rideSession.destination_label} was accepted. Please confirm to start the ride.`,
      data: {
        type: 'offer_accepted',
        ride_session_id: ride_session_id,
        offer_id: offer_id,
      },
      read: false,
    })

    // Send push notification to driver
    const { data: driverDevices } = await supabaseService
      .from('devices')
      .select('expo_push_token')
      .eq('user_id', offer.driver_user_id)
      .eq('is_active', true)

    if (driverDevices && driverDevices.length > 0) {
      try {
        const messages = driverDevices
          .filter(d => d.expo_push_token)
          .map(device => ({
            to: device.expo_push_token,
            title: 'Offer Accepted!',
            body: `Tap to confirm and start the ride.`,
            data: {
              type: 'offer_accepted',
              ride_session_id: ride_session_id,
            },
            sound: 'default',
            priority: 'high',
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

    return new Response(
      JSON.stringify({
        success: true,
        ride_session_id: ride_session_id,
        offer_id: offer_id,
        driver_user_id: offer.driver_user_id,
        final_fare_amount: offer.offered_amount || rideSession.rora_fare_amount,
        new_status: 'hold',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Select offer failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
