import { create } from 'zustand';
import type { LatLng } from 'react-native-maps';
import type { PlaceDetails, RouteData } from '@/src/store/route-store';
import type { PricingCalculationMetadata } from '@/src/types/pricing';
import type { RideOffer as ServiceRideOffer } from '@/src/services/rides.service';
import {
  createRideSession,
  startDiscovery,
  subscribeToRideOffers,
  subscribeToRideStatus,
  placeDetailsToRideLocation,
  selectOffer,
  cancelRide,
  fetchRideSession,
} from '@/src/services/rides.service';

// ============================================================================
// Types
// ============================================================================

/**
 * RideSheet UI State Machine
 *
 * IMPORTANT: This is a CLIENT-SIDE UI state machine that controls the ride
 * booking flow screens. It is SEPARATE from the SERVER-SIDE ride session
 * state machine (created → discovery → hold → confirmed → active → completed).
 *
 * UI State Machine (this store):
 *   IDLE → ROUTE_SET → QR_READY → DISCOVERING → OFFERS_RECEIVED → CONFIRMING → MATCHED
 *
 * Server State Machine (ride_sessions.status):
 *   created → discovery → [offers] → hold → confirmed → active → completed
 *                                                              ↘ canceled
 *
 * SECURITY BOUNDARY:
 * - UI states control what screens/components are shown (visual only)
 * - Server states enforce business rules and are the source of truth
 * - All state transitions that affect the ride must go through Edge Functions
 * - The UI MUST NOT trust its own state for security decisions
 *
 * See docs/security-validation.md for full details.
 */

/**
 * RideSheet UI state machine states
 *
 * IDLE          → Home state, "Where to?" search pill
 * ROUTE_SET     → Route calculated, showing fare summary
 * QR_READY      → QR code generated, ready to start discovery
 * DISCOVERING   → Actively searching for drivers
 * OFFERS_RECEIVED → One or more driver offers received
 * CONFIRMING    → User selected an offer, confirming selection
 * MATCHED       → Offer selected, waiting for driver to confirm (server: hold)
 * DRIVER_CONFIRMED → Driver confirmed the ride (server: confirmed)
 * DRIVER_ARRIVED → Driver arrived at pickup (server: arrived)
 * ACTIVE        → Ride in progress (server: active)
 * COMPLETED     → Ride finished, show summary + rating
 */
export type RideSheetState =
  | 'IDLE'
  | 'ROUTE_SET'
  | 'QR_READY'
  | 'DISCOVERING'
  | 'OFFERS_RECEIVED'
  | 'CONFIRMING'
  | 'MATCHED'
  | 'DRIVER_CONFIRMED'
  | 'DRIVER_ARRIVED'
  | 'ACTIVE'
  | 'COMPLETED';

/**
 * Extended offer type with driver location for map display
 */
export interface RideSheetOffer extends ServiceRideOffer {
  driverLocation?: LatLng;
}

/**
 * All data associated with the current ride flow
 */
export interface RideSheetData {
  // Route
  origin: PlaceDetails | null;
  destination: PlaceDetails | null;
  routeData: RouteData | null;

  // Fare
  fareAmount: number | null;
  pricingMetadata: PricingCalculationMetadata | null;

  // Session
  rideSessionId: string | null;
  qrTokenJti: string | null;

  // Discovery
  notifiedDriverCount: number;
  currentWave: number;
  discoveryStartedAt: string | null;

  // Offers
  offers: RideSheetOffer[];
  selectedOffer: RideSheetOffer | null;

  // Driver info (after match)
  driverName: string | null;
  driverPhone: string | null;
  driverPhoto: string | null;
  driverRating: number | null;
  vehicleInfo: string | null;
  vehicleLicensePlate: string | null;
  driverEta: number | null; // minutes
  driverLocation: { lat: number; lng: number } | null;

  // Ride progress
  arrivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  finalFareAmount: number | null;

  // Error state
  error: string | null;

