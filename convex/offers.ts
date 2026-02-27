/**
 * Ride Offer Functions
 *
 * Handles driver offers for rides and rider selection.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { offerType, offerStatus, priceLabel } from "./schema";

// =============================================================================
// CONSTANTS
// =============================================================================

const OFFER_TTL_MS = 5 * 60 * 1000; // 5 minutes

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get all offers for a ride
 *
 * Returns offers sorted by amount (best deals first).
 */
export const forRide = query({
  args: {
    rideId: v.id("rides"),
  },
  handler: async (ctx, args) => {
    const offers = await ctx.db
      .query("rideOffers")
      .withIndex("by_ride", (q) => q.eq("rideId", args.rideId))
      .collect();

    // Get driver details for each offer
    const offersWithDrivers = await Promise.all(
      offers.map(async (offer) => {
        const driver = await ctx.db.get(offer.driverId);
        return {
          ...offer,
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
                vehicleInfo: driver.vehicleInfo,
                isRoraPro: driver.isRoraPro,
              }
            : null,
        };
      })
    );

    // Sort by amount (ascending) - best deals first
    return offersWithDrivers.sort((a, b) => a.amount - b.amount);
  },
});

/**
 * Get pending offers for a ride (not expired, not declined)
 */
export const pendingForRide = query({
  args: {
    rideId: v.id("rides"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const offers = await ctx.db
      .query("rideOffers")
      .withIndex("by_ride_status", (q) =>
        q.eq("rideId", args.rideId).eq("status", "pending")
      )
      .collect();

    // Filter out expired offers
    return offers.filter((offer) => offer.expiresAt > now);
  },
});

/**
 * Get offer by ID with driver details
 */
export const get = query({
  args: {
    id: v.id("rideOffers"),
  },
  handler: async (ctx, args) => {
    const offer = await ctx.db.get(args.id);
    if (!offer) return null;

    const driver = await ctx.db.get(offer.driverId);

    return {
      ...offer,
      driver: driver
        ? {
            id: driver._id,
            name: driver.name,
            photoUrl: driver.photoUrl,
            rating:
              driver.ratingCount > 0
                ? driver.ratingSum / driver.ratingCount
                : null,
            vehicleInfo: driver.vehicleInfo,
          }
        : null,
    };
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create an offer from a driver
 *
 * Called by driver app when responding to a ride request.
 */
export const create = mutation({
  args: {
    rideId: v.id("rides"),
    driverId: v.id("drivers"),
    offerType: offerType,
    amount: v.number(), // In cents
  },
  handler: async (ctx, args): Promise<Id<"rideOffers">> => {
    const ride = await ctx.db.get(args.rideId);
    if (!ride) {
      throw new Error("Ride not found");
    }

    // Validate ride is in discovery state
    if (ride.state !== "discovery") {
      throw new Error(`Cannot create offer for ride in ${ride.state} state`);
    }

    const driver = await ctx.db.get(args.driverId);
    if (!driver) {
      throw new Error("Driver not found");
    }

    // Check driver hasn't already made an offer
    const existingOffer = await ctx.db
      .query("rideOffers")
      .withIndex("by_ride", (q) => q.eq("rideId", args.rideId))
      .filter((q) => q.eq(q.field("driverId"), args.driverId))
      .unique();

    if (existingOffer) {
      throw new Error("Driver has already made an offer for this ride");
    }

    const now = Date.now();

    // Compute price label
    const priceLabel = computePriceLabel(ride.estimatedFare, args.amount);

    // Create offer
    const offerId = await ctx.db.insert("rideOffers", {
      rideId: args.rideId,
      driverId: args.driverId,
      offerType: args.offerType,
      amount: args.amount,
      priceLabel,
      status: "pending",
      expiresAt: now + OFFER_TTL_MS,
      createdAt: now,
    });

    // Log event
    await ctx.db.insert("rideEvents", {
      rideId: args.rideId,
      type: "OFFER_CREATED",
      actor: "driver",
      actorId: args.driverId.toString(),
      metadata: {
        offerId,
        offerType: args.offerType,
        amount: args.amount,
        priceLabel,
      },
      createdAt: now,
    });

    return offerId;
  },
});

/**
 * Driver declines to make an offer
 *
 * Useful for tracking which drivers saw but passed on a request.
 */
export const decline = mutation({
  args: {
    rideId: v.id("rides"),
    driverId: v.id("drivers"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Log decline event
    await ctx.db.insert("rideEvents", {
      rideId: args.rideId,
      type: "OFFER_DECLINED",
      actor: "driver",
      actorId: args.driverId.toString(),
      metadata: { reason: args.reason },
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Expire stale offers
 *
 * Called by scheduled job to clean up expired offers.
 */
export const expireStaleOffers = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find all pending offers that have expired
    const expiredOffers = await ctx.db
      .query("rideOffers")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "pending"),
          q.lt(q.field("expiresAt"), now)
        )
      )
      .collect();

    let expiredCount = 0;

    for (const offer of expiredOffers) {
      await ctx.db.patch(offer._id, {
        status: "expired",
        respondedAt: now,
      });

      await ctx.db.insert("rideEvents", {
        rideId: offer.rideId,
        type: "OFFER_EXPIRED",
        actor: "system",
        metadata: { offerId: offer._id },
        createdAt: now,
      });

      expiredCount++;
    }

    return { expiredCount };
  },
});

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Compute price label based on estimated vs offered fare
 *
 * Uses percentage thresholds (typically 10% below = good deal, 15% above = pricier)
 */
function computePriceLabel(
  estimatedFare: number,
  offerAmount: number
): "good_deal" | "normal" | "pricier" {
  const GOOD_DEAL_THRESHOLD = -10; // 10% below estimate
  const PRICIER_THRESHOLD = 15; // 15% above estimate

  const percentDiff = ((offerAmount - estimatedFare) / estimatedFare) * 100;

  if (percentDiff <= GOOD_DEAL_THRESHOLD) {
    return "good_deal";
  } else if (percentDiff >= PRICIER_THRESHOLD) {
    return "pricier";
  }
  return "normal";
}
