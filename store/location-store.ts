/**
 * Location Store
 * Global state management for device GPS location
 */

import type { LatLng } from "@/services/google-maps.service";
import {
	locationStorageService,
	type PersistedLocationData,
} from "@/services/location-storage.service";
import type * as Location from "expo-location";
import { create } from "zustand";

interface LocationStore {
	// Current device GPS coordinates
	currentLocation: LatLng | null;

	// Formatted address from reverse geocoding
	formattedAddress: string | null;

	// Whether location permission has been granted
	permissionGranted: boolean;

	// Whether location permission has been requested at least once
	permissionRequested: boolean;

	// Whether to show the custom permission explanation modal
	showPermissionModal: boolean;

	// Loading state for location fetch/geocode operations
	isLoadingLocation: boolean;

	// Location subscription for continuous tracking
	locationSubscription: Location.LocationSubscription | null;

	// Actions
	setCurrentLocation: (location: LatLng | null) => void;
	setFormattedAddress: (address: string | null) => void;
	setPermissionGranted: (granted: boolean) => void;
	setPermissionRequested: (requested: boolean) => void;
	setShowPermissionModal: (show: boolean) => void;
	setIsLoadingLocation: (loading: boolean) => void;
	setLocationSubscription: (
		subscription: Location.LocationSubscription | null,
	) => void;
	hydrate: (data: PersistedLocationData) => void;
	reset: () => void;
}

export const useLocationStore = create<LocationStore>((set, get) => ({
	currentLocation: null,
	formattedAddress: null,
	permissionGranted: false,
	permissionRequested: false,
	showPermissionModal: false,
	isLoadingLocation: false,
	locationSubscription: null,

	setCurrentLocation: (location) => {
		set({ currentLocation: location });
		// Persist to AsyncStorage when location changes
		const state = get();
		locationStorageService.save({
			currentLocation: location,
			formattedAddress: state.formattedAddress,
			permissionGranted: state.permissionGranted,
		});
	},

	setFormattedAddress: (address) => {
		set({ formattedAddress: address });
		// Persist to AsyncStorage when address changes
		const state = get();
		locationStorageService.save({
			currentLocation: state.currentLocation,
			formattedAddress: address,
			permissionGranted: state.permissionGranted,
		});
	},

	setPermissionGranted: (granted) => {
		set({ permissionGranted: granted });
		// Persist permission status
		const state = get();
		locationStorageService.save({
			currentLocation: state.currentLocation,
			formattedAddress: state.formattedAddress,
			permissionGranted: granted,
		});
	},

	setPermissionRequested: (requested) =>
		set({ permissionRequested: requested }),

	setShowPermissionModal: (show) => set({ showPermissionModal: show }),

	setIsLoadingLocation: (loading) => set({ isLoadingLocation: loading }),

	setLocationSubscription: (subscription) =>
		set({ locationSubscription: subscription }),

	hydrate: (data) =>
		set({
			currentLocation: data.currentLocation,
			formattedAddress: data.formattedAddress,
			permissionGranted: data.permissionGranted,
		}),

	reset: () =>
		set({
			currentLocation: null,
			formattedAddress: null,
			permissionGranted: false,
			permissionRequested: false,
			showPermissionModal: false,
			isLoadingLocation: false,
			locationSubscription: null,
		}),
}));
