/**
 * Region Functions
 *
 * Multi-region configuration for pricing, discovery, and localization.
 * Sint Maarten is the MVP region.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get region by ID
 */
export const get = query({
  args: { id: v.id("regions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get region by country code
 */
export const getByCountry = query({
  args: { countryCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("regions")
      .withIndex("by_country", (q) => q.eq("countryCode", args.countryCode))
      .filter((q) => q.eq(q.field("isActive"), true))
      .unique();
  },
});

/**
 * Get all active regions
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("regions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

/**
 * Get default region (Sint Maarten for MVP)
 */
export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    // For MVP, Sint Maarten is the only region
    return await ctx.db
      .query("regions")
      .withIndex("by_country", (q) => q.eq("countryCode", "SX"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Seed the default Sint Maarten region
 */
export const seedSintMaarten = mutation({
  args: {},
  handler: async (ctx): Promise<Id<"regions">> => {
    // Check if already exists
    const existing = await ctx.db
      .query("regions")
      .withIndex("by_country", (q) => q.eq("countryCode", "SX"))
      .unique();

    if (existing) {
      return existing._id;
    }

    // Create Sint Maarten region
    const regionId = await ctx.db.insert("regions", {
      countryCode: "SX",
      islandName: "Sint Maarten",
      currencyCode: "USD",
      distanceUnit: "km",
      discoveryConfig: {
        wave1RadiusKm: 2,
        wave2RadiusKm: 5,
        wave3RadiusKm: 10,
        waveDurationSeconds: 60,
      },
      isActive: true,
    });

    // Seed default pricing rules
    await ctx.db.insert("pricingRules", {
      regionId,
      version: 1,
      baseFare: 500, // $5.00
      perKmRate: 200, // $2.00 per km
      perMinuteRate: 25, // $0.25 per minute
      minimumFare: 800, // $8.00 minimum
      goodDealThreshold: 10, // 10% below = good deal
      pricierThreshold: 15, // 15% above = pricier
      activeFrom: Date.now(),
      activeTo: undefined,
    });

    // Seed common zones
    const zones = [
      {
        name: "Princess Juliana Airport",
        // Approximate airport boundary (simplified polygon)
        boundary: [
          [-63.114, 18.041],
          [-63.108, 18.041],
          [-63.108, 18.045],
          [-63.114, 18.045],
          [-63.114, 18.041],
        ],
      },
      {
        name: "Philipsburg",
        boundary: [
          [-63.055, 18.015],
          [-63.035, 18.015],
          [-63.035, 18.025],
          [-63.055, 18.025],
          [-63.055, 18.015],
        ],
      },
      {
        name: "Simpson Bay",
        boundary: [
          [-63.095, 18.035],
          [-63.080, 18.035],
          [-63.080, 18.045],
          [-63.095, 18.045],
          [-63.095, 18.035],
        ],
      },
    ];

    const zoneIds: Id<"pricingZones">[] = [];
    for (const zone of zones) {
      const zoneId = await ctx.db.insert("pricingZones", {
        regionId,
        name: zone.name,
        boundary: zone.boundary,
      });
      zoneIds.push(zoneId);
    }

    // Seed fixed fares between zones
    // Airport -> Philipsburg: $25
    await ctx.db.insert("pricingFixedFares", {
      regionId,
      fromZoneId: zoneIds[0], // Airport
      toZoneId: zoneIds[1], // Philipsburg
      fareAmount: 2500, // $25.00
      version: 1,
    });

    // Philipsburg -> Airport: $25
    await ctx.db.insert("pricingFixedFares", {
      regionId,
      fromZoneId: zoneIds[1], // Philipsburg
      toZoneId: zoneIds[0], // Airport
      fareAmount: 2500, // $25.00
      version: 1,
    });

    // Airport -> Simpson Bay: $15
    await ctx.db.insert("pricingFixedFares", {
      regionId,
      fromZoneId: zoneIds[0], // Airport
      toZoneId: zoneIds[2], // Simpson Bay
      fareAmount: 1500, // $15.00
      version: 1,
    });

    return regionId;
  },
});

/**
 * Update region discovery config
 */
export const updateDiscoveryConfig = mutation({
  args: {
    regionId: v.id("regions"),
    config: v.object({
      wave1RadiusKm: v.number(),
      wave2RadiusKm: v.number(),
      wave3RadiusKm: v.number(),
      waveDurationSeconds: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.regionId, {
      discoveryConfig: args.config,
    });

    return { success: true };
  },
});
