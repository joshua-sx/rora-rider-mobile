import * as Crypto from 'expo-crypto';
import type { Trip } from '@/src/types/trip';

export interface TripQRPayload {
  tripId: string;
  driverId?: string;
  passengerId?: string;
  quote: {
    price: number;
    distance: number;
    duration: number;
  };
  timestamp: number;
  version: string;
}

export interface SignedTripQR {
  data: TripQRPayload;
  signature: string;
}

/**
 * Generate a QR code value for a trip with cryptographic signature
 * @param trip - The trip to encode
 * @returns JSON string containing the trip data and signature
 */
export async function generateTripQR(trip: Trip): Promise<string> {
  const payload: TripQRPayload = {
    tripId: trip.id,
    driverId: trip.driverId,
    passengerId: trip.userId,
    quote: {
      price: trip.quote.estimatedPrice,
      distance: trip.routeData.distance,
      duration: trip.routeData.duration,
    },
    timestamp: Date.now(),
    version: '1.0',
  };

  // Sign with HMAC-SHA256
  const signature = await createSignature(payload);

  const signedQR: SignedTripQR = {
    data: payload,
    signature,
  };

  return JSON.stringify(signedQR);
}

/**
 * Verify a QR code signature
 * @param qrValue - The QR code value to verify
 * @returns The payload if valid, null if invalid
 */
export async function verifyTripQR(qrValue: string): Promise<TripQRPayload | null> {
  try {
    const parsed: SignedTripQR = JSON.parse(qrValue);

    if (!parsed.data || !parsed.signature) {
      console.error('[trip-qr] Missing data or signature');
      return null;
    }

    // Verify signature
    const expectedSignature = await createSignature(parsed.data);

    if (expectedSignature !== parsed.signature) {
      console.error('[trip-qr] Signature mismatch - QR may be tampered');
      return null;
    }

    // Check timestamp (reject QR codes older than 24 hours)
    const ageInHours = (Date.now() - parsed.data.timestamp) / (1000 * 60 * 60);
    if (ageInHours > 24) {
      console.error('[trip-qr] QR code expired (older than 24 hours)');
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error('[trip-qr] Failed to verify QR:', error);
    return null;
  }
}

/**
 * Create HMAC-SHA256 signature for trip data
 * @param payload - The trip payload to sign
 * @returns Hex-encoded signature
 */
async function createSignature(payload: TripQRPayload): Promise<string> {
  // Get secret from environment (fallback to default for development)
  const secret = process.env.EXPO_PUBLIC_QR_SECRET || 'dev-secret-change-in-production';

  // Create deterministic JSON string (sorted keys)
  const message = JSON.stringify(payload, Object.keys(payload).sort());

  // Create signature using HMAC-SHA256
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    message + secret
  );

  return digest;
}

/**
 * Generate a 6-digit manual confirmation code as fallback
 * @param tripId - The trip ID to generate code for
 * @returns 6-digit numeric code
 */
export async function generateManualCode(tripId: string): Promise<string> {
  const secret = process.env.EXPO_PUBLIC_QR_SECRET || 'dev-secret-change-in-production';

  // Hash trip ID with secret
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    tripId + secret
  );

  // Take first 6 characters and convert to numeric code
  const numericHash = parseInt(hash.substring(0, 8), 16);
  const code = (numericHash % 1000000).toString().padStart(6, '0');

  return code;
}

/**
 * Verify a manual confirmation code
 * @param tripId - The trip ID to verify against
 * @param code - The 6-digit code to verify
 * @returns true if valid, false otherwise
 */
export async function verifyManualCode(tripId: string, code: string): Promise<boolean> {
  const expectedCode = await generateManualCode(tripId);
  return code === expectedCode;
}
