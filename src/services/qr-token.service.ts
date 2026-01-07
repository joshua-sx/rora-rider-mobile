/**
 * QR Token Service
 *
 * Generates JWT-based QR tokens for ride sessions
 * Tokens contain ride metadata and expire in 10 minutes
 */

import { QRTokenPayload } from '../types/ride';
import { QR_TOKEN_EXPIRY_MS } from '../utils/constants';

// NOTE: For production, JWT signing/verification should be done server-side
// This is a client-side implementation for MVP

/**
 * Error types for QR token operations
 */
export type QRTokenErrorType =
  | 'INVALID_BASE64'
  | 'INVALID_JSON'
  | 'MISSING_FIELDS'
  | 'EXPIRED'
  | 'ENCODING_FAILED';

/**
 * Result type for QR token decode operations
 */
export interface QRTokenDecodeResult {
  success: boolean;
  payload?: QRTokenPayload;
  error?: string;
  errorType?: QRTokenErrorType;
}

/**
 * Generate a QR token payload
 */
export const generateQRTokenPayload = (
  rideSessionId: string,
  originLabel: string,
  destinationLabel: string,
  roraFareAmount: number
): QRTokenPayload => {
  const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

  return {
    jti: crypto.randomUUID(), // Unique token ID
    ride_session_id: rideSessionId,
    origin_label: originLabel,
    destination_label: destinationLabel,
    rora_fare_amount: roraFareAmount,
    iat: now, // Issued at
    exp: now + Math.floor(QR_TOKEN_EXPIRY_MS / 1000), // Expires in 10 minutes
  };
};

/**
 * Encode QR token payload as JSON string
 * (In production, this would be a signed JWT)
 */
export const encodeQRToken = (payload: QRTokenPayload): string => {
  // For MVP, we'll use base64-encoded JSON
  // In production, use proper JWT signing with a secret
  const jsonString = JSON.stringify(payload);
  return btoa(jsonString);
};

/**
 * Decode QR token from string with detailed error information
 * Returns a result object that distinguishes between different failure types
 */
export const decodeQRToken = (token: string): QRTokenDecodeResult => {
  if (!token || typeof token !== 'string') {
    return {
      success: false,
      error: 'Token is empty or invalid',
      errorType: 'INVALID_BASE64',
    };
  }

  let jsonString: string;
  try {
    jsonString = atob(token);
  } catch {
    return {
      success: false,
      error: 'Token is not valid base64 encoding',
      errorType: 'INVALID_BASE64',
    };
  }

  let payload: QRTokenPayload;
  try {
    payload = JSON.parse(jsonString);
  } catch {
    return {
      success: false,
      error: 'Token contains invalid JSON',
      errorType: 'INVALID_JSON',
    };
  }

  // Validate required fields
  const requiredFields = ['jti', 'ride_session_id', 'origin_label', 'destination_label', 'rora_fare_amount', 'iat', 'exp'];
  const missingFields = requiredFields.filter(field => !(field in payload));
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `Token is missing required fields: ${missingFields.join(', ')}`,
      errorType: 'MISSING_FIELDS',
    };
  }

  return { success: true, payload };
};

/**
 * Legacy decode function for backwards compatibility
 * @deprecated Use decodeQRToken which returns detailed error information
 */
export const decodeQRTokenLegacy = (token: string): QRTokenPayload | null => {
  const result = decodeQRToken(token);
  return result.success ? result.payload! : null;
};

/**
 * Validate QR token expiry
 */
export const isQRTokenExpired = (token: QRTokenPayload): boolean => {
  const now = Math.floor(Date.now() / 1000);
  return now >= token.exp;
};

/**
 * Decode and validate a QR token in one step
 * Returns a result with detailed error information
 */
export const decodeAndValidateQRToken = (token: string): QRTokenDecodeResult => {
  const decodeResult = decodeQRToken(token);
  if (!decodeResult.success) {
    return decodeResult;
  }

  if (isQRTokenExpired(decodeResult.payload!)) {
    return {
      success: false,
      error: 'Token has expired',
      errorType: 'EXPIRED',
    };
  }

  return decodeResult;
};

/**
 * Generate a complete QR token string for a ride session
 */
export const generateQRTokenForRide = (
  rideSessionId: string,
  originLabel: string,
  destinationLabel: string,
  roraFareAmount: number
): string => {
  const payload = generateQRTokenPayload(
    rideSessionId,
    originLabel,
    destinationLabel,
    roraFareAmount
  );
  return encodeQRToken(payload);
};
