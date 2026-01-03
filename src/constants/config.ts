/**
 * Google Maps API Configuration
 *
 * Required Google Cloud APIs:
 * - Places API
 * - Directions API
 * - Distance Matrix API
 * - Geocoding API
 * - Maps SDK for iOS
 * - Maps SDK for Android
 *
 * IMPORTANT:
 * - Do NOT hardcode keys in repo.
 * - Provide keys via Expo env vars:
 *   - EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
 *   - EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
 */

import Constants from "expo-constants";

type ExpoExtra = Partial<{
	EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: string;
	EXPO_PUBLIC_GOOGLE_PLACES_API_KEY: string;
	EXPO_PUBLIC_GOOGLE_MAPS_PROXY_URL: string;
	EXPO_PUBLIC_GOOGLE_MAPS_PROXY_TOKEN: string;
}>;

const extra: ExpoExtra =
	// Expo SDK 49+ often uses `expoConfig`
	((Constants.expoConfig as unknown as { extra?: ExpoExtra } | undefined)?.extra ??
		// Older builds can expose `manifest.extra`
		((Constants.manifest as unknown as { extra?: ExpoExtra } | undefined)?.extra ??
			{}));

const mapsKey =
	process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
	extra.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
	"";
const placesKey =
	process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
	extra.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
	"";
const proxyUrl =
	process.env.EXPO_PUBLIC_GOOGLE_MAPS_PROXY_URL ||
	extra.EXPO_PUBLIC_GOOGLE_MAPS_PROXY_URL ||
	"";
const proxyToken =
	process.env.EXPO_PUBLIC_GOOGLE_MAPS_PROXY_TOKEN ||
	extra.EXPO_PUBLIC_GOOGLE_MAPS_PROXY_TOKEN ||
	"";

// Prefer separate keys (Maps vs Places). We keep a fallback to reduce breakage in dev,
// but production should set both and restrict them appropriately in Google Cloud Console.
export const GOOGLE_MAPS_API_KEY = mapsKey || placesKey;
export const GOOGLE_PLACES_API_KEY = placesKey || mapsKey;
export const GOOGLE_MAPS_PROXY_URL = proxyUrl;
export const GOOGLE_MAPS_PROXY_TOKEN = proxyToken;

if (__DEV__) {
	if (!mapsKey) {
		console.warn(
			"[config] Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY. Falling back to Places key (not recommended).",
		);
	}
	if (!placesKey) {
		console.warn(
			"[config] Missing EXPO_PUBLIC_GOOGLE_PLACES_API_KEY. Falling back to Maps key (not recommended).",
		);
	}
	if (!proxyUrl) {
		console.warn(
			"[config] Missing EXPO_PUBLIC_GOOGLE_MAPS_PROXY_URL. Google web-service calls should be proxied in production.",
		);
	}
	if (!proxyToken) {
		console.warn(
			"[config] Missing EXPO_PUBLIC_GOOGLE_MAPS_PROXY_TOKEN. Proxy calls will be rejected.",
		);
	}
}

// Sint Maarten geographic center and bounds
export const SINT_MAARTEN_REGION = {
  latitude: 18.0425,
  longitude: -63.0548,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Geographic boundaries for Sint Maarten (for validation)
export const SINT_MAARTEN_BOUNDS = {
  north: 18.3,
  south: 18.0,
  east: -62.9,
  west: -63.0,
};

// Bounding box for Sint Maarten (for Places API bias)
export const SINT_MAARTEN_LOCATION = {
  latitude: 18.0425,
  longitude: -63.0548,
};

// Search radius covering the entire island (20km)
export const SEARCH_RADIUS = 20000;

// API Configuration
export const GOOGLE_MAPS_CONFIG = {
  baseUrl: "https://maps.googleapis.com/maps/api",
  endpoints: {
    places: "/place/autocomplete/json",
    placeDetails: "/place/details/json",
    directions: "/directions/json",
    distanceMatrix: "/distancematrix/json",
  },
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};
