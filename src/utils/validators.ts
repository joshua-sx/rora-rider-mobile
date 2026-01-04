/**
 * Validation Utilities
 *
 * Input validation and sanitization
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (basic check)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // Must have at least 10 digits
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate rating score (1-5)
 */
export const isValidRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

/**
 * Validate fare amount
 */
export const isValidFareAmount = (amount: number): boolean => {
  return (
    typeof amount === 'number' &&
    !Number.isNaN(amount) &&
    amount >= 0 &&
    amount <= 10000 // Max $10,000 for sanity check
  );
};

/**
 * Sanitize text input (remove dangerous characters)
 */
export const sanitizeTextInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .substring(0, 500); // Limit length
};

/**
 * Validate ride status transition
 */
export const isValidRideStatusTransition = (
  currentStatus: string,
  newStatus: string
): boolean => {
  const validTransitions: Record<string, string[]> = {
    created: ['discovery', 'canceled'],
    discovery: ['hold', 'expired', 'canceled'],
    hold: ['confirmed', 'discovery', 'expired', 'canceled'],
    confirmed: ['active', 'canceled'],
    active: ['completed', 'canceled'],
    completed: [], // Terminal state
    canceled: [], // Terminal state
    expired: [], // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
};

/**
 * Validate OTP code (6 digits)
 */
export const isValidOTPCode = (code: string): boolean => {
  return /^\d{6}$/.test(code);
};

/**
 * Validate QR token format (basic check)
 */
export const isValidQRToken = (token: string): boolean => {
  // JWT format: header.payload.signature
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

/**
 * Validate required environment variables
 */
export const validateRequiredEnvVars = (
  requiredVars: string[]
): { valid: boolean; missing: string[] } => {
  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
};

/**
 * Validate pricing zone data
 */
export const isValidPricingZone = (zone: {
  center_lat: number;
  center_lng: number;
  radius_meters: number;
}): boolean => {
  return (
    zone.center_lat >= -90 &&
    zone.center_lat <= 90 &&
    zone.center_lng >= -180 &&
    zone.center_lng <= 180 &&
    zone.radius_meters > 0 &&
    zone.radius_meters <= 100000 // Max 100km radius
  );
};
