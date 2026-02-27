/**
 * Discovery Functions
 *
 * Handles the wave-based driver discovery process:
 * 1. Wave 1: Favorites + nearby drivers (smallest radius)
 * 2. Wave 2: Expanded radius
 * 3. Wave 3: Full region
 *
 * Each wave has a timeout before progressing to the next.
 */

import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";

// =============================================================================
// CONSTANTS
// =============================================================================

const WAVE_TIMEOUT_MS = 60 * 1000; // 60 seconds per wave
const MAX_WAVES = 3;

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get discovery status for a ride
 */
export const getStatus = query({
  args: {
    rideId: v.id("rides"),
  },
  handler: async (ctx, args) => {
    const ride = await ctx.db.get(args.rideId);
    if (!ride) return null;

    // Get pending offers count
    const offers = await ctx.db
      .query("rideOffers")
      .withIndex("by_ride_status", (q) =>
        q.eq("rideId", args.rideId).eq("status", "pending")
      )
      .collect();

    const now = Date.now();
    const pendingOffers = offers.filter((o) => o.expiresAt > now);

    return {
      state: ride.state,
      currentWave: ride.discoveryWave ?? 0,
      maxWaves: MAX_WAVES,
      offerCount: pendingOffers.length,
      discoveryStartedAt: ride.discoveryStartedAt,
      isDiscoveryActive: ride.state === "discovery",
    };
  },
});

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Start or continue discovery for a ride
 *
 * This is the main entry point for discovery orchestration.
 */
export const start = action({
  args: {
    rideId: v.id("rides"),
  },
  handler: async (ctx, args) => {
    // Get ride and region config
    const ride = await ctx.runQuery(api.rides.get, { id: args.rideId });
    if (!ride) {
      throw new Error("Ride not found");
    }

    if (ride.state !== "discovery") {
      throw new Error(`Cannot start discovery for ride in ${ride.state} state`);
    }

    const region = await ctx.runQuery(api.regions.get, { id: ride.regionId });
    if (!region) {
      throw new Error("Region not found");
    }

    // Run first wave
    await ctx.runMutation(internal.discovery.runWave, {
      rideId: args.rideId,
      wave: 1,
      radiusKm: region.discoveryConfig.wave1RadiusKm,
    });

    // Schedule next wave
    await ctx.scheduler.runAfter(WAVE_TIMEOUT_MS, internal.discovery.continueDiscovery, {
      rideId: args.rideId,
      nextWave: 2,
    });

    return { success: true, currentWave: 1 };
  },
});

// =============================================================================
// INTERNAL MUTATIONS (for scheduled jobs)
// =============================================================================

/**
 * Run a discovery wave
 *
 * Finds eligible drivers and notifies them.
 */
export const runWave = internalMutation({
  args: {
    rideId: v.id("rides"),
    wave: v.number(),
    radiusKm: v.number(),
  },
  handler: async (ctx, args) => {
    const ride = await ctx.db.get(args.rideId);
    if (!ride || ride.state !== "discovery") {
      return { skipped: true, reason: "Ride not in discovery state" };
    }

    // Get rider's favorites (wave 1 priority)
    let favoriteDriverIds: Id<"drivers">[] = [];
    if (args.wave === 1) {
      const favorites = await ctx.db
        .query("favorites")
        .withIndex("by_rider", (q) => q.eq("riderId", ride.riderId))
        .collect();
      favoriteDriverIds = favorites.map((f) => f.driverId);
    }

    // Find eligible drivers in radius
    const drivers = await ctx.db
      .query("drivers")
      .withIndex("by_accepting", (q) =>
        q.eq("isAcceptingRequests", true).eq("regionId", ride.regionId)
      )
      .collect();

    // Filter by distance
    const eligibleDrivers = drivers.filter((driver) => {
      // Skip if driver already has pending offer
      // (We'd need to check offers, simplified here)

      // Check if driver is within radius
      // For now, assume all drivers in region are eligible
      // TODO: Add actual geo filtering based on driver.lastLocation
      return driver.status === "active";
    });

    // Prioritize favorites in wave 1
    const sortedDrivers = args.wave === 1
      ? [
          ...eligibleDrivers.filter((d) => favoriteDriverIds.includes(d._id)),
          ...eligibleDrivers.filter((d) => !favoriteDriverIds.includes(d._id)),
        ]
      : eligibleDrivers;

    // Log wave event
    await ctx.db.insert("rideEvents", {
      rideId: args.rideId,
      type: "DISCOVERY_WAVE_SENT",
      actor: "system",
      metadata: {
        wave: args.wave,
        radiusKm: args.radiusKm,
        driverCount: sortedDrivers.length,
        favoriteCount: favoriteDriverIds.length,
      },
      createdAt: Date.now(),
    });

    // Update ride with current wave
    await ctx.db.patch(args.rideId, {
      discoveryWave: args.wave,
      updatedAt: Date.now(),
    });

    // TODO: Send push notifications to drivers
    // This would use ctx.scheduler to call an action that sends Expo push notifications

    return {
      success: true,
      wave: args.wave,
      notifiedDrivers: sortedDrivers.length,
    };
  },
});

