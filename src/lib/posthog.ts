import { PostHog } from 'posthog-react-native';

const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || '';
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST || '';

/**
 * PostHog Analytics Client
 *
 * Self-hosted PostHog instance for privacy-first analytics
 *
 * IMPORTANT: Do NOT log PII (personally identifiable information)
 * - Hash or pseudonymize user identifiers
 * - Do not track phone numbers, emails, or names
 * - Use user_id (UUID) instead of personal data
 */
let posthogClient: PostHog | null = null;

/**
 * Initialize PostHog client
 * Call this once during app startup
 */
export const initializePostHog = async (): Promise<PostHog | null> => {
  if (!posthogApiKey || !posthogHost) {
    console.warn(
      'PostHog API key or host not configured. Analytics will be disabled. ' +
      'Set EXPO_PUBLIC_POSTHOG_API_KEY and EXPO_PUBLIC_POSTHOG_HOST in .env.local'
    );
    return null;
  }

  try {
    posthogClient = new PostHog(posthogApiKey, {
      host: posthogHost,
      captureApplicationLifecycleEvents: true,
      captureDeepLinks: true,
    });

    console.log('PostHog analytics initialized');
    return posthogClient;
  } catch (error) {
    console.error('Failed to initialize PostHog:', error);
    return null;
  }
};

/**
 * Get PostHog client instance
 */
export const getPostHog = (): PostHog | null => {
  return posthogClient;
};

/**
 * Check if PostHog is configured and initialized
 */
export const isPostHogEnabled = (): boolean => {
  return posthogClient !== null;
};

/**
 * Analytics Event Names (from SPEC §27)
 */
export const AnalyticsEvents = {
  // App lifecycle
  APP_LAUNCHED: 'app_launched',
  APP_BACKGROUNDED: 'app_backgrounded',
  APP_FOREGROUNDED: 'app_foregrounded',

  // Estimation & QR
  ESTIMATE_CREATED: 'estimate_created',
  QR_GENERATED: 'qr_generated',

  // Discovery
  DISCOVERY_STARTED: 'discovery_started',
  DISCOVERY_EXPANDED: 'discovery_expanded',

  // Offers
  OFFER_RECEIVED: 'offer_received',
  OFFER_SELECTED: 'offer_selected',
  HOLD_TIMEOUT: 'hold_timeout',

  // Ride lifecycle
  RIDE_CONFIRMED: 'ride_confirmed',
  RIDE_COMPLETED: 'ride_completed',
  RIDE_CANCELED: 'ride_canceled',

  // Direct requests
  DIRECT_REQUEST_SENT: 'direct_request_sent',
  DIRECT_REQUEST_ESCALATED: 'direct_request_escalated',

  // Driver interactions
  DRIVER_PROFILE_VIEWED: 'driver_profile_viewed',
  DRIVER_FAVORITED: 'driver_favorited',

  // Ratings & reports
  RATING_SUBMITTED: 'rating_submitted',
  ISSUE_REPORTED: 'issue_reported',

  // Guest mode
  GUEST_CLAIM_PROMPT_SHOWN: 'guest_claim_prompt_shown',
  GUEST_HISTORY_CLAIMED: 'guest_history_claimed',

  // Filters
  FILTER_APPLIED: 'filter_applied',
} as const;

/**
 * Type-safe analytics event tracking
 */
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
): void => {
  if (!posthogClient) {
    // Silently skip if analytics not configured (dev mode)
    return;
  }

  try {
    posthogClient.capture(eventName, properties);
  } catch (error) {
    console.error('Failed to track event:', eventName, error);
  }
};

/**
 * Identify user (authenticated users only)
 * Use UUID, never use email/phone/name
 */
export const identifyUser = (userId: string, traits?: Record<string, any>): void => {
  if (!posthogClient) return;

  try {
    posthogClient.identify(userId, traits);
  } catch (error) {
    console.error('Failed to identify user:', error);
  }
};

/**
 * Reset analytics identity (on logout)
 */
export const resetAnalytics = (): void => {
  if (!posthogClient) return;

  try {
    posthogClient.reset();
  } catch (error) {
    console.error('Failed to reset analytics:', error);
  }
};

/**
 * Set user properties (for segmentation)
 * Do not include PII
 */
export const setUserProperties = (properties: Record<string, any>): void => {
  if (!posthogClient) return;

  try {
    posthogClient.setPersonProperties(properties);
  } catch (error) {
    console.error('Failed to set user properties:', error);
  }
};
