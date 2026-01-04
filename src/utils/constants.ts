/**
 * Application Constants
 *
 * Default values and configuration from SPEC
 */

/**
 * Guest Mode
 */
export const GUEST_TOKEN_TTL_DAYS = 30;
export const GUEST_QR_RATE_LIMIT = 5; // QRs per hour

/**
 * Discovery Configuration
 */
export const DEFAULT_DISCOVERY_WAVES = {
  wave_1_radius_km: 5,
  wave_2_radius_km: 10,
  wave_3_radius_km: 20,
};

export const DISCOVERY_WAVE_INTERVAL_MS = 60000; // 1 minute between waves
export const DISCOVERY_PENDING_OFFER_REMINDER_MS = 600000; // 10 minutes

/**
 * Hold Phase
 */
export const HOLD_TIMEOUT_MS = 300000; // 5 minutes

/**
 * QR Token
 */
export const QR_TOKEN_EXPIRY_MS = 600000; // 10 minutes

/**
 * Pricing
 */
export const DEFAULT_BASE_FARE = 10.0;
export const DEFAULT_PER_KM_RATE = 2.5;
export const HAVERSINE_MULTIPLIER = 1.3; // For offline estimation

/**
 * Ratings
 */
export const MIN_RATINGS_TO_DISPLAY = 5; // Don't show rating until 5+ ratings
export const RATING_MIN = 1;
export const RATING_MAX = 5;

/**
 * Notifications
 */
export const NOTIFICATION_BUNDLE_WINDOW_MS = 60000; // 60 seconds

/**
 * Cache TTLs
 */
export const DRIVER_PROFILE_CACHE_TTL_MS = 86400000; // 24 hours
export const LOCATION_CACHE_TTL_MS = 86400000; // 24 hours

/**
 * Retry Configuration
 */
export const OTP_MAX_RETRIES = 2;
export const OTP_RETRY_COOLDOWN_MS = 30000; // 30 seconds

/**
 * Direct Request
 */
export const DIRECT_REQUEST_TIMEOUT_MS = 600000; // 10 minutes

/**
 * App Configuration
 */
export const DEFAULT_LANGUAGE = 'en';
export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_DISTANCE_UNIT = 'km';

/**
 * Map Configuration
 */
export const DEFAULT_MAP_CENTER = {
  latitude: 18.0410,
  longitude: -63.1089,
}; // Princess Juliana Airport

export const DEFAULT_MAP_ZOOM = 12;

/**
 * Feature Flags (MVP scope)
 */
export const FEATURES = {
  IN_APP_PAYMENTS: false,
  SURGE_PRICING: false,
  AUTO_DISPATCH: false,
  LIVE_RIDE_TRACKING: false,
  SCHEDULED_RIDES: false,
  DARK_MODE: false,
  MULTI_LANGUAGE: false,
} as const;
