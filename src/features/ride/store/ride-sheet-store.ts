import { create } from 'zustand';
import type { LatLng } from 'react-native-maps';
import type { PlaceDetails, RouteData } from '@/src/store/route-store';
import type { PricingCalculationMetadata } from '@/src/types/pricing';
import type { RideOffer as ServiceRideOffer } from '@/src/services/rides.service';
import {
  createRideSession,
  startDiscovery,
  subscribeToRideOffers,
  placeDetailsToRideLocation,
  selectOffer,
  cancelRide,
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
 * MATCHED       → Driver confirmed, transitioning to active ride
 */
export type RideSheetState =
  | 'IDLE'
  | 'ROUTE_SET'
  | 'QR_READY'
  | 'DISCOVERING'
  | 'OFFERS_RECEIVED'
  | 'CONFIRMING'
  | 'MATCHED';

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
  MATCHED: [], // Terminal state - transitions to active ride flow
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

  // Cancel/reset actions
  cancel: () => void;
  reset: () => void;

  // Internal helpers
  _transition: (newState: RideSheetState) => boolean;
  _cleanupSubscriptions: () => void;
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
    const unsubscribe = get()._offersUnsubscribe;
    if (unsubscribe) {
      unsubscribe();
      set({ _offersUnsubscribe: null });
    }
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

      set({
        data: {
          ...get().data,
          isConfirmingRide: false,
        },
      });

      return _transition('MATCHED');
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
  // Cancel: Cancel current flow and return to IDLE
  // -------------------------------------------------------------------------
  cancel: () => {
    const { state, data, _cleanupSubscriptions } = get();

    // Cannot cancel from MATCHED (would need separate cancellation flow)
    if (state === 'MATCHED') {
      console.warn(
        '[ride-sheet-store] Cannot cancel from MATCHED state'
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
    });
  },
}));
