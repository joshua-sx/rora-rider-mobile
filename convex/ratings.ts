/**
 * Ratings Functions
 *
 * Post-ride ratings and driver rating aggregation.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// CONSTANTS
// =============================================================================

const MIN_RATINGS_FOR_DISPLAY = 3; // Minimum ratings before showing average

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get rating summary for a driver
 *
 * Only returns aggregate if driver has minimum number of ratings.
 */
export const summaryForDriver = query({
  args: {
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    const driver = await ctx.db.get(args.driverId);
    if (!driver) return null;

    if (driver.ratingCount < MIN_RATINGS_FOR_DISPLAY) {
      return {
        hasEnoughRatings: false,
        ratingCount: driver.ratingCount,
        minimumRequired: MIN_RATINGS_FOR_DISPLAY,
      };
    }

    return {
      hasEnoughRatings: true,
      averageRating: driver.ratingSum / driver.ratingCount,
      ratingCount: driver.ratingCount,
    };
  },
});

/**
 * Get recent ratings for a driver (for profile display)
 */
export const recentForDriver = query({
  args: {
    driverId: v.id("drivers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .order("desc")
      .take(limit);

    // Don't include rider info for privacy
    return ratings.map((r) => ({
      id: r._id,
      stars: r.stars,
      comment: r.comment,
      createdAt: r.createdAt,
    }));
  },
});

/**
 * Check if a ride has been rated
 */
export const hasRatedRide = query({
  args: {
    rideId: v.id("rides"),
  },
  handler: async (ctx, args) => {
    const rating = await ctx.db
      .query("ratings")
      .withIndex("by_ride", (q) => q.eq("rideId", args.rideId))
      .unique();

    return rating !== null;
  },
});

/**
 * Get rating for a specific ride
 */
export const forRide = query({
  args: {
    rideId: v.id("rides"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ratings")
      .withIndex("by_ride", (q) => q.eq("rideId", args.rideId))
      .unique();
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Submit a rating for a completed ride
 *
 * Validates:
 * - Ride exists and is completed
 * - Ride hasn't already been rated
 * - Rider owns the ride
 * - Stars are 1-5
 */
export const submit = mutation({
  args: {
    rideId: v.id("rides"),
    riderId: v.id("riders"),
    stars: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"ratings">> => {
    // Validate stars
    if (args.stars < 1 || args.stars > 5 || !Number.isInteger(args.stars)) {
      throw new Error("Stars must be an integer between 1 and 5");
    }

    // Get ride
    const ride = await ctx.db.get(args.rideId);
    if (!ride) {
      throw new Error("Ride not found");
    }

    // Validate ride is completed
    if (ride.state !== "completed") {
      throw new Error("Can only rate completed rides");
    }

    // Validate rider owns the ride
    if (ride.riderId !== args.riderId) {
      throw new Error("Can only rate your own rides");
    }

    // Check if ride has a driver
    if (!ride.driverId) {
      throw new Error("Ride has no driver to rate");
    }

    // Check if already rated
    const existingRating = await ctx.db
      .query("ratings")
      .withIndex("by_ride", (q) => q.eq("rideId", args.rideId))
      .unique();

    if (existingRating) {
      throw new Error("Ride has already been rated");
    }

    const now = Date.now();

    // Create rating
    const ratingId = await ctx.db.insert("ratings", {
      rideId: args.rideId,
      riderId: args.riderId,
      driverId: ride.driverId,
      stars: args.stars,
      comment: args.comment,
      createdAt: now,
    });

    // Update driver aggregate rating
    const driver = await ctx.db.get(ride.driverId);
    if (driver) {
      await ctx.db.patch(ride.driverId, {
        ratingCount: driver.ratingCount + 1,
        ratingSum: driver.ratingSum + args.stars,
        updatedAt: now,
      });
    }

    return ratingId;
  },
});

/**
 * Update a rating (within time window)
 *
 * Riders can update their rating within 24 hours.
 */
export const update = mutation({
  args: {
    ratingId: v.id("ratings"),
    riderId: v.id("riders"),
    stars: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate stars
    if (args.stars < 1 || args.stars > 5 || !Number.isInteger(args.stars)) {
      throw new Error("Stars must be an integer between 1 and 5");
    }

    const rating = await ctx.db.get(args.ratingId);
    if (!rating) {
      throw new Error("Rating not found");
    }

    // Validate rider owns the rating
    if (rating.riderId !== args.riderId) {
      throw new Error("Can only update your own ratings");
    }

    // Check time window (24 hours)
    const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
    if (Date.now() - rating.createdAt > EDIT_WINDOW_MS) {
      throw new Error("Rating can only be updated within 24 hours");
    }

    // Update driver aggregate
    const driver = await ctx.db.get(rating.driverId);
    if (driver) {
      const starsDiff = args.stars - rating.stars;
      await ctx.db.patch(rating.driverId, {
        ratingSum: driver.ratingSum + starsDiff,
        updatedAt: Date.now(),
      });
    }

    // Update rating
    await ctx.db.patch(args.ratingId, {
      stars: args.stars,
      comment: args.comment,
    });

    return { success: true };
  },
});
