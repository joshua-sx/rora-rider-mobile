import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { PlaceDetails } from '../store/route-store';

/**
 * Ride session data returned from server
 */
export interface RideSession {
  id: string;
  region_id: string;
  rider_user_id: string | null;
  guest_token_id: string | null;
  status: string;
  origin_lat: number;
  origin_lng: number;
  origin_label: string;
  destination_lat: number;
  destination_lng: number;
  destination_label: string;
  rora_fare_amount: number;
  qr_token_jti: string;
  created_at: string;
}

/**
 * Create ride session request payload
 */
export interface CreateRideSessionRequest {
  origin: {
    lat: number;
    lng: number;
    label: string;
  };
  destination: {
    lat: number;
    lng: number;
    label: string;
    freeform_name?: string;
  };
  rora_fare_amount: number;
  pricing_calculation_metadata?: Record<string, unknown>;
  request_type?: 'broadcast' | 'direct';
  target_driver_id?: string;
}

/**
 * Create ride session response
 */
export interface CreateRideSessionResponse {
  success: boolean;
  ride_session?: RideSession;
  qr_token_jti?: string;
  error?: string;
  /** Indicates if mock/offline data was returned instead of real data */
  isMockData?: boolean;
}

/**
 * Start discovery response
 */
export interface StartDiscoveryResponse {
  success: boolean;
  notified_drivers?: number;
  wave?: number;
  error?: string;
}

/**
 * Create a ride session on the server
 *
 * This calls the create-ride-session Edge Function which:
 * - Creates a ride_sessions record in the database
 * - Logs a 'created' event to ride_events
 * - Returns a QR token JTI for the QR code
 *
 * Returns isMockData: true when returning offline/development fallback data
 */
export async function createRideSession(
  request: CreateRideSessionRequest
): Promise<CreateRideSessionResponse> {
  // Helper to create mock ride session data
  const createMockResponse = (prefix: string): CreateRideSessionResponse => {
    const timestamp = Date.now();
    const qrTokenJti = `${prefix}-qr-${timestamp}`;
    return {
      success: true,
      isMockData: true,
      ride_session: {
        id: `${prefix}-ride-${timestamp}`,
        region_id: `${prefix}-region`,
        rider_user_id: null,
        guest_token_id: null,
        status: 'created',
        origin_lat: request.origin.lat,
        origin_lng: request.origin.lng,
        origin_label: request.origin.label,
        destination_lat: request.destination.lat,
        destination_lng: request.destination.lng,
        destination_label: request.destination.label,
        rora_fare_amount: request.rora_fare_amount,
        qr_token_jti: qrTokenJti,
        created_at: new Date(timestamp).toISOString(),
      },
      qr_token_jti: qrTokenJti,
    };
  };

  if (!isSupabaseConfigured()) {
    console.warn('[rides.service] Supabase not configured, returning mock response');
    return createMockResponse('mock');
  }

  try {
    const { data, error } = await supabase.functions.invoke('create-ride-session', {
      body: request,
    });

    if (error) {
      console.warn('[rides.service] Edge function error, using local fallback:', error.message);
      // Return mock response with isMockData flag so caller knows this is fallback data
      return createMockResponse('local');
    }

    // Validate response structure
    const response = data as CreateRideSessionResponse;
    if (!response || typeof response.success !== 'boolean') {
      console.warn('[rides.service] Invalid response format from server');
      return {
        success: false,
        error: 'Invalid response format from server',
      };
    }

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[rides.service] Error creating ride session, using local fallback:', errorMessage);
    // Return mock response with isMockData flag so caller knows this is fallback data
    return createMockResponse('local');
  }
}

/**
 * Start driver discovery for a ride session
 *
 * This calls the start-discovery Edge Function which:
 * - Updates ride status to 'discovery'
 * - Notifies drivers via inbox notifications
 * - Triggers push notifications to nearby drivers
 * - Returns the number of drivers notified
 */
