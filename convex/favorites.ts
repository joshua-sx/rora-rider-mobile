/**
 * Favorites Functions
 *
 * Rider-driver favorites for priority discovery.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * List favorites for a rider
 */
export const listForRider = query({
  args: {
    riderId: v.id("riders"),
  },
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_rider", (q) => q.eq("riderId", args.riderId))
      .collect();

    // Get driver details for each favorite
    const favoritesWithDrivers = await Promise.all(
      favorites.map(async (fav) => {
        const driver = await ctx.db.get(fav.driverId);
        return {
          id: fav._id,
          driverId: fav.driverId,
          createdAt: fav.createdAt,
          driver: driver
            ? {
                id: driver._id,
                name: driver.name,
                photoUrl: driver.photoUrl,
                rating:
                  driver.ratingCount > 0
                    ? driver.ratingSum / driver.ratingCount
                    : null,
                ratingCount: driver.ratingCount,
                isAcceptingRequests: driver.isAcceptingRequests,
                vehicleInfo: {
                  make: driver.vehicleInfo.make,
                  model: driver.vehicleInfo.model,
                  color: driver.vehicleInfo.color,
                },
              }
            : null,
        };
      })
    );

    // Filter out any with missing drivers
    return favoritesWithDrivers.filter((f) => f.driver !== null);
  },
});

/**
 * Check if a driver is favorited by a rider
 */
export const isFavorite = query({
  args: {
    riderId: v.id("riders"),
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_rider_driver", (q) =>
        q.eq("riderId", args.riderId).eq("driverId", args.driverId)
      )
      .unique();

    return favorite !== null;
  },
});

/**
 * Get favorite driver IDs for a rider (for discovery priority)
 */
export const getDriverIds = query({
  args: {
    riderId: v.id("riders"),
  },
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_rider", (q) => q.eq("riderId", args.riderId))
      .collect();

    return favorites.map((f) => f.driverId);
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Add a driver to favorites
 */
export const add = mutation({
  args: {
    riderId: v.id("riders"),
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args): Promise<Id<"favorites">> => {
    // Check if already favorited
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_rider_driver", (q) =>
        q.eq("riderId", args.riderId).eq("driverId", args.driverId)
      )
      .unique();

    if (existing) {
      return existing._id; // Already favorited, return existing
    }

    // Verify rider exists
    const rider = await ctx.db.get(args.riderId);
    if (!rider) {
      throw new Error("Rider not found");
    }

    // Verify driver exists
    const driver = await ctx.db.get(args.driverId);
    if (!driver) {
      throw new Error("Driver not found");
    }

    // Create favorite
    return await ctx.db.insert("favorites", {
      riderId: args.riderId,
      driverId: args.driverId,
      createdAt: Date.now(),
    });
  },
});

/**
 * Remove a driver from favorites
 */
export const remove = mutation({
  args: {
    riderId: v.id("riders"),
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_rider_driver", (q) =>
        q.eq("riderId", args.riderId).eq("driverId", args.driverId)
      )
      .unique();

    if (!favorite) {
      return { success: false, reason: "Not favorited" };
    }

    await ctx.db.delete(favorite._id);

    return { success: true };
  },
});

/**
 * Toggle favorite status
 */
export const toggle = mutation({
  args: {
    riderId: v.id("riders"),
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_rider_driver", (q) =>
        q.eq("riderId", args.riderId).eq("driverId", args.driverId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { isFavorite: false };
    }

    await ctx.db.insert("favorites", {
      riderId: args.riderId,
      driverId: args.driverId,
      createdAt: Date.now(),
    });

    return { isFavorite: true };
  },
});
