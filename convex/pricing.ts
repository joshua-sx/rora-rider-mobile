/**
 * Pricing Functions
 *
 * Fare calculation using zone-based or distance-based rules.
 * All pricing is in cents to avoid floating point issues.
 */

import { v } from "convex/values";
import { query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get active pricing rules for a region
 */
export const getActiveRules = query({
  args: {
    regionId: v.id("regions"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find active pricing rule (activeTo is null or in future)
    const rules = await ctx.db
      .query("pricingRules")
      .withIndex("by_region", (q) => q.eq("regionId", args.regionId))
      .collect();

    // Return most recent active rule
    const activeRule = rules.find(
      (rule) => !rule.activeTo || rule.activeTo > now
    );

    return activeRule ?? null;
  },
});

/**
 * Get all pricing zones for a region
 */
export const getZones = query({
  args: {
    regionId: v.id("regions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pricingZones")
      .withIndex("by_region", (q) => q.eq("regionId", args.regionId))
      .collect();
  },
});

/**
 * Get fixed fare between two zones (if exists)
 */
export const getFixedFare = query({
  args: {
    fromZoneId: v.id("pricingZones"),
    toZoneId: v.id("pricingZones"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pricingFixedFares")
      .withIndex("by_zones", (q) =>
        q.eq("fromZoneId", args.fromZoneId).eq("toZoneId", args.toZoneId)
      )
      .unique();
  },
});

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Estimate fare for a route
 *
 * Strategy:
 * 1. Try zone-based fixed fare first (airport -> downtown, etc.)
 * 2. Fall back to distance-based calculation
 * 3. Include metadata for audit trail
 */
export const estimateFare = action({
  args: {
    regionId: v.id("regions"),
    origin: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    destination: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    distanceMeters: v.optional(v.number()), // From Google Directions API
    durationSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<FareEstimate> => {
    // Get active pricing rules
    const rules = await ctx.runQuery(api.pricing.getActiveRules, {
      regionId: args.regionId,
    });

    if (!rules) {
      throw new Error("No active pricing rules for region");
    }

    // Get zones to check for fixed fares
    const zones = await ctx.runQuery(api.pricing.getZones, {
      regionId: args.regionId,
    });

    // Find which zones origin and destination are in
    const originZone = findZoneForPoint(zones, args.origin);
    const destZone = findZoneForPoint(zones, args.destination);

    // Try fixed fare first
    if (originZone && destZone && originZone._id !== destZone._id) {
      const fixedFare = await ctx.runQuery(api.pricing.getFixedFare, {
        fromZoneId: originZone._id,
        toZoneId: destZone._id,
      });

      if (fixedFare) {
        return {
          amount: fixedFare.fareAmount,
          currency: "USD",
          pricingRuleVersion: fixedFare.version,
          calculationType: "fixed_zone",
          metadata: {
            fromZone: originZone.name,
            toZone: destZone.name,
            fixedFareId: fixedFare._id,
          },
        };
      }
    }

    // Fall back to distance-based calculation
    let distanceKm: number;

    if (args.distanceMeters) {
      // Use actual route distance from Google
      distanceKm = args.distanceMeters / 1000;
    } else {
      // Fall back to haversine (straight-line) distance
      distanceKm = haversineDistance(
        args.origin.lat,
        args.origin.lng,
        args.destination.lat,
        args.destination.lng
      );
    }

    // Calculate fare: base + (distance * perKm)
    let amount = rules.baseFare + Math.round(distanceKm * rules.perKmRate);

    // Add time component if available
    if (args.durationSeconds && rules.perMinuteRate) {
      const durationMinutes = args.durationSeconds / 60;
      amount += Math.round(durationMinutes * rules.perMinuteRate);
    }

    // Enforce minimum fare
    amount = Math.max(amount, rules.minimumFare);

    return {
      amount,
      currency: "USD",
      pricingRuleVersion: rules.version,
      calculationType: args.distanceMeters ? "distance_route" : "distance_haversine",
      metadata: {
        distanceKm: Math.round(distanceKm * 100) / 100,
        durationMinutes: args.durationSeconds
          ? Math.round(args.durationSeconds / 60)
          : null,
        baseFare: rules.baseFare,
        perKmRate: rules.perKmRate,
        perMinuteRate: rules.perMinuteRate,
        minimumFare: rules.minimumFare,
      },
    };
  },
});

/**
 * Compute price label (good deal / normal / pricier) for an offer
 */
export const computePriceLabel = query({
  args: {
    regionId: v.id("regions"),
    estimatedFare: v.number(),
    offerAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const rules = await ctx.db
      .query("pricingRules")
      .withIndex("by_region", (q) => q.eq("regionId", args.regionId))
      .first();

    if (!rules) {
      return "normal";
    }

    const percentDiff =
      ((args.offerAmount - args.estimatedFare) / args.estimatedFare) * 100;

    if (percentDiff <= -rules.goodDealThreshold) {
      return "good_deal";
    } else if (percentDiff >= rules.pricierThreshold) {
      return "pricier";
    }
    return "normal";
  },
});

// =============================================================================
// TYPES
// =============================================================================

export type FareEstimate = {
  amount: number; // In cents
  currency: string;
  pricingRuleVersion: number;
  calculationType: "fixed_zone" | "distance_route" | "distance_haversine";
  metadata: Record<string, unknown>;
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Calculate haversine distance between two points
 *
 * Returns distance in kilometers.
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if a point is inside a polygon zone
 *
 * Uses ray casting algorithm.
 */
function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: number[][]
): boolean {
  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Find which zone a point belongs to
 */
function findZoneForPoint(
  zones: Array<{ _id: Id<"pricingZones">; name: string; boundary: number[][] }>,
  point: { lat: number; lng: number }
): { _id: Id<"pricingZones">; name: string } | null {
  for (const zone of zones) {
    if (isPointInPolygon(point, zone.boundary)) {
      return { _id: zone._id, name: zone.name };
    }
  }
  return null;
}
