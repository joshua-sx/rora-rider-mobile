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

// =============================================================================
// OFFER SELECTION
// =============================================================================

/**
 * Select offer response
 */
export interface SelectOfferResponse {
  success: boolean;
  ride_session_id?: string;
  offer_id?: string;
  driver_user_id?: string;
  final_fare_amount?: number;
  new_status?: string;
  error?: string;
}

/**
 * Select (accept) a driver's offer
 *
 * This calls the select-offer Edge Function which:
 * - Validates the rider owns the ride session
 * - Validates the ride is in 'discovery' state
 * - Validates the offer is still pending and not expired
 * - Accepts the selected offer and rejects all others
 * - Transitions ride to 'hold' state
 * - Notifies the selected driver
 */
export async function selectOffer(
  rideSessionId: string,
  offerId: string
): Promise<SelectOfferResponse> {
  if (!isSupabaseConfigured()) {
    console.warn('[rides.service] Supabase not configured, returning mock response');
    return {
      success: true,
      ride_session_id: rideSessionId,
      offer_id: offerId,
      new_status: 'hold',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('select-offer', {
      body: {
        ride_session_id: rideSessionId,
        offer_id: offerId,
      },
    });

    if (error) {
      console.error('[rides.service] Failed to select offer:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return data as SelectOfferResponse;
  } catch (error) {
    console.error('[rides.service] Error selecting offer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// RIDE CANCELLATION
// =============================================================================

/**
 * Cancel ride response
 */
export interface CancelRideResponse {
  success: boolean;
  ride_session_id?: string;
  previous_status?: string;
  new_status?: string;
  error?: string;
}

/**
 * Cancel a ride session
 *
 * This calls the cancel-ride Edge Function which:
 * - Validates the rider/guest owns the ride session
 * - Validates the ride is in a cancelable state (created, discovery, hold)
 * - Transitions ride to 'canceled' state
 * - Rejects any pending/accepted offers
 * - Notifies affected driver (if any)
 */
export async function cancelRide(
  rideSessionId: string,
  reason?: string
): Promise<CancelRideResponse> {
  if (!isSupabaseConfigured()) {
    console.warn('[rides.service] Supabase not configured, returning mock response');
    return {
      success: true,
      ride_session_id: rideSessionId,
      previous_status: 'discovery',
      new_status: 'canceled',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('cancel-ride', {
      body: {
        ride_session_id: rideSessionId,
        reason,
      },
    });

    if (error) {
      console.error('[rides.service] Failed to cancel ride:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return data as CancelRideResponse;
  } catch (error) {
    console.error('[rides.service] Error canceling ride:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// RIDE SESSION FETCHING
// =============================================================================

/**
 * Fetch ride session response
 */
export interface FetchRideSessionResponse {
  success: boolean;
  ride_session?: RideSession & {
    selected_driver_id?: string | null;
    selected_offer_id?: string | null;
    final_agreed_amount?: number | null;
    arrived_at?: string | null;
    confirmed_at?: string | null;
    completed_at?: string | null;
  };
  error?: string;
}

/**
 * Fetch a single ride session by ID
 */
export async function fetchRideSession(
  rideSessionId: string
): Promise<FetchRideSessionResponse> {
  if (!isSupabaseConfigured()) {
    console.warn('[rides.service] Supabase not configured');
    return {
      success: false,
      error: 'Supabase not configured',
    };
  }

  try {
    const { data, error } = await supabase
      .from('ride_sessions')
      .select('*')
      .eq('id', rideSessionId)
      .single();

    if (error) {
      console.error('[rides.service] Failed to fetch ride session:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      ride_session: data as FetchRideSessionResponse['ride_session'],
    };
  } catch (error) {
    console.error('[rides.service] Error fetching ride session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// DRIVER ARRIVAL (for driver app, but useful for testing)
// =============================================================================

/**
 * Mark driver arrived response
 */
export interface MarkDriverArrivedResponse {
  success: boolean;
  ride_session_id?: string;
  new_status?: string;
  arrived_at?: string;
  message?: string;
  error?: string;
}

/**
 * Mark driver as arrived at pickup location
 *
 * This calls the mark-driver-arrived Edge Function which:
 * - Validates the driver is the selected driver
 * - Validates the ride is in 'confirmed' state
 * - Transitions ride to 'arrived' state
 * - Notifies the rider
 */
export async function markDriverArrived(
  rideSessionId: string,
  driverLocation?: { lat: number; lng: number }
): Promise<MarkDriverArrivedResponse> {
  if (!isSupabaseConfigured()) {
    console.warn('[rides.service] Supabase not configured, returning mock response');
    return {
      success: true,
      ride_session_id: rideSessionId,
      new_status: 'arrived',
      arrived_at: new Date().toISOString(),
      message: 'Driver arrival marked (mock)',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('mark-driver-arrived', {
      body: {
        ride_session_id: rideSessionId,
        driver_location: driverLocation,
      },
    });

    if (error) {
      console.error('[rides.service] Failed to mark driver arrived:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return data as MarkDriverArrivedResponse;
  } catch (error) {
    console.error('[rides.service] Error marking driver arrived:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// QR TOKEN CLAIM (for driver app, but useful for testing)
// =============================================================================

/**
 * Claim QR token response
 */
export interface ClaimQRTokenResponse {
  success: boolean;
  ride_session?: {
    id: string;
    status: string;
    origin_label: string;
    destination_label: string;
    final_agreed_amount: number | null;
    rider_name: string;
    is_guest: boolean;
    qr_claimed_at: string;
  };
  message?: string;
  error?: string;
  distance_meters?: number;
  max_allowed_meters?: number;
}

/**
 * Claim (validate) a QR token
 *
 * This calls the claim-qr-token Edge Function which:
 * - Validates the JWT token signature and expiry
 * - Validates the ride is in 'arrived' state
 * - Validates the driver is the selected driver
 * - Validates the driver is within 500m geofence (if location provided)
 * - Marks the QR as claimed (preventing replay attacks)
 */
export async function claimQRToken(
  qrTokenJwt: string,
  driverLocation?: { lat: number; lng: number }
): Promise<ClaimQRTokenResponse> {
  if (!isSupabaseConfigured()) {
    console.warn('[rides.service] Supabase not configured, returning mock response');
    return {
      success: true,
      ride_session: {
        id: 'mock-ride-session',
        status: 'arrived',
        origin_label: 'Mock Origin',
        destination_label: 'Mock Destination',
        final_agreed_amount: 20,
        rider_name: 'Mock Rider',
        is_guest: false,
        qr_claimed_at: new Date().toISOString(),
      },
      message: 'QR token validated (mock)',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('claim-qr-token', {
      body: {
        qr_token_jwt: qrTokenJwt,
        driver_location: driverLocation,
      },
    });

    if (error) {
      console.error('[rides.service] Failed to claim QR token:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return data as ClaimQRTokenResponse;
  } catch (error) {
    console.error('[rides.service] Error claiming QR token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// RIDE ACTIVATION (for driver app, but useful for testing)
// =============================================================================

/**
 * Activate ride response
 */
export interface ActivateRideResponse {
  success: boolean;
  ride_session_id?: string;
  new_status?: string;
  error?: string;
}

/**
 * Activate a ride (start the trip)
 *
 * This calls the activate-ride Edge Function which:
 * - Validates the driver is the selected driver
 * - Validates the ride is in 'arrived' state
 * - Validates the QR was claimed
 * - Transitions ride to 'active' state
 * - Notifies the rider
 */
export async function activateRide(
  rideSessionId: string
): Promise<ActivateRideResponse> {
  if (!isSupabaseConfigured()) {
    console.warn('[rides.service] Supabase not configured, returning mock response');
    return {
      success: true,
      ride_session_id: rideSessionId,
      new_status: 'active',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('activate-ride', {
      body: {
        ride_session_id: rideSessionId,
      },
    });

    if (error) {
      console.error('[rides.service] Failed to activate ride:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return data as ActivateRideResponse;
  } catch (error) {
    console.error('[rides.service] Error activating ride:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// RIDE COMPLETION (for driver app, but useful for testing)
// =============================================================================

/**
 * Complete ride response
 */
export interface CompleteRideResponse {
  success: boolean;
  ride_session_id?: string;
  new_status?: string;
  completed_at?: string;
  final_agreed_amount?: number;
  error?: string;
}

/**
 * Complete a ride
 *
 * This calls the complete-ride Edge Function which:
 * - Validates the driver is the selected driver
 * - Validates the ride is in 'active' state
 * - Transitions ride to 'completed' state
 * - Notifies the rider
 */
export async function completeRide(
  rideSessionId: string,
  finalAgreedAmount?: number
): Promise<CompleteRideResponse> {
  if (!isSupabaseConfigured()) {
    console.warn('[rides.service] Supabase not configured, returning mock response');
    return {
      success: true,
      ride_session_id: rideSessionId,
      new_status: 'completed',
      completed_at: new Date().toISOString(),
      final_agreed_amount: finalAgreedAmount ?? 20,
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('complete-ride', {
      body: {
        ride_session_id: rideSessionId,
        final_agreed_amount: finalAgreedAmount,
      },
    });

    if (error) {
      console.error('[rides.service] Failed to complete ride:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return data as CompleteRideResponse;
  } catch (error) {
    console.error('[rides.service] Error completing ride:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
