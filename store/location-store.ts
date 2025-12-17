/**
 * Location Store
 * Global state management for device GPS location
 */

import { create } from "zustand";
import type { LatLng } from "@/services/google-maps.service";

interface LocationStore {
  // Current device GPS coordinates
  currentLocation: LatLng | null;

  // Whether location permission has been granted
  permissionGranted: boolean;

  // Whether location permission has been requested at least once
  permissionRequested: boolean;

  // Actions
  setCurrentLocation: (location: LatLng | null) => void;
  setPermissionGranted: (granted: boolean) => void;
  setPermissionRequested: (requested: boolean) => void;
  reset: () => void;
}

export const useLocationStore = create<LocationStore>((set) => ({
  currentLocation: null,
  permissionGranted: false,
  permissionRequested: false,

  setCurrentLocation: (location) => set({ currentLocation: location }),

  setPermissionGranted: (granted) => set({ permissionGranted: granted }),

  setPermissionRequested: (requested) =>
    set({ permissionRequested: requested }),

  reset: () =>
    set({
      currentLocation: null,
      permissionGranted: false,
      permissionRequested: false,
    }),
}));
