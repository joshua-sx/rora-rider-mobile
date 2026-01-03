import type { ExpoConfig } from "expo/config";

// NOTE:
// - Do NOT hardcode API keys in repo.
// - Provide them via env vars when starting Expo.
//
// Recommended:
//   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
//   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=...
//
// We still set native Google Maps keys for iOS/Android from the same env var.

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
	const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
	const placesKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
	const proxyUrl = process.env.EXPO_PUBLIC_GOOGLE_MAPS_PROXY_URL;
	const proxyToken = process.env.EXPO_PUBLIC_GOOGLE_MAPS_PROXY_TOKEN;
	const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
	// Prefer the dedicated Maps SDK key for native map rendering.
	// (Falling back to the Places key keeps older setups working, but best practice is separate keys.)
	const nativeMapsKey = mapsKey || placesKey;

	return {
		...config,
		plugins: [
			...(config.plugins ?? []),
			'expo-barcode-scanner',
		],
		extra: {
			...(config.extra ?? {}),
			EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: mapsKey,
			EXPO_PUBLIC_GOOGLE_PLACES_API_KEY: placesKey,
			EXPO_PUBLIC_GOOGLE_MAPS_PROXY_URL: proxyUrl,
			EXPO_PUBLIC_GOOGLE_MAPS_PROXY_TOKEN: proxyToken,
			supabaseUrl,
			supabaseAnonKey,
		},
		ios: {
			...(config.ios ?? {}),
			config: {
				...((config.ios as unknown as { config?: Record<string, unknown> } | undefined)
					?.config ?? {}),
				googleMapsApiKey: nativeMapsKey,
			},
		},
		android: {
			...(config.android ?? {}),
			config: {
				...((config.android as unknown as { config?: Record<string, unknown> } | undefined)
					?.config ?? {}),
				googleMaps: {
					...(((config.android as unknown as { config?: { googleMaps?: Record<string, unknown> } } | undefined)
						?.config?.googleMaps ?? {}) as Record<string, unknown>),
					apiKey: nativeMapsKey,
				},
			},
		},
	};
};


