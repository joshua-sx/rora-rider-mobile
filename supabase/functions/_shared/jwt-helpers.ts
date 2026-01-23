/**
 * JWT Helper Module for QR Token Generation and Validation
 *
 * This module provides centralized JWT signing and verification for QR tokens.
 * Security: Uses HS256 with server-only secret (QR_TOKEN_SECRET env var).
 */

import { create, verify, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts'
import type { Payload } from 'https://deno.land/x/djwt@v3.0.2/mod.ts'

/**
 * QR Token JWT Payload Structure
 * Matches spec in docs/features/qr-token-spec.md
 */
export interface QRTokenPayload {
  jti: string                      // Unique token ID (matches ride_sessions.qr_token_jti)
  ride_session_id: string           // Ride session reference
  rider_user_id: string | null      // Authenticated rider (null if guest)
  guest_token_id: string | null     // Guest token ID (null if authenticated)
  driver_user_id: string | null     // Selected driver (null until offer accepted)
  fare_amount: number               // Agreed/estimated fare
  iat: number                       // Issued at (unix seconds)
  exp: number                       // Expires at (unix seconds, iat + 10 minutes)
  ver: string                       // Token version ("1")
}

/**
 * Get QR token secret from environment
 * Throws if secret is missing or too short
 */
export function getQRSecret(): string {
  const secret = Deno.env.get('QR_TOKEN_SECRET')

  if (!secret) {
    throw new Error('QR_TOKEN_SECRET environment variable is not set')
  }

  if (secret.length < 32) {
    throw new Error('QR_TOKEN_SECRET must be at least 32 characters')
  }

  return secret
}

/**
 * Generate a signed JWT QR token
 *
 * @param payload - QR token payload (jti, ride_session_id, etc.)
 * @returns Signed JWT string (format: header.payload.signature)
 */
export async function generateQRToken(payload: QRTokenPayload): Promise<string> {
  const secret = getQRSecret()

  // Create JWT with HS256 algorithm
  const jwt = await create(
    // Header
    {
      alg: 'HS256',
      typ: 'JWT',
      kid: 'qr-v1'  // Key ID for rotation support
    },
    // Payload
    payload as Payload,
    // Secret
    secret
  )

  return jwt
}

/**
 * Verify and parse a QR token JWT
 * Implements 10-step validation checklist from spec
 *
 * @param token - JWT string to validate
 * @returns Parsed payload if valid
 * @throws Error if validation fails at any step
 */
export async function verifyQRToken(token: string): Promise<QRTokenPayload> {
  const secret = getQRSecret()

  try {
    // Step 1: Parse JWT format (djwt handles this)
    // Step 2: Verify signature with secret
    const payload = await verify(token, secret) as QRTokenPayload

    // Step 3: Validate iat not in future (allow 60s clock skew)
    const now = Math.floor(Date.now() / 1000)
    const clockSkewSeconds = 60

    if (payload.iat > now + clockSkewSeconds) {
      throw new Error('TOKEN_IAT_FUTURE: Token issued in the future')
    }

    // Step 4: Validate exp not expired
    if (payload.exp < now) {
      throw new Error('TOKEN_EXPIRED: Token has expired')
    }

    // Step 5: Validate TTL window (exp should be iat + 10 minutes)
    const expectedTTL = 10 * 60 // 10 minutes in seconds
    const actualTTL = payload.exp - payload.iat

    if (actualTTL > expectedTTL + 60) { // Allow 1 minute grace
      throw new Error('TOKEN_INVALID_TTL: Token expiry exceeds maximum allowed TTL')
    }

    // Validate required fields
    if (!payload.jti || !payload.ride_session_id) {
      throw new Error('TOKEN_MISSING_FIELDS: jti and ride_session_id are required')
    }

    if (!payload.rider_user_id && !payload.guest_token_id) {
      throw new Error('TOKEN_MISSING_IDENTITY: Must have either rider_user_id or guest_token_id')
    }

    if (payload.rider_user_id && payload.guest_token_id) {
      throw new Error('TOKEN_INVALID_IDENTITY: Cannot have both rider_user_id and guest_token_id')
    }

    // Validate fare_amount is a number
    if (typeof payload.fare_amount !== 'number' || payload.fare_amount < 0) {
      throw new Error('TOKEN_INVALID_FARE: fare_amount must be a positive number')
    }

    // Validate version
    if (payload.ver !== '1') {
      throw new Error('TOKEN_UNSUPPORTED_VERSION: Only version "1" is supported')
    }

    return payload
  } catch (error) {
    // If already a token validation error, rethrow
    if (error instanceof Error && error.message.startsWith('TOKEN_')) {
      throw error
    }

    // Otherwise, wrap as invalid token error
    throw new Error(`TOKEN_INVALID: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create numeric date for JWT timestamps
 * (Re-exported from djwt for convenience)
 */
export { getNumericDate }
