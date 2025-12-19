/**
 * Location Service
 * Handles device GPS location permissions and coordinate retrieval
 */

import * as Location from "expo-location";
import type { LatLng } from "./google-maps.service";

export class LocationError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "LocationError";
  }
}

/**
 * Location Service Class
 * Provides methods to request permissions and get device location
 */
class LocationService {
  /**
   * Request foreground location permissions from the device
   * @returns Promise<boolean> - true if permission granted, false otherwise
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        console.log("[LocationService] Permission granted");
        return true;
      }

      console.warn("[LocationService] Permission denied:", status);
      return false;
    } catch (error) {
      console.error("[LocationService] Permission request error:", error);
      throw new LocationError(
        "Failed to request location permissions",
        "PERMISSION_ERROR",
      );
    }
  }

  /**
   * Check if location permissions have been granted
   * @returns Promise<boolean>
   */
  async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("[LocationService] Permission check error:", error);
      return false;
    }
  }

  /**
   * Get the current permission status without requesting
   * @returns Promise<Location.PermissionStatus>
   */
  async getPermissionStatus(): Promise<Location.PermissionStatus> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      console.log("[LocationService] Permission status:", status);
      return status;
    } catch (error) {
      console.error("[LocationService] Get permission status error:", error);
      return Location.PermissionStatus.UNDETERMINED;
    }
  }

  /**
   * Get the device's current GPS position
   * @returns Promise<LatLng | null> - coordinates or null if unavailable
   */
  async getCurrentPosition(): Promise<LatLng | null> {
    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        console.warn(
          "[LocationService] Cannot get location: permissions not granted",
        );
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: LatLng = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      console.log("[LocationService] Got current position:", coords);
      return coords;
    } catch (error) {
      console.error("[LocationService] Get position error:", error);
      throw new LocationError(
        "Failed to get current position",
        "POSITION_ERROR",
      );
    }
  }

  /**
   * Reverse geocode coordinates to get a human-readable address
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @returns Promise<string> - Formatted address string
   */
  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<string | null> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (!addresses || addresses.length === 0) {
        console.warn("[LocationService] No address found for coordinates");
        return null;
      }

      const address = addresses[0];

      // Format address components into readable string
      const parts: string[] = [];

      if (address.street) parts.push(address.street);
      if (address.streetNumber) parts.push(address.streetNumber);
      if (address.city) parts.push(address.city);
      if (address.region) parts.push(address.region);

      const formattedAddress = parts.join(", ");

      console.log("[LocationService] Reverse geocoded:", formattedAddress);
      return formattedAddress || "Current Location";
    } catch (error) {
      console.error("[LocationService] Reverse geocode error:", error);
      return null;
    }
  }

  /**
   * Watch the user's location for continuous updates
   * @param callback - Function to call with location updates
   * @returns Promise<Location.LocationSubscription | null>
   */
  async watchPosition(
    callback: (location: LatLng) => void,
  ): Promise<Location.LocationSubscription | null> {
    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        console.warn(
          "[LocationService] Cannot watch location: permissions not granted",
        );
        return null;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 50, // Update every 50 meters
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        },
      );

      console.log("[LocationService] Started watching position");
      return subscription;
    } catch (error) {
      console.error("[LocationService] Watch position error:", error);
      return null;
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();
