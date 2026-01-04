import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-guest-token',
}

/**
 * Start Discovery Edge Function
 *
 * Initiates ride discovery by broadcasting to drivers in waves:
 * - Wave 0: Favorited drivers
 * - Wave 1: Nearby drivers with matching service area tags
 * - Wave 2+: Expanded radius (handled by separate expansion job)
 *
 * Spec refs: SPEC §8, FR-20, FR-21, FR-22
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ride_session_id } = await req.json()

    if (!ride_session_id) {
      return new Response(
        JSON.stringify({ error: 'ride_session_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get ride session details
    const { data: rideSession, error: sessionError } = await supabase
      .from('ride_sessions')
      .select('*')
      .eq('id', ride_session_id)
      .single()

    if (sessionError || !rideSession) {
      return new Response(
        JSON.stringify({ error: 'Ride session not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Validate session is in 'created' state
    if (rideSession.status !== 'created') {
      return new Response(
        JSON.stringify({ error: `Invalid state: session is ${rideSession.status}, expected created` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Update session status to 'discovery'
    const { error: updateError } = await supabase
      .from('ride_sessions')
      .update({
        status: 'discovery',
        discovery_started_at: new Date().toISOString(),
        current_wave: 0,
      })
      .eq('id', ride_session_id)

    if (updateError) {
      throw new Error(`Failed to update session status: ${updateError.message}`)
    }

    // Log discovery started event
    await supabase.from('ride_events').insert({
      ride_session_id: ride_session_id,
      event_type: 'discovery_started',
      actor_type: rideSession.rider_user_id ? 'rider' : 'system',
      actor_user_id: rideSession.rider_user_id,
    })

    // Get region config for discovery radius
    const { data: region } = await supabase
      .from('regions')
      .select('discovery_radius_config')
      .eq('id', rideSession.region_id)
      .single()

    const discoveryConfig = region?.discovery_radius_config || {
      wave_1_radius_km: 5,
      wave_2_radius_km: 10,
      wave_3_radius_km: 20,
    }

    let notifiedDriverIds: string[] = []

    // WAVE 0: Favorited drivers
    if (rideSession.rider_user_id) {
      const { data: favorites } = await supabase
        .from('favorites')
        .select('driver_user_id')
        .eq('rider_user_id', rideSession.rider_user_id)

      const favoritedDriverIds = favorites?.map(f => f.driver_user_id) || []

      if (favoritedDriverIds.length > 0) {
        // Get active driver profiles
        const { data: favoritedDrivers } = await supabase
          .from('driver_profiles')
          .select('user_id, current_lat, current_lng')
          .in('user_id', favoritedDriverIds)
          .eq('is_active', true)
          .eq('accepting_requests', true)

        if (favoritedDrivers && favoritedDrivers.length > 0) {
          // Notify favorited drivers
          await notifyDrivers(
            supabase,
            favoritedDrivers.map(d => d.user_id),
            rideSession,
            0 // Wave 0
          )
          notifiedDriverIds.push(...favoritedDrivers.map(d => d.user_id))
        }
      }
    }

    // WAVE 1: Nearby drivers with service area tag matching
    const wave1RadiusKm = discoveryConfig.wave_1_radius_km

    // Determine service area tags from origin/destination
    const serviceAreaTags = await determineServiceAreaTags(
      supabase,
      rideSession.origin_lat,
      rideSession.origin_lng,
      rideSession.destination_lat,
      rideSession.destination_lng,
      rideSession.region_id
    )

    // Find nearby drivers
    // Note: This uses a simple bounding box query. For production, consider PostGIS
    const { data: nearbyDrivers } = await supabase
      .from('driver_profiles')
      .select('user_id, current_lat, current_lng, service_area_tags')
      .eq('region_id', rideSession.region_id)
      .eq('is_active', true)
      .eq('accepting_requests', true)
      .not('user_id', 'in', `(${notifiedDriverIds.join(',')})`) // Exclude already notified

    // Filter by distance and prioritize by service area match
    const wave1Drivers: string[] = []
    const wave1PriorityDrivers: string[] = []

    for (const driver of nearbyDrivers || []) {
      if (!driver.current_lat || !driver.current_lng) continue

      const distance = calculateHaversineDistance(
        rideSession.origin_lat,
        rideSession.origin_lng,
        driver.current_lat,
        driver.current_lng
      )

      if (distance <= wave1RadiusKm) {
        // Check for service area tag match
        const hasMatchingTag = serviceAreaTags.some(tag =>
          driver.service_area_tags?.includes(tag)
        )

        if (hasMatchingTag) {
          wave1PriorityDrivers.push(driver.user_id)
        } else {
          wave1Drivers.push(driver.user_id)
        }
      }
    }

    // Notify priority drivers first, then others
    const allWave1Drivers = [...wave1PriorityDrivers, ...wave1Drivers]

    if (allWave1Drivers.length > 0) {
      await notifyDrivers(supabase, allWave1Drivers, rideSession, 1)
      notifiedDriverIds.push(...allWave1Drivers)
    }

    return new Response(
      JSON.stringify({
        success: true,
        ride_session_id,
        notified_driver_count: notifiedDriverIds.length,
        wave_0_count: notifiedDriverIds.length - allWave1Drivers.length,
        wave_1_count: allWave1Drivers.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Start discovery failed:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

/**
 * Calculate haversine distance between two points in kilometers
 */
