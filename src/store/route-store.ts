import { create } from 'zustand';
import type { LatLng } from 'react-native-maps';

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
    const currentOrigin = get().origin;
    const shouldClearRoute =
      !origin || !currentOrigin || origin.placeId !== currentOrigin.placeId;
    set({
      origin,
      error: null,
      routeData: shouldClearRoute ? null : get().routeData,
    });
  },

  setDestination: (destination) => {
    const currentDestination = get().destination;
    const shouldClearRoute =
      !destination ||
      !currentDestination ||
      destination.placeId !== currentDestination.placeId;
    set({
      destination,
      error: null,
      routeData: shouldClearRoute ? null : get().routeData,
    });
  },

  setRouteData: (routeData) => set({ routeData }),

  setError: (error) => set({ error }),

  swapLocations: () => {
    const { origin, destination } = get();
    set({
      origin: destination,
      destination: origin,
      routeData: null, // Clear route data on swap
      error: null,
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
