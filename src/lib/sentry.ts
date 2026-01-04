import * as Sentry from '@sentry/react-native';

const sentryDsn = process.env.SENTRY_DSN || '';

/**
 * Initialize Sentry Error Tracking
 *
 * IMPORTANT: Do NOT log PII (personally identifiable information)
 * - Scrub phone numbers, emails, and names from error reports
 * - Use user_id (UUID) instead of personal data
 * - Sanitize sensitive data from context
 */
export const initializeSentry = (): void => {
  if (!sentryDsn) {
    console.warn(
      'Sentry DSN not configured. Error tracking will be disabled. ' +
      'Set SENTRY_DSN in .env.local for production error tracking.'
    );
    return;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,

      // Enable crash reporting
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,

      // Performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions

      // Environment
      environment: process.env.NODE_ENV || 'development',

      // Release tracking
      // dist: will be set by build process
      // release: will be set by build process

      // Before sending, scrub PII
      beforeSend(event, hint) {
        // Remove PII from user context
        if (event.user) {
          delete event.user.email;
          delete event.user.username;
          // Keep only id (UUID)
        }

        // Scrub sensitive data from extra context
        if (event.extra) {
          event.extra = sanitizeObject(event.extra);
        }

        // Scrub sensitive data from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(breadcrumb => ({
            ...breadcrumb,
            data: breadcrumb.data ? sanitizeObject(breadcrumb.data) : undefined,
          }));
        }

        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        // Network errors (not actionable)
        'Network request failed',
        'NetworkError',

        // User cancelled operations
        'User cancelled',
        'AbortError',

        // Development-only errors
        /^Non-Error promise rejection captured/,
      ],
    });

    console.log('Sentry error tracking initialized');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
};

/**
 * Sanitize object to remove PII
 */
const sanitizeObject = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    // Skip keys that might contain PII
    const keyLower = key.toLowerCase();
    if (
      keyLower.includes('email') ||
      keyLower.includes('phone') ||
      keyLower.includes('password') ||
      keyLower.includes('token') ||
      keyLower.includes('secret')
    ) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Check if Sentry is initialized
 */
export const isSentryEnabled = (): boolean => {
  return Boolean(sentryDsn);
};

/**
 * Set user context (authenticated users only)
 * Use UUID only, never use email/phone/name
 */
export const setSentryUser = (userId: string): void => {
  Sentry.setUser({ id: userId });
};

/**
 * Clear user context (on logout)
 */
export const clearSentryUser = (): void => {
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for debugging context
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, any>
): void => {
  Sentry.addBreadcrumb({
    message,
    category,
    data: data ? sanitizeObject(data) : undefined,
    level: 'info',
  });
};

/**
 * Capture exception manually
 */
export const captureException = (error: Error, context?: Record<string, any>): void => {
  if (context) {
    Sentry.setContext('additional', sanitizeObject(context));
  }
  Sentry.captureException(error);
};

/**
 * Capture message (for non-error events)
 */
export const captureMessage = (
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug' = 'info'
): void => {
  Sentry.captureMessage(message, level);
};

/**
 * Set tag for filtering in Sentry dashboard
 */
export const setTag = (key: string, value: string): void => {
  Sentry.setTag(key, value);
};

/**
 * Set context for additional debugging info
 */
export const setContext = (name: string, context: Record<string, any>): void => {
  Sentry.setContext(name, sanitizeObject(context));
};

/**
 * Export Sentry for use in app entry point
 */
export { Sentry };
