import { create } from 'zustand';
import type { LatLng } from 'react-native-maps';

// #region agent log
const DEBUG_LOG = (location: string, message: string, data: any) => {
	fetch('http://127.0.0.1:7245/ingest/3b0f41df-1efc-4a19-8400-3cd0c3ae335a', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location, message, data, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: data.hypothesisId || 'A' }) }).catch(() => {});
};
// #endregion

export interface PlaceDetails {
  placeId: string;
  name: string;
  description: string;
  coordinates: LatLng;
}

export interface RouteData {
  distance: number; // km
  duration: number; // minutes
  price: number; // USD
  coordinates: LatLng[]; // polyline coordinates
}

interface RouteStore {
  // Location data
  origin: PlaceDetails | null;
  destination: PlaceDetails | null;

  // Route data
  routeData: RouteData | null;

  // UI state
  error: string | null;

  // Actions
  setOrigin: (place: PlaceDetails | null) => void;
  setDestination: (place: PlaceDetails | null) => void;
  setRouteData: (data: RouteData | null) => void;
  setError: (error: string | null) => void;
  swapLocations: () => void;
  reset: () => void;
}

export const useRouteStore = create<RouteStore>((set, get) => ({
  // Initial state
  origin: null,
  destination: null,
  routeData: null,
  error: null,

  // Actions
  setOrigin: (origin) => {
    // #region agent log
    DEBUG_LOG('route-store.ts:46', 'setOrigin called', { hypothesisId: 'A', origin: origin ? { placeId: origin.placeId, name: origin.name } : null });
    // #endregion
    set({ origin, error: null });
    // #region agent log
    const state = get();
    DEBUG_LOG('route-store.ts:49', 'setOrigin state after update', { hypothesisId: 'D', origin: state.origin ? { placeId: state.origin.placeId, name: state.origin.name } : null, destination: state.destination ? { placeId: state.destination.placeId, name: state.destination.name } : null });
    // #endregion
  },

  setDestination: (destination) => {
    // #region agent log
    DEBUG_LOG('route-store.ts:48', 'setDestination called', { hypothesisId: 'A', destination: destination ? { placeId: destination.placeId, name: destination.name } : null });
    // #endregion
    set({ destination, error: null });
    // #region agent log
    const state = get();
    DEBUG_LOG('route-store.ts:51', 'setDestination state after update', { hypothesisId: 'D', origin: state.origin ? { placeId: state.origin.placeId, name: state.origin.name } : null, destination: state.destination ? { placeId: state.destination.placeId, name: state.destination.name } : null });
    // #endregion
  },

  setRouteData: (routeData) => set({ routeData }),

  setError: (error) => set({ error }),

  swapLocations: () => {
    const { origin, destination } = get();
    set({
      origin: destination,
      destination: origin,
      routeData: null, // Clear route data on swap
    });
  },

  reset: () =>
    set({
      origin: null,
      destination: null,
      routeData: null,
      error: null,
    }),
}));
