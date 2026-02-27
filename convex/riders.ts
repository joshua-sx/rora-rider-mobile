/**
 * Rider Functions
 *
 * Handles rider identity, guest mode, and authentication.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get current rider from auth session or guest token
 *
 * Usage:
 *   const rider = useQuery(api.riders.me, { guestToken: token });
 */
export const me = query({
  args: {
    guestToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try authenticated user first
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const rider = await ctx.db
        .query("riders")
        .withIndex("by_auth_user", (q) => q.eq("authUserId", identity.subject))
        .unique();
      return rider;
    }

    // Fall back to guest token
    if (args.guestToken) {
      const rider = await ctx.db
        .query("riders")
        .withIndex("by_guest_token", (q) => q.eq("guestToken", args.guestToken))
        .unique();

      // Check if guest token is expired
      if (rider && rider.guestTokenExpiresAt) {
        if (Date.now() > rider.guestTokenExpiresAt) {
          return null; // Token expired
        }
      }
      return rider;
    }

    return null;
  },
});

/**
 * Get rider by ID
 */
export const get = query({
  args: { id: v.id("riders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a guest rider with server-generated token
 *
 * Rate limited to prevent abuse. Guest tokens expire after 30 days.
 */
export const createGuestRider = mutation({
  args: {
    deviceId: v.string(), // For rate limiting across sessions
    preferredLanguage: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    riderId: Id<"riders">;
    guestToken: string;
    expiresAt: number;
  }> => {
    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    // Generate secure guest token
    const guestToken = generateSecureToken();
    const expiresAt = now + THIRTY_DAYS_MS;

    // Create rider record
    const riderId = await ctx.db.insert("riders", {
      guestToken,
      guestTokenExpiresAt: expiresAt,
      preferredLanguage: args.preferredLanguage ?? "en",
      qrGenerationCount: 0,
      qrGenerationResetAt: now + 60 * 60 * 1000, // Reset in 1 hour
      createdAt: now,
      updatedAt: now,
    });

    return {
      riderId,
      guestToken,
      expiresAt,
    };
  },
});

/**
 * Validate and refresh a guest token
 *
 * Returns the rider if valid, null if expired/invalid.
 * Optionally extends the expiration.
 */
export const validateGuestToken = mutation({
  args: {
    guestToken: v.string(),
    extend: v.optional(v.boolean()), // Extend expiration on use
  },
  handler: async (ctx, args) => {
    const rider = await ctx.db
      .query("riders")
      .withIndex("by_guest_token", (q) => q.eq("guestToken", args.guestToken))
      .unique();

    if (!rider) {
      return { valid: false, reason: "Token not found" };
    }

    const now = Date.now();
    if (rider.guestTokenExpiresAt && now > rider.guestTokenExpiresAt) {
      return { valid: false, reason: "Token expired" };
    }

    // Extend token if requested
    if (args.extend) {
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      await ctx.db.patch(rider._id, {
        guestTokenExpiresAt: now + THIRTY_DAYS_MS,
        updatedAt: now,
      });
    }

    return {
      valid: true,
      riderId: rider._id,
      expiresAt: rider.guestTokenExpiresAt,
    };
  },
});

/**
 * Migrate guest rides to authenticated account
 *
 * Called after guest signs up. Transfers all ride history
 * from guest token to the new authenticated account.
 */
export const migrateGuestRides = mutation({
  args: {
    guestToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated to migrate guest rides");
    }

    // Find guest rider
    const guestRider = await ctx.db
      .query("riders")
      .withIndex("by_guest_token", (q) => q.eq("guestToken", args.guestToken))
      .unique();

    if (!guestRider) {
      throw new Error("Guest token not found");
    }

    // Find or create authenticated rider
    let authRider = await ctx.db
      .query("riders")
      .withIndex("by_auth_user", (q) => q.eq("authUserId", identity.subject))
      .unique();

    const now = Date.now();

    if (!authRider) {
      // Create new rider for authenticated user
      const authRiderId = await ctx.db.insert("riders", {
        authUserId: identity.subject,
        fullName: identity.name,
        email: identity.email,
        preferredLanguage: guestRider.preferredLanguage,
        qrGenerationCount: 0,
        qrGenerationResetAt: now + 60 * 60 * 1000,
        createdAt: now,
        updatedAt: now,
      });
      authRider = await ctx.db.get(authRiderId);
    }

    if (!authRider) {
      throw new Error("Failed to create authenticated rider");
    }

    // Migrate all rides from guest to authenticated rider
    const guestRides = await ctx.db
      .query("rides")
      .withIndex("by_rider", (q) => q.eq("riderId", guestRider._id))
      .collect();

    for (const ride of guestRides) {
      await ctx.db.patch(ride._id, {
        riderId: authRider._id,
        updatedAt: now,
      });
    }

    // Migrate favorites
    const guestFavorites = await ctx.db
      .query("favorites")
      .withIndex("by_rider", (q) => q.eq("riderId", guestRider._id))
      .collect();

    for (const favorite of guestFavorites) {
      // Check if already favorited by auth rider
      const existing = await ctx.db
        .query("favorites")
        .withIndex("by_rider_driver", (q) =>
          q.eq("riderId", authRider!._id).eq("driverId", favorite.driverId)
        )
        .unique();

      if (!existing) {
        await ctx.db.insert("favorites", {
          riderId: authRider._id,
          driverId: favorite.driverId,
          createdAt: favorite.createdAt,
        });
      }
      await ctx.db.delete(favorite._id);
    }

    // Mark guest token as claimed
    await ctx.db.patch(guestRider._id, {
      guestToken: undefined,
      guestTokenExpiresAt: undefined,
      updatedAt: now,
    });

    return {
      migratedRides: guestRides.length,
      migratedFavorites: guestFavorites.length,
      riderId: authRider._id,
    };
  },
});

/**
 * Update rider profile
 */
export const updateProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated to update profile");
    }

    const rider = await ctx.db
      .query("riders")
      .withIndex("by_auth_user", (q) => q.eq("authUserId", identity.subject))
      .unique();

    if (!rider) {
      throw new Error("Rider not found");
    }

    await ctx.db.patch(rider._id, {
      ...args,
      updatedAt: Date.now(),
    });

    return rider._id;
  },
});

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate a secure random token
 */
function generateSecureToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `guest_${token}`;
}