function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const EARTH_RADIUS_KM = 6371
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

  return EARTH_RADIUS_KM * c
}

/**
 * Determine service area tags based on origin/destination proximity to zones
 */
async function determineServiceAreaTags(
  supabase: any,
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  regionId: string
): Promise<string[]> {
  const tags: string[] = []

  // Get all zones in region
  const { data: zones } = await supabase
    .from('pricing_zones')
    .select('zone_name, center_lat, center_lng, radius_meters, service_area_tag')
    .eq('region_id', regionId)
    .eq('is_active', true)

  for (const zone of zones || []) {
    // Check if origin or destination is in this zone
    const originDistance = calculateHaversineDistance(
      originLat,
      originLng,
      zone.center_lat,
      zone.center_lng
    )
    const destDistance = calculateHaversineDistance(
      destLat,
      destLng,
      zone.center_lat,
      zone.center_lng
    )

    const radiusKm = zone.radius_meters / 1000

    if (
      (originDistance <= radiusKm || destDistance <= radiusKm) &&
      zone.service_area_tag
    ) {
      tags.push(zone.service_area_tag)
    }
  }

  return tags
}

/**
 * Notify drivers about ride session
 */
async function notifyDrivers(
  supabase: any,
  driverUserIds: string[],
  rideSession: any,
  wave: number
): Promise<void> {
  // Get push tokens for drivers
  const { data: devices } = await supabase
    .from('devices')
    .select('user_id, expo_push_token')
    .in('user_id', driverUserIds)
    .eq('is_active', true)

  const pushTokens = devices?.filter(d => d.expo_push_token) || []

  // Create inbox notifications for all drivers
  const inboxNotifications = driverUserIds.map(driverId => ({
    user_id: driverId,
    title: 'New Ride Request',
    body: `${rideSession.origin_label} → ${rideSession.destination_label} • Rora Fare: $${rideSession.rora_fare_amount}`,
    data: {
      type: 'new_ride_request',
      ride_session_id: rideSession.id,
      origin: rideSession.origin_label,
      destination: rideSession.destination_label,
      fare: rideSession.rora_fare_amount,
      wave,
    },
    read: false,
  }))

  await supabase.from('notifications').insert(inboxNotifications)

  // Send push notifications (non-blocking)
  if (pushTokens.length > 0) {
    try {
      const messages = pushTokens.map(device => ({
        to: device.expo_push_token,
        title: 'New Ride Request',
        body: `${rideSession.origin_label} → ${rideSession.destination_label}`,
        data: {
          type: 'new_ride_request',
          ride_session_id: rideSession.id,
        },
        sound: 'default',
        priority: 'high',
      }))

      // Send to Expo Push API
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      })
    } catch (error) {
      console.error('Failed to send push notifications:', error)
      // Don't fail the whole operation if push fails
    }
  }
}
