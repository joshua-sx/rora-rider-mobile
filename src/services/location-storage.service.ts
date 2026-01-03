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

const STORAGE_KEY = "@rora_location_data";
const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class LocationStorageService {
	/**
	 * Save location data to AsyncStorage
	 */
	async save(data: Partial<PersistedLocationData>): Promise<void> {
		try {
			const existing = await this.load();
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
		} catch (error) {
			console.error("[LocationStorage] Failed to save:", error);
		}
	}

	/**
	 * Load location data from AsyncStorage
	 * Returns null if data doesn't exist or is expired
	 */
	async load(): Promise<PersistedLocationData | null> {
		try {
			const json = await AsyncStorage.getItem(STORAGE_KEY);
			if (!json) return null;

			const data: PersistedLocationData = JSON.parse(json);

			// Check if data is expired
			if (this.isExpired(data.lastUpdated)) {
				await this.clear();
				return null;
			}

			return data;
		} catch (error) {
			console.error("[LocationStorage] Failed to load:", error);
			return null;
		}
	}

	/**
	 * Clear all persisted location data
	 */
	async clear(): Promise<void> {
		try {
			await AsyncStorage.removeItem(STORAGE_KEY);
		} catch (error) {
			console.error("[LocationStorage] Failed to clear:", error);
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
