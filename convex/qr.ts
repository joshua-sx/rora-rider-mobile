/**
 * QR Session Functions
 *
 * Handles QR code generation for ride handshake between rider and driver.
 * QR codes are short-lived (24 hours) and rate-limited for guests.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// CONSTANTS
// =============================================================================

const QR_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const GUEST_QR_RATE_LIMIT = 5; // Max QRs per hour for guests
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get QR session by token (for driver scanning)
 *
 * Returns the session with ride details for verification.
 */
export const getSession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("qrSessions")
      .withIndex("by_session_token", (q) =>
        q.eq("sessionToken", args.sessionToken)
      )
      .unique();

    if (!session) {
      return { valid: false, reason: "Session not found" };
    }

    // Check expiration
    if (Date.now() > session.expiresAt) {
      return { valid: false, reason: "Session expired" };
    }

    // Check if already scanned
    if (session.scannedAt) {
      return {
        valid: false,
        reason: "Already scanned",
        scannedAt: session.scannedAt,
      };
    }

    // Get the associated ride
    const ride = await ctx.db.get(session.rideId);
    if (!ride) {
      return { valid: false, reason: "Ride not found" };
    }

    return {
      valid: true,
      session: {
        sessionToken: session.sessionToken,
        rideId: session.rideId,
        routeSummary: session.routeSummarySnapshot,
        expiresAt: session.expiresAt,
      },
      ride: {
        id: ride._id,
        state: ride.state,
        origin: ride.origin,
        destination: ride.destination,
        estimatedFare: ride.estimatedFare,
        negotiatedFare: ride.negotiatedFare,
        currency: ride.currency,
      },
    };
  },
});

/**
 * Get latest QR session for a ride
 */
export const getSessionForRide = query({
  args: {
    rideId: v.id("rides"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("qrSessions")
      .withIndex("by_ride", (q) => q.eq("rideId", args.rideId))
      .order("desc")
      .take(1);

    const session = sessions[0];
    if (!session) return null;

    // Check if still valid
    if (Date.now() > session.expiresAt) {
      return { ...session, isExpired: true };
    }

    return { ...session, isExpired: false };
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new QR session for a ride
 *
 * Rate limited for guest riders (5 per hour).
 */
export const createSession = mutation({
  args: {
    rideId: v.id("rides"),
  },
  handler: async (ctx, args): Promise<QRSessionResult> => {
    const ride = await ctx.db.get(args.rideId);
    if (!ride) {
      throw new Error("Ride not found");
    }

    // Get the rider to check rate limits
    const rider = await ctx.db.get(ride.riderId);
    if (!rider) {
      throw new Error("Rider not found");
    }

    const now = Date.now();

    // Rate limit for guests
    if (!rider.authUserId) {
      // Check if rate limit window has reset
      if (rider.qrGenerationResetAt <= now) {
        // Reset counter
        await ctx.db.patch(rider._id, {
          qrGenerationCount: 0,
          qrGenerationResetAt: now + RATE_LIMIT_WINDOW_MS,
          updatedAt: now,
        });
      } else if (rider.qrGenerationCount >= GUEST_QR_RATE_LIMIT) {
        const resetIn = rider.qrGenerationResetAt - now;
        throw new Error(
          `Rate limit exceeded. Try again in ${Math.ceil(resetIn / 60000)} minutes`
        );
      }

      // Increment counter
      await ctx.db.patch(rider._id, {
        qrGenerationCount: rider.qrGenerationCount + 1,
        updatedAt: now,
      });
    }

    // Generate session token
    const sessionToken = generateSessionToken();

    // Create route summary snapshot for offline display
    const routeSummarySnapshot = {
      originLabel: ride.origin.label,
      destinationLabel: ride.destination.label,
      estimatedFare: ride.negotiatedFare ?? ride.estimatedFare,
      currency: ride.currency,
    };

    // Create payload hash for cache invalidation
    const payloadHash = hashObject(routeSummarySnapshot);

    // Create session
    const sessionId = await ctx.db.insert("qrSessions", {
      rideId: args.rideId,
      sessionToken,
      routeSummarySnapshot,
      payloadHash,
      expiresAt: now + QR_TTL_MS,
      createdAt: now,
    });

    // Log event
    await ctx.db.insert("rideEvents", {
      rideId: args.rideId,
      type: "QR_GENERATED",
      actor: "rider",
      actorId: ride.riderId.toString(),
      metadata: { sessionId, expiresAt: now + QR_TTL_MS },
      createdAt: now,
    });

    return {
      sessionId,
      sessionToken,
      payload: {
        t: sessionToken, // Token
        o: ride.origin.label, // Origin
        d: ride.destination.label, // Destination
        f: routeSummarySnapshot.estimatedFare, // Fare
        c: ride.currency, // Currency
        e: now + QR_TTL_MS, // Expiry
      },
      expiresAt: now + QR_TTL_MS,
    };
  },
});

/**
 * Mark a QR session as scanned
 *
 * Called when driver scans the QR code.
 */
export const markScanned = mutation({
  args: {
    sessionToken: v.string(),
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("qrSessions")
      .withIndex("by_session_token", (q) =>
        q.eq("sessionToken", args.sessionToken)
      )
      .unique();

    if (!session) {
      throw new Error("Session not found");
    }

    if (Date.now() > session.expiresAt) {
      throw new Error("Session expired");
    }

    if (session.scannedAt) {
      throw new Error("Session already scanned");
    }

    const now = Date.now();

    // Mark as scanned
    await ctx.db.patch(session._id, {
      scannedAt: now,
      scannedByDriverId: args.driverId,
    });

    // Log event
    await ctx.db.insert("rideEvents", {
      rideId: session.rideId,
      type: "QR_SCANNED",
      actor: "driver",
      actorId: args.driverId.toString(),
      metadata: { sessionId: session._id },
      createdAt: now,
    });

    return { success: true, rideId: session.rideId };
  },
});

// =============================================================================
// TYPES
// =============================================================================

export type QRSessionResult = {
  sessionId: Id<"qrSessions">;
  sessionToken: string;
  payload: {
    t: string; // Token
    o: string; // Origin
    d: string; // Destination
    f: number; // Fare
    c: string; // Currency
    e: number; // Expiry timestamp
  };
  expiresAt: number;
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate a short, scannable session token
 *
 * Format: XXXX-XXXX (8 chars, easy to type manually if needed)
 */
function generateSessionToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Omit confusing chars (0, O, I, 1)
  let token = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) token += "-";
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Simple hash for cache invalidation
 */
function hashObject(obj: Record<string, unknown>): string {
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}