/**
 * Continue discovery to next wave or expire
 */
export const continueDiscovery = internalMutation({
  args: {
    rideId: v.id("rides"),
    nextWave: v.number(),
  },
  handler: async (ctx, args) => {
    const ride = await ctx.db.get(args.rideId);
    if (!ride) return;

    // Check if ride is still in discovery
    if (ride.state !== "discovery") {
      return { skipped: true, reason: "Ride no longer in discovery" };
    }

    // Check if we have any pending offers
    const pendingOffers = await ctx.db
      .query("rideOffers")
      .withIndex("by_ride_status", (q) =>
        q.eq("rideId", args.rideId).eq("status", "pending")
      )
      .collect();

    const now = Date.now();
    const validOffers = pendingOffers.filter((o) => o.expiresAt > now);

    // If we have offers, don't continue to next wave
    // (rider can still select from current offers)
    if (validOffers.length > 0 && args.nextWave > 2) {
      return { skipped: true, reason: "Has pending offers" };
    }

    // Check if we've exhausted all waves
    if (args.nextWave > MAX_WAVES) {
      // No offers after all waves - expire the ride
      if (validOffers.length === 0) {
        await ctx.db.patch(args.rideId, {
          state: "expired",
          updatedAt: now,
        });

        await ctx.db.insert("rideEvents", {
          rideId: args.rideId,
          type: "STATE_CHANGED",
          fromState: "discovery",
          toState: "expired",
          actor: "system",
          metadata: { reason: "No offers after all discovery waves" },
          createdAt: now,
        });

        return { expired: true };
      }
      return { completed: true, offerCount: validOffers.length };
    }

    // Get region for next wave radius
    const region = await ctx.db.get(ride.regionId);
    if (!region) return;

    const radiusKm =
      args.nextWave === 2
        ? region.discoveryConfig.wave2RadiusKm
        : region.discoveryConfig.wave3RadiusKm;

    // Run next wave inline (already in mutation context)
    const drivers = await ctx.db
      .query("drivers")
      .withIndex("by_accepting", (q) =>
        q.eq("isAcceptingRequests", true).eq("regionId", ride.regionId)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    await ctx.db.insert("rideEvents", {
      rideId: args.rideId,
      type: "DISCOVERY_WAVE_SENT",
      actor: "system",
      metadata: {
        wave: args.nextWave,
        radiusKm,
        driverCount: drivers.length,
      },
      createdAt: now,
    });

    await ctx.db.patch(args.rideId, {
      discoveryWave: args.nextWave,
      updatedAt: now,
    });

    // Schedule next wave check
    // Note: In Convex, use ctx.scheduler.runAfter
    // await ctx.scheduler.runAfter(WAVE_TIMEOUT_MS, internal.discovery.continueDiscovery, {
    //   rideId: args.rideId,
    //   nextWave: args.nextWave + 1,
    // });

    return { success: true, wave: args.nextWave };
  },
});

/**
 * Manually expire discovery (for admin/testing)
 */
export const forceExpire = mutation({
  args: {
    rideId: v.id("rides"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ride = await ctx.db.get(args.rideId);
    if (!ride) {
      throw new Error("Ride not found");
    }

    if (ride.state !== "discovery") {
      throw new Error("Ride is not in discovery state");
    }

    const now = Date.now();

    await ctx.db.patch(args.rideId, {
      state: "expired",
      updatedAt: now,
    });

    await ctx.db.insert("rideEvents", {
      rideId: args.rideId,
      type: "STATE_CHANGED",
      fromState: "discovery",
      toState: "expired",
      actor: "system",
      metadata: { reason: args.reason ?? "Forced expiration" },
      createdAt: now,
    });

    return { success: true };
  },
});
