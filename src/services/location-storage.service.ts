import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LatLng } from "@/src/services/google-maps.service";
import type { PermissionStatus } from "expo-location";

interface PersistedLocationData {
	currentLocation: LatLng | null;
	formattedAddress: string | null;
	permissionGranted: boolean;
	permissionStatus?: PermissionStatus;
	lastUpdated: number;
}

/**
 * Result type for location storage operations
 */
export interface LocationStorageResult<T> {
	success: boolean;
	data?: T;
	error?: string;
}

const STORAGE_KEY = "@rora_location_data";
const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class LocationStorageService {
	/**
	 * Save location data to AsyncStorage
	 * Returns a result object indicating success or failure with error details
	 */
	async save(data: Partial<PersistedLocationData>): Promise<LocationStorageResult<void>> {
		try {
			const loadResult = await this.load();
			const existing = loadResult.success ? loadResult.data : null;

			const merged: PersistedLocationData = {
				currentLocation: data.currentLocation ?? existing?.currentLocation ?? null,
				formattedAddress:
					data.formattedAddress ?? existing?.formattedAddress ?? null,
				permissionGranted:
					data.permissionGranted ?? existing?.permissionGranted ?? false,
				permissionStatus: data.permissionStatus ?? existing?.permissionStatus,
				lastUpdated: Date.now(),
			};

			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
			return { success: true };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error saving location data";
			console.error("[LocationStorage] Failed to save:", errorMessage);
			return { success: false, error: `Failed to save location data: ${errorMessage}` };
		}
	}

	/**
	 * Load location data from AsyncStorage
	 * Returns a result object with data if successful, or error details if failed
	 * Note: Returns success with undefined data if no data exists (not an error)
	 */
	async load(): Promise<LocationStorageResult<PersistedLocationData | null>> {
		try {
			const json = await AsyncStorage.getItem(STORAGE_KEY);
			if (!json) {
				return { success: true, data: null };
			}

			let data: PersistedLocationData;
			try {
				data = JSON.parse(json);
			} catch {
				console.error("[LocationStorage] Corrupted data in storage, clearing");
				await this.clear();
				return { success: true, data: null };
			}

			// Check if data is expired
			if (this.isExpired(data.lastUpdated)) {
				await this.clear();
				return { success: true, data: null };
			}

			return { success: true, data };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error loading location data";
			console.error("[LocationStorage] Failed to load:", errorMessage);
			return { success: false, error: `Failed to load location data: ${errorMessage}` };
		}
	}

	/**
	 * Clear all persisted location data
	 * Returns a result object indicating success or failure with error details
	 */
	async clear(): Promise<LocationStorageResult<void>> {
		try {
			await AsyncStorage.removeItem(STORAGE_KEY);
			return { success: true };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error clearing location data";
			console.error("[LocationStorage] Failed to clear:", errorMessage);
			return { success: false, error: `Failed to clear location data: ${errorMessage}` };
		}
	}

	/**
	 * Check if timestamp is older than EXPIRY_TIME
	 */
	private isExpired(timestamp: number): boolean {
		return Date.now() - timestamp > EXPIRY_TIME;
	}
}

export const locationStorageService = new LocationStorageService();
export type { PersistedLocationData };
