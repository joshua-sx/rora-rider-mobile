/**
 * Location Store
 * Global state management for device GPS location
 */

import type { LatLng } from "@/src/services/google-maps.service";
import {
	locationStorageService,
	type PersistedLocationData,
} from "@/src/services/location-storage.service";
import * as Location from "expo-location";
import { create } from "zustand";

interface LocationStore {
	// Current device GPS coordinates
	currentLocation: LatLng | null;

	// Formatted address from reverse geocoding
	formattedAddress: string | null;

	// Whether location permission has been granted
	permissionGranted: boolean;

	// Current OS permission status
	permissionStatus: Location.PermissionStatus;

	// Whether location permission has been requested at least once
	permissionRequested: boolean;

	// Whether to show the custom permission explanation modal
	showPermissionModal: boolean;

	// Loading state for location fetch/geocode operations
	isLoadingLocation: boolean;

	// Location subscription for continuous tracking
	locationSubscription: Location.LocationSubscription | null;

	// Last persistence error (if any)
	persistenceError: string | null;

	// Actions
	setCurrentLocation: (location: LatLng | null) => Promise<void>;
	setFormattedAddress: (address: string | null) => Promise<void>;
	setPermissionGranted: (granted: boolean) => Promise<void>;
	setPermissionStatus: (status: Location.PermissionStatus) => Promise<void>;
	setPermissionRequested: (requested: boolean) => void;
	setShowPermissionModal: (show: boolean) => void;
	setIsLoadingLocation: (loading: boolean) => void;
	setLocationSubscription: (
		subscription: Location.LocationSubscription | null,
	) => void;
	hydrate: (data: PersistedLocationData) => void;
	reset: () => void;
	clearPersistenceError: () => void;
}

export const useLocationStore = create<LocationStore>((set, get) => ({
	currentLocation: null,
	formattedAddress: null,
	permissionGranted: false,
	permissionStatus: Location.PermissionStatus.UNDETERMINED,
	permissionRequested: false,
	showPermissionModal: false,
	isLoadingLocation: false,
	locationSubscription: null,
	persistenceError: null,

	setCurrentLocation: async (location) => {
		set({ currentLocation: location, persistenceError: null });
		// Persist to AsyncStorage when location changes
		const state = get();
		const result = await locationStorageService.save({
			currentLocation: location,
			formattedAddress: state.formattedAddress,
			permissionGranted: state.permissionGranted,
			permissionStatus: state.permissionStatus,
		});
		if (!result.success) {
			set({ persistenceError: result.error });
		}
	},

	setFormattedAddress: async (address) => {
		set({ formattedAddress: address, persistenceError: null });
		// Persist to AsyncStorage when address changes
		const state = get();
		const result = await locationStorageService.save({
			currentLocation: state.currentLocation,
			formattedAddress: address,
			permissionGranted: state.permissionGranted,
			permissionStatus: state.permissionStatus,
		});
		if (!result.success) {
			set({ persistenceError: result.error });
		}
	},

	setPermissionGranted: async (granted) => {
		const status = granted
			? Location.PermissionStatus.GRANTED
			: Location.PermissionStatus.DENIED;
		set({ permissionGranted: granted, permissionStatus: status, persistenceError: null });
		// Persist permission status
		const state = get();
		const result = await locationStorageService.save({
			currentLocation: state.currentLocation,
			formattedAddress: state.formattedAddress,
			permissionGranted: granted,
			permissionStatus: status,
		});
		if (!result.success) {
			set({ persistenceError: result.error });
		}
	},

	setPermissionStatus: async (status) => {
		const granted = status === Location.PermissionStatus.GRANTED;
		set({ permissionStatus: status, permissionGranted: granted, persistenceError: null });
		const state = get();
		const result = await locationStorageService.save({
			currentLocation: state.currentLocation,
			formattedAddress: state.formattedAddress,
			permissionGranted: granted,
			permissionStatus: status,
		});
		if (!result.success) {
			set({ persistenceError: result.error });
		}
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
			permissionStatus:
				data.permissionStatus ??
				(data.permissionGranted
					? Location.PermissionStatus.GRANTED
					: Location.PermissionStatus.UNDETERMINED),
		}),

	reset: () =>
		set({
			currentLocation: null,
			formattedAddress: null,
			permissionGranted: false,
			permissionStatus: Location.PermissionStatus.UNDETERMINED,
			permissionRequested: false,
			showPermissionModal: false,
			isLoadingLocation: false,
			locationSubscription: null,
			persistenceError: null,
		}),

	clearPersistenceError: () => set({ persistenceError: null }),
}));