  // Loading states for async operations
  isGeneratingQR: boolean;
  isStartingDiscovery: boolean;
  isConfirmingRide: boolean;
}

/**
 * Valid state transitions
 * Enforces the ride flow state machine
 */
const VALID_TRANSITIONS: Record<RideSheetState, RideSheetState[]> = {
  IDLE: ['ROUTE_SET'],
  ROUTE_SET: ['IDLE', 'QR_READY'],
  QR_READY: ['IDLE', 'ROUTE_SET', 'DISCOVERING'],
  DISCOVERING: ['IDLE', 'OFFERS_RECEIVED'],
  OFFERS_RECEIVED: ['IDLE', 'CONFIRMING', 'DISCOVERING'],
  CONFIRMING: ['OFFERS_RECEIVED', 'MATCHED'],
  MATCHED: ['IDLE', 'DRIVER_CONFIRMED', 'OFFERS_RECEIVED'], // Can timeout back to offers
  DRIVER_CONFIRMED: ['IDLE', 'DRIVER_ARRIVED'],
  DRIVER_ARRIVED: ['IDLE', 'ACTIVE'],
  ACTIVE: ['COMPLETED'], // Cannot cancel active ride (admin only)
  COMPLETED: ['IDLE'], // Terminal - user dismisses to go back to IDLE
};

/**
 * Map server ride status to UI state
 */
const SERVER_STATUS_TO_UI_STATE: Record<string, RideSheetState> = {
  hold: 'MATCHED',
  confirmed: 'DRIVER_CONFIRMED',
  arrived: 'DRIVER_ARRIVED',
  active: 'ACTIVE',
  completed: 'COMPLETED',
  canceled: 'IDLE',
  expired: 'IDLE',
};

/**
 * RideSheet store interface
 */
interface RideSheetStore {
  // State
  state: RideSheetState;
  data: RideSheetData;

  // Subscription cleanup
  _offersUnsubscribe: (() => void) | null;
  _statusUnsubscribe: (() => void) | null;

  // Route actions
  setRoute: (
    origin: PlaceDetails,
    destination: PlaceDetails,
    routeData: RouteData
  ) => void;

  // Fare actions
  setFare: (amount: number, metadata: PricingCalculationMetadata) => void;

  // QR actions
  generateQR: () => Promise<boolean>;

  // Discovery actions
  startDiscovery: () => Promise<boolean>;
  expandDiscovery: () => Promise<boolean>;

  // Offer actions
  addOffer: (offer: RideSheetOffer) => void;
  removeOffer: (offerId: string) => void;
  selectOffer: (offer: RideSheetOffer) => void;

  // Confirmation actions
  confirmRide: () => Promise<boolean>;
  backToOffers: () => void;

  // Server status sync
  handleServerStatusChange: (status: string) => void;
  refreshRideSession: () => Promise<void>;

  // Completion actions
  dismissCompletion: () => void;

  // Cancel/reset actions
  cancel: () => void;
  reset: () => void;

