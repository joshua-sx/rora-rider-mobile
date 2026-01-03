/**
 * Google Maps Service
 * Wrapper around Google Maps APIs with error handling and request utilities
 */

import {
  GOOGLE_MAPS_CONFIG,
  GOOGLE_MAPS_PROXY_TOKEN,
  GOOGLE_MAPS_PROXY_URL,
  SEARCH_RADIUS,
  SINT_MAARTEN_LOCATION,
} from "@/src/constants/config";

import { decodePolyline as decodePolylineUtil } from "@/src/utils/route-validation";

// Type definitions for Google Maps API responses
export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface PlaceResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  location?: LatLng;
}

export interface DirectionsResult {
  routes: {
    legs: {
      distance: { value: number; text: string };
      duration: { value: number; text: string };
      steps: {
        distance: { value: number; text: string };
        duration: { value: number; text: string };
        html_instructions: string;
        polyline: { points: string };
      }[];
    }[];
    overview_polyline: { points: string };
  }[];
  status: string;
}

export interface DistanceMatrixResult {
  rows: {
    elements: {
      distance: { value: number; text: string };
      duration: { value: number; text: string };
      status: string;
    }[];
  }[];
  status: string;
}

export interface LatLngBounds {
  northeast: LatLng;
  southwest: LatLng;
}

// Custom error types
export class GoogleMapsError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = "GoogleMapsError";
  }
}

/**
 * Google Maps Service Class
 * Provides methods to interact with Google Maps APIs
 */
class GoogleMapsService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Make a request to the Maps proxy with retry logic
   */
  private async makeRequest<T>(url: string, retryCount = 0): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        GOOGLE_MAPS_CONFIG.timeout
      );

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          ...(GOOGLE_MAPS_PROXY_TOKEN
            ? { Authorization: `Bearer ${GOOGLE_MAPS_PROXY_TOKEN}` }
            : {}),
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new GoogleMapsError(
          `HTTP error: ${response.status}`,
          "HTTP_ERROR",
          { status: response.status }
        );
      }

      const data = await response.json();

      // Check for API-specific errors (Google web services style)
      if (
        data.status &&
        data.status !== "OK" &&
        data.status !== "ZERO_RESULTS"
      ) {
        throw new GoogleMapsError(
          `API error: ${data.status} - ${
            data.error_message || "Unknown error"
          }`,
          data.status,
          data
        );
      }

      return data as T;
    } catch (error: any) {
      // Retry logic for transient failures
      if (
        retryCount < GOOGLE_MAPS_CONFIG.retryAttempts &&
        (error.name === "AbortError" || error.code === "NETWORK_ERROR")
      ) {
        await this.delay(GOOGLE_MAPS_CONFIG.retryDelay * 2 ** retryCount);
        return this.makeRequest<T>(url, retryCount + 1);
      }

      if (error instanceof GoogleMapsError) {
        throw error;
      }

      throw new GoogleMapsError(
        `Request failed: ${error.message}`,
        "REQUEST_FAILED",
        error
      );
    }
  }

  private getProxyBaseUrl(): string {
    const base = (GOOGLE_MAPS_PROXY_URL || "").trim().replace(/\/+$/, "");
    if (!base) {
      throw new GoogleMapsError(
        "Missing EXPO_PUBLIC_GOOGLE_MAPS_PROXY_URL",
        "MISSING_PROXY_URL"
      );
    }
    return base;
  }

  /**
   * Decode an encoded polyline string into coordinates.
   * (Google Directions API format)
   */
  public decodePolyline(encoded: string): LatLng[] {
    try {
      return decodePolylineUtil(encoded) as LatLng[];
    } catch (error) {
      throw new GoogleMapsError(
        "Invalid polyline encoding",
        "INVALID_POLYLINE",
        error
      );
    }
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get cached data if available and not expired
   */
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data as T;
    }
    return null;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Clear cache manually
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Search for places using Google Places Autocomplete API
   */
  async searchPlaces(
    query: string,
    bounds?: LatLngBounds
  ): Promise<PlaceResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const cacheKey = `places_${query}_${JSON.stringify(bounds)}`;
    const cached = this.getCached<PlaceResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({
        input: query,
        location: `${SINT_MAARTEN_LOCATION.latitude},${SINT_MAARTEN_LOCATION.longitude}`,
        radius: SEARCH_RADIUS.toString(),
        components: "country:sx", // RESTORED: Sint Maarten only
      });

      const url = `${this.getProxyBaseUrl()}/maps/places/autocomplete?${params}`;
      const response = await this.makeRequest<any>(url);

      const results: PlaceResult[] = (response.predictions || []).map(
        (prediction: any) => ({
          placeId: prediction.place_id,
          description: prediction.description,
          mainText:
            prediction.structured_formatting?.main_text ||
            prediction.description,
          secondaryText: prediction.structured_formatting?.secondary_text || "",
        })
      );

      this.setCache(cacheKey, results);
      return results;
    } catch (error) {
      if (error instanceof GoogleMapsError) {
        throw error;
      }
      throw new GoogleMapsError(
        "Failed to search places",
        "SEARCH_FAILED",
        error
      );
    }
  }

  /**
   * Get directions between two points using Google Directions API
   */
  async getDirections(
    origin: LatLng,
    destination: LatLng
  ): Promise<DirectionsResult> {
    const cacheKey = `directions_${origin.latitude},${origin.longitude}_${destination.latitude},${destination.longitude}`;
    const cached = this.getCached<DirectionsResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode: "driving",
      });

      const url = `${this.getProxyBaseUrl()}/maps/directions?${params}`;
      const response = await this.makeRequest<DirectionsResult>(url);

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      if (error instanceof GoogleMapsError) {
        throw error;
      }
      throw new GoogleMapsError(
        "Failed to get directions",
        "DIRECTIONS_FAILED",
        error
      );
    }
  }

  /**
   * Get distance matrix between multiple origins and destinations
   */
  async getDistanceMatrix(
    origins: LatLng[],
    destinations: LatLng[]
  ): Promise<DistanceMatrixResult> {
    const cacheKey = `distance_${JSON.stringify(origins)}_${JSON.stringify(
      destinations
    )}`;
    const cached = this.getCached<DistanceMatrixResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const originsStr = origins
        .map((o) => `${o.latitude},${o.longitude}`)
        .join("|");
      const destinationsStr = destinations
        .map((d) => `${d.latitude},${d.longitude}`)
        .join("|");

      const params = new URLSearchParams({
        origins: originsStr,
        destinations: destinationsStr,
        mode: "driving",
      });

      const url = `${this.getProxyBaseUrl()}/maps/distance-matrix?${params}`;
      const response = await this.makeRequest<DistanceMatrixResult>(url);

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      if (error instanceof GoogleMapsError) {
        throw error;
      }
      throw new GoogleMapsError(
        "Failed to get distance matrix",
        "DISTANCE_MATRIX_FAILED",
        error
      );
    }
  }

  /**
   * Get place details by place ID
   */
  async getPlaceDetails(placeId: string): Promise<any> {
    const cacheKey = `place_details_${placeId}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({
        place_id: placeId,
        fields: "geometry,formatted_address,name",
      });

      const url = `${this.getProxyBaseUrl()}/maps/places/details?${params}`;
      const response = await this.makeRequest<any>(url);

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      if (error instanceof GoogleMapsError) {
        throw error;
      }
      throw new GoogleMapsError(
        "Failed to get place details",
        "PLACE_DETAILS_FAILED",
        error
      );
    }
  }
}

// Export singleton instance
export const googleMapsService = new GoogleMapsService();
