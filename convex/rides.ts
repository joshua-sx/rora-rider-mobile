/**
 * Ride Functions
 *
 * Core ride lifecycle: create, state transitions, cancel, complete.
 * All state transitions are validated server-side.
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";
import {
  validateTransition,
  canCancel,
  ACTIVE_STATES,
  TERMINAL_STATES,
} from "./lib/stateMachine";
import { rideState, requestType, actorType } from "./schema";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get a ride by ID
 */
export const get = query({
  args: { id: v.id("rides") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get current active ride for a rider
 *
 * Returns the most recent non-terminal ride.
 */
export const currentForRider = query({
  args: {
    riderId: v.id("riders"),
  },
  handler: async (ctx, args) => {
    // Find rides in active states, ordered by creation
    const rides = await ctx.db
      .query("rides")
      .withIndex("by_rider", (q) => q.eq("riderId", args.riderId))
      .order("desc")
      .collect();

    // Return first non-terminal ride
    return rides.find((ride) => ACTIVE_STATES.includes(ride.state)) ?? null;
  },
});

/**
 * Get ride history for a rider
 *
 * Returns completed/canceled rides for history display.
 */
export const historyForRider = query({
  args: {
    riderId: v.id("riders"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const rides = await ctx.db
      .query("rides")
      .withIndex("by_rider", (q) => q.eq("riderId", args.riderId))
      .order("desc")
      .take(limit);

    // Return only terminal rides with minimal data for list display
    return rides
      .filter((ride) => TERMINAL_STATES.includes(ride.state))
      .map((ride) => ({
        id: ride._id,
        origin: ride.origin.label,
        destination: ride.destination.label,
        state: ride.state,
        finalFare: ride.negotiatedFare ?? ride.estimatedFare,
        currency: ride.currency,
        completedAt: ride.completedAt,
        createdAt: ride.createdAt,
      }));
  },
});

/**
 * Get ride with full details including driver and offers
 */
export const getWithDetails = query({
  args: { id: v.id("rides") },
  handler: async (ctx, args) => {
    const ride = await ctx.db.get(args.id);
    if (!ride) return null;

    // Get driver if selected
    let driver = null;
    if (ride.driverId) {
      driver = await ctx.db.get(ride.driverId);
    }

    // Get all offers for this ride
    const offers = await ctx.db
      .query("rideOffers")
      .withIndex("by_ride", (q) => q.eq("rideId", args.id))
      .collect();

    // Get selected offer
    let selectedOffer = null;
    if (ride.selectedOfferId) {
      selectedOffer = await ctx.db.get(ride.selectedOfferId);
    }

    return {
      ...ride,
      driver,
      offers,
      selectedOffer,
    };
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new ride from a fare estimate
 *
 * This is the entry point for the ride flow.
 */
export const create = mutation({
  args: {
    riderId: v.id("riders"),
    regionId: v.id("regions"),
    origin: v.object({
      lat: v.number(),
      lng: v.number(),
      label: v.string(),
      placeId: v.optional(v.string()),
    }),
    destination: v.object({
      lat: v.number(),
      lng: v.number(),
      label: v.string(),
      placeId: v.optional(v.string()),
    }),
    routeSummary: v.optional(
      v.object({
        distanceMeters: v.number(),
        durationSeconds: v.number(),
        polyline: v.optional(v.string()),
      })
    ),
    estimatedFare: v.number(),
    currency: v.string(),
    pricingRuleVersion: v.number(),
    fareMetadata: v.optional(v.any()),
    requestType: requestType,
    targetDriverId: v.optional(v.id("drivers")),
  },
  handler: async (ctx, args): Promise<Id<"rides">> => {
    const now = Date.now();

    // Verify rider exists
    const rider = await ctx.db.get(args.riderId);
    if (!rider) {
      throw new Error("Rider not found");
    }

    // Check rider doesn't have an active ride
    const existingRides = await ctx.db
      .query("rides")
      .withIndex("by_rider", (q) => q.eq("riderId", args.riderId))
      .collect();

    const hasActiveRide = existingRides.some((r) =>
      ACTIVE_STATES.includes(r.state)
    );
    if (hasActiveRide) {
      throw new Error("Rider already has an active ride");
    }

    // Create ride in 'created' state
    const rideId = await ctx.db.insert("rides", {
      riderId: args.riderId,
      regionId: args.regionId,
      origin: args.origin,
      destination: args.destination,
      routeSummary: args.routeSummary,
      state: "created",
      requestType: args.requestType,
      targetDriverId: args.targetDriverId,
      estimatedFare: args.estimatedFare,
      currency: args.currency,
      pricingRuleVersion: args.pricingRuleVersion,
      fareMetadata: args.fareMetadata,
      createdAt: now,
      updatedAt: now,
    });

    // Log creation event
    await logRideEvent(ctx, rideId, {
      type: "STATE_CHANGED",
      toState: "created",
      actor: "rider",
      actorId: args.riderId,
    });

    return rideId;
  },
});

/**
 * Start discovery for a ride
 *
 * Transitions: created -> discovery
 * Triggers the discovery action to notify drivers.
 */
export const startDiscovery = mutation({
  args: {
    rideId: v.id("rides"),
  },
  handler: async (ctx, args) => {
    const ride = await ctx.db.get(args.rideId);
    if (!ride) {
      throw new Error("Ride not found");
    }

    // Validate state transition
    validateTransition(ride.state, "discovery");

    const now = Date.now();

    // Update ride state
    await ctx.db.patch(args.rideId, {
      state: "discovery",
      discoveryStartedAt: now,
      discoveryWave: 1,
      updatedAt: now,
    });

    // Log state change
    await logRideEvent(ctx, args.rideId, {
      type: "STATE_CHANGED",
      fromState: ride.state,
      toState: "discovery",
      actor: "rider",
      actorId: ride.riderId,
    });

    // Schedule discovery action (will notify drivers)
    // Note: This would be ctx.scheduler.runAfter in real implementation
    // await ctx.scheduler.runAfter(0, internal.discovery.runWave, {
    //   rideId: args.rideId,
    //   wave: 1,
    // });

    return { success: true, state: "discovery" };
  },
});

/**
 * Select an offer and enter hold state
 *
 * Transitions: discovery -> hold
 * Starts the 5-minute confirmation timer.
 */
export const selectOffer = mutation({
  args: {
    rideId: v.id("rides"),
    offerId: v.id("rideOffers"),
  },
  handler: async (ctx, args) => {
    const ride = await ctx.db.get(args.rideId);
    if (!ride) {
      throw new Error("Ride not found");
    }

    const offer = await ctx.db.get(args.offerId);
    if (!offer) {
      throw new Error("Offer not found");
    }

    if (offer.rideId !== args.rideId) {
      throw new Error("Offer does not belong to this ride");
    }

    if (offer.status !== "pending") {
      throw new Error(`Offer is ${offer.status}, cannot select`);
    }

    // Validate state transition
    validateTransition(ride.state, "hold");

    const now = Date.now();
    const HOLD_DURATION_MS = 5 * 60 * 1000; // 5 minutes

    // Update ride
    await ctx.db.patch(args.rideId, {
      state: "hold",
      driverId: offer.driverId,
      selectedOfferId: args.offerId,
      negotiatedFare: offer.amount,
      holdExpiresAt: now + HOLD_DURATION_MS,
      updatedAt: now,
    });

    // Mark offer as selected
    await ctx.db.patch(args.offerId, {
      status: "selected",
      respondedAt: now,
    });

    // Expire other pending offers
    const otherOffers = await ctx.db
      .query("rideOffers")
      .withIndex("by_ride", (q) => q.eq("rideId", args.rideId))
      .collect();

    for (const other of otherOffers) {
      if (other._id !== args.offerId && other.status === "pending") {
        await ctx.db.patch(other._id, {
          status: "expired",
          respondedAt: now,
        });
      }
    }

    // Log events
    await logRideEvent(ctx, args.rideId, {
      type: "OFFER_SELECTED",
      fromState: ride.state,
      toState: "hold",
      actor: "rider",
      actorId: ride.riderId,
      metadata: {
        offerId: args.offerId,
        driverId: offer.driverId,
        amount: offer.amount,
      },
    });

    await logRideEvent(ctx, args.rideId, {
      type: "HOLD_STARTED",
      actor: "system",
      metadata: { expiresAt: now + HOLD_DURATION_MS },
    });

    // Schedule hold timeout check
    // await ctx.scheduler.runAfter(HOLD_DURATION_MS, internal.rides.checkHoldTimeout, {
    //   rideId: args.rideId,
    //   expectedOfferId: args.offerId,
    // });

    return { success: true, state: "hold", holdExpiresAt: now + HOLD_DURATION_MS };
  },
});

/**
 * Confirm ride (after QR scan or manual confirmation)
 *
 * Transitions: hold -> confirmed
 */
export const confirm = mutation({
  args: {
    rideId: v.id("rides"),
    confirmedBy: actorType,
  },
  handler: async (ctx, args) => {
    const ride = await ctx.db.get(args.rideId);
    if (!ride) {
      throw new Error("Ride not found");
    }

    validateTransition(ride.state, "confirmed");

    const now = Date.now();

    await ctx.db.patch(args.rideId, {
      state: "confirmed",
      confirmedAt: now,
      updatedAt: now,
    });

    await logRideEvent(ctx, args.rideId, {
      type: "STATE_CHANGED",
      fromState: ride.state,
      toState: "confirmed",
      actor: args.confirmedBy,
      actorId: args.confirmedBy === "rider" ? ride.riderId : ride.driverId,
    });

    return { success: true, state: "confirmed" };
  },
});

/**
 * Start ride
 *
 * Transitions: confirmed -> active
 */
export const start = mutation({
  args: {
    rideId: v.id("rides"),
  },
  handler: async (ctx, args) => {
    const ride = await ctx.db.get(args.rideId);
    if (!ride) {
      throw new Error("Ride not found");
    }

    validateTransition(ride.state, "active");

    const now = Date.now();

    await ctx.db.patch(args.rideId, {
      state: "active",
      startedAt: now,
      updatedAt: now,
    });

    await logRideEvent(ctx, args.rideId, {
      type: "STATE_CHANGED",
      fromState: ride.state,
      toState: "active",
      actor: "driver",
      actorId: ride.driverId,
    });

    return { success: true, state: "active" };
  },
});

/**
 * Complete ride
 *
 * Transitions: active -> completed
 */
export const complete = mutation({
  args: {
    rideId: v.id("rides"),
    finalFare: v.optional(v.number()), // If different from negotiated
  },
  handler: async (ctx, args) => {
    const ride = await ctx.db.get(args.rideId);
    if (!ride) {
      throw new Error("Ride not found");
    }

    validateTransition(ride.state, "completed");

    const now = Date.now();

    await ctx.db.patch(args.rideId, {
      state: "completed",
      completedAt: now,
      negotiatedFare: args.finalFare ?? ride.negotiatedFare,
      updatedAt: now,
    });

    await logRideEvent(ctx, args.rideId, {
      type: "COMPLETED",
      fromState: ride.state,
      toState: "completed",
      actor: "driver",
      actorId: ride.driverId,
      metadata: { finalFare: args.finalFare ?? ride.negotiatedFare },
    });

    return { success: true, state: "completed" };
  },
});

/**
 * Cancel ride
 *
 * Can be called by rider or driver depending on state.
 */
export const cancel = mutation({
  args: {
    rideId: v.id("rides"),
    canceledBy: actorType,
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ride = await ctx.db.get(args.rideId);
    if (!ride) {
      throw new Error("Ride not found");
    }

    if (!canCancel(ride.state)) {
      throw new Error(`Cannot cancel ride in ${ride.state} state`);
    }

    const now = Date.now();

    await ctx.db.patch(args.rideId, {
      state: "canceled",
      canceledAt: now,
      canceledBy: args.canceledBy,
      cancelReason: args.reason,
      updatedAt: now,
    });

    await logRideEvent(ctx, args.rideId, {
      type: "CANCELED",
      fromState: ride.state,
      toState: "canceled",
      actor: args.canceledBy,
      actorId:
        args.canceledBy === "rider"
          ? ride.riderId
          : args.canceledBy === "driver"
            ? ride.driverId
            : undefined,
      metadata: { reason: args.reason },
    });

    return { success: true, state: "canceled" };
  },
});

// =============================================================================
// INTERNAL MUTATIONS (for scheduled jobs)
// =============================================================================

/**
 * Check if hold has timed out
 *
 * Called by scheduler after hold duration expires.
 */
export const checkHoldTimeout = internalMutation({
  args: {
    rideId: v.id("rides"),
    expectedOfferId: v.id("rideOffers"),
  },
  handler: async (ctx, args) => {
    const ride = await ctx.db.get(args.rideId);
    if (!ride) return;

    // Only act if still in hold state with same offer
    if (ride.state !== "hold" || ride.selectedOfferId !== args.expectedOfferId) {
      return;
    }

    // Check if actually expired
    if (ride.holdExpiresAt && Date.now() < ride.holdExpiresAt) {
      return;
    }

    const now = Date.now();

    // Log timeout event
    await logRideEvent(ctx, args.rideId, {
      type: "HOLD_EXPIRED",
      fromState: "hold",
      actor: "system",
    });

    // TODO: Implement fallback to next best offer or back to discovery
    // For now, just cancel
    await ctx.db.patch(args.rideId, {
      state: "canceled",
      canceledAt: now,
      canceledBy: "system",
      cancelReason: "Hold timeout - no confirmation received",
      updatedAt: now,
    });
  },
});

// =============================================================================
// HELPERS
// =============================================================================

type RideEventInput = {
  type: Doc<"rideEvents">["type"];
  fromState?: Doc<"rides">["state"];
  toState?: Doc<"rides">["state"];
  actor: Doc<"rideEvents">["actor"];
  actorId?: string | Id<"riders"> | Id<"drivers">;
  metadata?: Record<string, unknown>;
};

async function logRideEvent(
  ctx: { db: { insert: Function } },
  rideId: Id<"rides">,
  event: RideEventInput
): Promise<void> {
  await ctx.db.insert("rideEvents", {
    rideId,
    type: event.type,
    fromState: event.fromState,
    toState: event.toState,
    actor: event.actor,
    actorId: event.actorId?.toString(),
    metadata: event.metadata,
    createdAt: Date.now(),
  });
}