  // Internal helpers
  _transition: (newState: RideSheetState) => boolean;
  _cleanupSubscriptions: () => void;
  _subscribeToStatus: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialData: RideSheetData = {
  origin: null,
  destination: null,
  routeData: null,
  fareAmount: null,
  pricingMetadata: null,
  rideSessionId: null,
  qrTokenJti: null,
  notifiedDriverCount: 0,
  currentWave: 0,
  discoveryStartedAt: null,
  offers: [],
  selectedOffer: null,
  driverName: null,
  driverPhone: null,
  driverPhoto: null,
  driverRating: null,
  vehicleInfo: null,
  vehicleLicensePlate: null,
  driverEta: null,
  driverLocation: null,
  arrivedAt: null,
  startedAt: null,
  completedAt: null,
  finalFareAmount: null,
  error: null,
  isGeneratingQR: false,
  isStartingDiscovery: false,
  isConfirmingRide: false,
};

// ============================================================================
// Store
// ============================================================================

export const useRideSheetStore = create<RideSheetStore>((set, get) => ({
  // Initial state
  state: 'IDLE',
  data: { ...initialData },
  _offersUnsubscribe: null,
  _statusUnsubscribe: null,

  // -------------------------------------------------------------------------
  // Internal: State transition with validation
  // -------------------------------------------------------------------------
  _transition: (newState) => {
    const currentState = get().state;
    const validTransitions = VALID_TRANSITIONS[currentState];

    if (!validTransitions.includes(newState)) {
      console.warn(
        `[ride-sheet-store] Invalid transition: ${currentState} -> ${newState}`
      );
      return false;
    }

    set({ state: newState });
    return true;
  },

  // -------------------------------------------------------------------------
  // Internal: Cleanup realtime subscriptions
  // -------------------------------------------------------------------------
  _cleanupSubscriptions: () => {
    const offersUnsub = get()._offersUnsubscribe;
    if (offersUnsub) {
      offersUnsub();
      set({ _offersUnsubscribe: null });
    }
    const statusUnsub = get()._statusUnsubscribe;
    if (statusUnsub) {
      statusUnsub();
      set({ _statusUnsubscribe: null });
    }
  },

  // -------------------------------------------------------------------------
  // Internal: Subscribe to ride status changes
  // -------------------------------------------------------------------------
  _subscribeToStatus: () => {
    const { data, _statusUnsubscribe } = get();

    // Cleanup existing subscription
    if (_statusUnsubscribe) {
      _statusUnsubscribe();
    }

    if (!data.rideSessionId) {
      return;
    }

    const subscription = subscribeToRideStatus(
      data.rideSessionId,
      (status) => {
        get().handleServerStatusChange(status);
      }
    );

    set({ _statusUnsubscribe: subscription.unsubscribe });
  },

  // -------------------------------------------------------------------------
  // Route: Set origin, destination, and route data
  // -------------------------------------------------------------------------
  setRoute: (origin, destination, routeData) => {
    const { state, _transition } = get();

    // Can set route from IDLE or ROUTE_SET (editing)
    if (state !== 'IDLE' && state !== 'ROUTE_SET') {
      console.warn(
        `[ride-sheet-store] Cannot set route in state: ${state}`
      );
      return;
    }

    set({
      data: {
        ...get().data,
        origin,
        destination,
        routeData,
        // Clear downstream data when route changes
        fareAmount: null,
        pricingMetadata: null,
        rideSessionId: null,
        qrTokenJti: null,
        offers: [],
        selectedOffer: null,
        error: null,
      },
    });

    if (state === 'IDLE') {
      _transition('ROUTE_SET');
    }
  },

  // -------------------------------------------------------------------------
  // Fare: Set fare amount and pricing metadata
  // -------------------------------------------------------------------------
  setFare: (amount, metadata) => {
    const { state } = get();

    if (state !== 'ROUTE_SET') {
      console.warn(
        `[ride-sheet-store] Cannot set fare in state: ${state}`
      );
      return;
    }

    set({
      data: {
        ...get().data,
        fareAmount: amount,
        pricingMetadata: metadata,
      },
    });
  },

  // -------------------------------------------------------------------------
  // QR: Generate QR code by creating ride session
  // -------------------------------------------------------------------------
  generateQR: async () => {
    const { state, data, _transition } = get();

    if (state !== 'ROUTE_SET') {
      console.warn(
        `[ride-sheet-store] Cannot generate QR in state: ${state}`
      );
      return false;
    }

    if (!data.origin || !data.destination || !data.fareAmount) {
      set({
        data: { ...data, error: 'Missing route or fare information' },
      });
      return false;
    }

    set({ data: { ...data, isGeneratingQR: true, error: null } });

    try {
      const response = await createRideSession({
        origin: placeDetailsToRideLocation(data.origin),
        destination: placeDetailsToRideLocation(data.destination),
        rora_fare_amount: data.fareAmount,
        pricing_calculation_metadata: (data.pricingMetadata ?? undefined) as unknown as Record<string, unknown> | undefined,
        request_type: 'broadcast',
      });

      if (!response.success || !response.ride_session) {
        set({
          data: {
            ...get().data,
            error: response.error || 'Failed to create ride session',
            isGeneratingQR: false,
          },
        });
        return false;
      }

      set({
        data: {
          ...get().data,
          rideSessionId: response.ride_session.id,
          qrTokenJti: response.qr_token_jti || null,
          isGeneratingQR: false,
        },
      });

      return _transition('QR_READY');
    } catch (error) {
      set({
        data: {
          ...get().data,
          error: error instanceof Error ? error.message : 'Unknown error',
          isGeneratingQR: false,
        },
      });
      return false;
    }
  },

  // -------------------------------------------------------------------------
  // Discovery: Start looking for drivers
  // -------------------------------------------------------------------------
  startDiscovery: async () => {
    const { state, data, _transition, _cleanupSubscriptions } = get();

    if (state !== 'QR_READY') {
      console.warn(
        `[ride-sheet-store] Cannot start discovery in state: ${state}`
      );
      return false;
    }

    if (!data.rideSessionId) {
      set({
        data: { ...data, error: 'No ride session available' },
      });
      return false;
    }

    set({ data: { ...data, isStartingDiscovery: true, error: null } });

    try {
      const response = await startDiscovery(data.rideSessionId, 0);

      if (!response.success) {
        set({
          data: {
            ...get().data,
            error: response.error || 'Failed to start discovery',
            isStartingDiscovery: false,
          },
        });
        return false;
      }

      // Clean up any existing subscription before creating new one
      _cleanupSubscriptions();

      // Subscribe to offers
      const subscription = subscribeToRideOffers(
        data.rideSessionId,
        (offer) => {
          get().addOffer(offer as RideSheetOffer);
        }
      );

      set({
        data: {
          ...get().data,
          notifiedDriverCount: response.notified_drivers || 0,
          currentWave: response.wave || 0,
          discoveryStartedAt: new Date().toISOString(),
          isStartingDiscovery: false,
        },
        _offersUnsubscribe: subscription.unsubscribe,
      });

      return _transition('DISCOVERING');
    } catch (error) {
      set({
        data: {
          ...get().data,
          error: error instanceof Error ? error.message : 'Unknown error',
          isStartingDiscovery: false,
        },
      });
      return false;
    }
  },

  // -------------------------------------------------------------------------
  // Discovery: Expand search to wave 2+
  // -------------------------------------------------------------------------
  expandDiscovery: async () => {
    const { state, data } = get();

    if (state !== 'DISCOVERING' && state !== 'OFFERS_RECEIVED') {
      console.warn(
        `[ride-sheet-store] Cannot expand discovery in state: ${state}`
      );
      return false;
    }

    if (!data.rideSessionId) {
      return false;
    }

    const nextWave = data.currentWave + 1;

    try {
      const response = await startDiscovery(data.rideSessionId, nextWave);

      if (!response.success) {
        set({
          data: {
            ...get().data,
            error: response.error || 'Failed to expand search',
          },
        });
        return false;
      }

      set({
        data: {
          ...get().data,
          notifiedDriverCount:
            get().data.notifiedDriverCount + (response.notified_drivers || 0),
          currentWave: nextWave,
        },
      });

      return true;
    } catch (error) {
      set({
        data: {
          ...get().data,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      return false;
    }
  },

  // -------------------------------------------------------------------------
  // Offers: Add a new offer from realtime subscription
  // -------------------------------------------------------------------------
  addOffer: (offer) => {
    const { state, data, _transition } = get();

    // Only accept offers during discovery or offers state
    if (state !== 'DISCOVERING' && state !== 'OFFERS_RECEIVED') {
      console.warn(
        `[ride-sheet-store] Ignoring offer in state: ${state}`
      );
      return;
    }

    // Avoid duplicates
    if (data.offers.some((o) => o.id === offer.id)) {
      return;
    }

    // Add offer sorted by price (lowest first)
    const updatedOffers = [...data.offers, offer].sort((a, b) => {
      const aPrice = a.offered_amount ?? Infinity;
      const bPrice = b.offered_amount ?? Infinity;
      return aPrice - bPrice;
    });

    set({
      data: {
        ...data,
        offers: updatedOffers,
      },
    });

    // Auto-transition to OFFERS_RECEIVED on first offer
    if (state === 'DISCOVERING' && updatedOffers.length === 1) {
      _transition('OFFERS_RECEIVED');
    }
  },

  // -------------------------------------------------------------------------
  // Offers: Remove an expired/withdrawn offer
  // -------------------------------------------------------------------------
  removeOffer: (offerId) => {
    const { data } = get();

    set({
      data: {
        ...data,
        offers: data.offers.filter((o) => o.id !== offerId),
        // If the selected offer was removed, clear selection
        selectedOffer:
          data.selectedOffer?.id === offerId ? null : data.selectedOffer,
      },
    });
  },

  // -------------------------------------------------------------------------
  // Offers: Select an offer for confirmation
  // -------------------------------------------------------------------------
  selectOffer: (offer) => {
    const { state, data, _transition } = get();

    if (state !== 'OFFERS_RECEIVED') {
      console.warn(
        `[ride-sheet-store] Cannot select offer in state: ${state}`
      );
      return;
    }

    set({
      data: {
        ...data,
        selectedOffer: offer,
      },
    });

    _transition('CONFIRMING');
  },

  // -------------------------------------------------------------------------
  // Confirmation: Confirm the selected ride
  // -------------------------------------------------------------------------
  confirmRide: async () => {
    const { state, data, _transition } = get();

    if (state !== 'CONFIRMING') {
      console.warn(
        `[ride-sheet-store] Cannot confirm ride in state: ${state}`
      );
      return false;
    }

    if (!data.rideSessionId || !data.selectedOffer) {
      set({
        data: { ...data, error: 'No offer selected' },
      });
      return false;
    }

    set({ data: { ...data, isConfirmingRide: true, error: null } });

    try {
      // Call select-offer Edge Function (server-side validation)
      // This validates ownership, state transitions, and logs events
      const response = await selectOffer(
        data.rideSessionId,
        data.selectedOffer.id
      );

      if (!response.success) {
        set({
          data: {
            ...get().data,
            error: response.error || 'Failed to confirm ride',
            isConfirmingRide: false,
          },
        });
        return false;
      }

      // Extract driver info from selected offer
      const offer = data.selectedOffer;
      const driverProfile = offer?.driver_profile;

      set({
        data: {
          ...get().data,
          isConfirmingRide: false,
          driverName: driverProfile?.display_name || 'Your Driver',
          driverPhoto: driverProfile?.avatar_url || null,
          driverRating: driverProfile?.rating_average || null,
          vehicleInfo: driverProfile
            ? `${driverProfile.vehicle_make || ''} ${driverProfile.vehicle_model || ''}`.trim()
            : null,
          finalFareAmount: response.final_fare_amount || offer?.offered_amount || data.fareAmount,
        },
      });

      const transitioned = _transition('MATCHED');

      // Start listening for status changes (driver confirms, arrives, etc.)
      if (transitioned) {
        get()._subscribeToStatus();
      }

      return transitioned;
    } catch (error) {
      set({
        data: {
          ...get().data,
          error: error instanceof Error ? error.message : 'Unknown error',
          isConfirmingRide: false,
        },
      });
      return false;
    }
  },

  // -------------------------------------------------------------------------
  // Confirmation: Go back to offers list
  // -------------------------------------------------------------------------
  backToOffers: () => {
    const { state, _transition } = get();

    if (state !== 'CONFIRMING') {
      return;
    }

    set({
      data: {
        ...get().data,
        selectedOffer: null,
      },
    });

    _transition('OFFERS_RECEIVED');
  },

  // -------------------------------------------------------------------------
  // Server Status: Handle status changes from realtime subscription
  // -------------------------------------------------------------------------
  handleServerStatusChange: (status: string) => {
    const { state, data } = get();
    const newUiState = SERVER_STATUS_TO_UI_STATE[status];

    if (!newUiState) {
      console.warn(
        `[ride-sheet-store] Unknown server status: ${status}`
      );
      return;
    }

    // If canceled or expired, reset to IDLE
    if (newUiState === 'IDLE') {
      get()._cleanupSubscriptions();
      set({
        state: 'IDLE',
        data: { ...initialData },
      });
      return;
    }

    // Update state based on server status
    // We bypass normal transition validation since server is authoritative
    console.log(
      `[ride-sheet-store] Server status change: ${status} -> UI state: ${newUiState}`
    );

    // Update timestamps based on status
    const updates: Partial<RideSheetData> = {};
    if (status === 'arrived' && !data.arrivedAt) {
      updates.arrivedAt = new Date().toISOString();
    }
    if (status === 'active' && !data.startedAt) {
      updates.startedAt = new Date().toISOString();
    }
    if (status === 'completed' && !data.completedAt) {
      updates.completedAt = new Date().toISOString();
    }

    set({
      state: newUiState,
      data: { ...data, ...updates },
    });
  },

  // -------------------------------------------------------------------------
  // Refresh: Fetch latest ride session data from server
  // -------------------------------------------------------------------------
  refreshRideSession: async () => {
    const { data } = get();

    if (!data.rideSessionId) {
      return;
    }

    try {
      const response = await fetchRideSession(data.rideSessionId);

      if (response.success && response.ride_session) {
        const session = response.ride_session;

        // Update driver info if available
        set({
          data: {
            ...get().data,
            arrivedAt: session.arrived_at || null,
            completedAt: session.completed_at || null,
            finalFareAmount: session.final_agreed_amount || null,
          },
        });

        // Sync UI state with server status
        if (session.status) {
          get().handleServerStatusChange(session.status);
        }
      }
    } catch (error) {
      console.error('[ride-sheet-store] Failed to refresh ride session:', error);
    }
  },

  // -------------------------------------------------------------------------
  // Completion: Dismiss completion screen and reset
  // -------------------------------------------------------------------------
  dismissCompletion: () => {
    const { state, _cleanupSubscriptions } = get();

    if (state !== 'COMPLETED') {
      return;
    }

    _cleanupSubscriptions();

    set({
      state: 'IDLE',
      data: { ...initialData },
    });
  },

  // -------------------------------------------------------------------------
  // Cancel: Cancel current flow and return to IDLE
  // -------------------------------------------------------------------------
  cancel: () => {
    const { state, data, _cleanupSubscriptions } = get();

    // Cannot cancel from ACTIVE (would need admin intervention)
    if (state === 'ACTIVE') {
      console.warn(
        '[ride-sheet-store] Cannot cancel active ride - contact support'
      );
      return;
    }

    // Cannot cancel from COMPLETED
    if (state === 'COMPLETED') {
      console.warn(
        '[ride-sheet-store] Cannot cancel completed ride'
      );
      return;
    }

    // If we have a ride session, notify the server (fire-and-forget for better UX)
    // Server validates ownership and state, logs event, notifies affected drivers
    if (data.rideSessionId) {
      cancelRide(data.rideSessionId, 'user_canceled').catch((error) => {
        // Log but don't block - local state is already reset
        console.warn('[ride-sheet-store] Failed to cancel ride on server:', error);
      });
    }

    _cleanupSubscriptions();

    set({
      state: 'IDLE',
      data: { ...initialData },
    });
  },

  // -------------------------------------------------------------------------
  // Reset: Full reset to initial state
  // -------------------------------------------------------------------------
  reset: () => {
    get()._cleanupSubscriptions();

    set({
      state: 'IDLE',
      data: { ...initialData },
      _offersUnsubscribe: null,
      _statusUnsubscribe: null,
    });
  },
}));