export async function startDiscovery(
  rideSessionId: string,
  wave: number = 0
): Promise<StartDiscoveryResponse> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, returning mock response');
    // Simulate 3-5 drivers notified
    return {
      success: true,
      notified_drivers: Math.floor(Math.random() * 3) + 3,
      wave,
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('start-discovery', {
      body: {
        ride_session_id: rideSessionId,
        wave,
      },
    });

    if (error) {
      console.error('Failed to start discovery:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return data as StartDiscoveryResponse;
  } catch (error) {
    console.error('Error starting discovery:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Helper to convert PlaceDetails to ride session format
 */
export function placeDetailsToRideLocation(place: PlaceDetails): {
  lat: number;
  lng: number;
  label: string;
} {
  return {
    lat: place.coordinates.latitude,
    lng: place.coordinates.longitude,
    label: place.name,
  };
}

/**
 * Subscribe to ride offers for a ride session
 *
 * Returns a subscription that can be unsubscribed from
 */
export function subscribeToRideOffers(
  rideSessionId: string,
  onOffer: (offer: RideOffer) => void
) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, offers subscription not available');
    return { unsubscribe: () => {} };
  }

  const subscription = supabase
    .channel(`ride-offers-${rideSessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ride_offers',
        filter: `ride_session_id=eq.${rideSessionId}`,
      },
      (payload) => {
        onOffer(payload.new as RideOffer);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(subscription);
    },
  };
}

/**
 * Subscribe to ride session status changes
 */
export function subscribeToRideStatus(
  rideSessionId: string,
  onStatusChange: (status: string) => void
) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, status subscription not available');
    return { unsubscribe: () => {} };
  }

  const subscription = supabase
    .channel(`ride-status-${rideSessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ride_sessions',
        filter: `id=eq.${rideSessionId}`,
      },
      (payload) => {
        const newStatus = (payload.new as { status: string }).status;
        onStatusChange(newStatus);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(subscription);
    },
  };
}

/**
 * Ride offer from a driver
 */
export interface RideOffer {
  id: string;
  ride_session_id: string;
  driver_user_id: string;
  offer_type: 'accept' | 'counter';
  offered_amount: number | null;
  note: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  expires_at: string;
  // Joined driver profile data (if available)
  driver_profile?: {
    display_name: string;
    avatar_url: string | null;
    rating_average: number | null;
    rating_count: number | null;
    vehicle_type: string | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
  };
}

/**
 * Result type for fetch ride offers operation
 */
export interface FetchRideOffersResult {
  success: boolean;
  offers: RideOffer[];
  error?: string;
  /** True if Supabase is not configured (development mode) */
  isUnconfigured?: boolean;
}

/**
 * Fetch offers for a ride session
 * Returns a result object that distinguishes between "no offers" and "error fetching"
 */
export async function fetchRideOffers(rideSessionId: string): Promise<FetchRideOffersResult> {
  if (!isSupabaseConfigured()) {
    console.warn('[rides.service] Supabase not configured, returning empty offers');
    return { success: true, offers: [], isUnconfigured: true };
  }

  try {
    const { data, error } = await supabase
      .from('ride_offers')
      .select(`
        *,
        driver_profile:driver_profiles(
          display_name,
          avatar_url,
          rating_average,
          rating_count,
          vehicle_type,
          vehicle_make,
          vehicle_model
        )
      `)
      .eq('ride_session_id', rideSessionId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      const errorMessage = `Failed to fetch ride offers: ${error.message}`;
      console.error('[rides.service]', errorMessage);
      return { success: false, offers: [], error: errorMessage };
    }

    return { success: true, offers: (data || []) as unknown as RideOffer[] };
  } catch (error) {
    const errorMessage = error instanceof Error
      ? `Error fetching ride offers: ${error.message}`
      : 'Error fetching ride offers: Unknown error';
    console.error('[rides.service]', errorMessage);
    return { success: false, offers: [], error: errorMessage };
  }
}
