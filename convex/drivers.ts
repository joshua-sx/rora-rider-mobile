/**
 * Driver Functions
 *
 * Driver directory, profiles, and availability management.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { driverStatus, verificationType } from "./schema";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get driver directory for a region
 *
 * Returns verified drivers that are currently accepting requests.
 * Results are cached client-side for 24h offline fallback.
 */
export const directory = query({
  args: {
    regionId: v.id("regions"),
    filters: v.optional(
      v.object({
        serviceArea: v.optional(v.string()),
        minRating: v.optional(v.number()),
        languages: v.optional(v.array(v.string())),
        isRoraPro: v.optional(v.boolean()),
      })
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let drivers = await ctx.db
      .query("drivers")
      .withIndex("by_region", (q) => q.eq("regionId", args.regionId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(limit);

    // Apply filters
    if (args.filters) {
      const f = args.filters;

      if (f.serviceArea) {
        drivers = drivers.filter((d) =>
          d.serviceAreas.includes(f.serviceArea!)
        );
      }

      if (f.minRating !== undefined && f.minRating > 0) {
        drivers = drivers.filter((d) => {
          if (d.ratingCount === 0) return false;
          const avg = d.ratingSum / d.ratingCount;
          return avg >= f.minRating!;
        });
      }

      if (f.languages && f.languages.length > 0) {
        drivers = drivers.filter((d) =>
          f.languages!.some((lang) => d.languages.includes(lang))
        );
      }

      if (f.isRoraPro !== undefined) {
        drivers = drivers.filter((d) => d.isRoraPro === f.isRoraPro);
      }
    }

    // Transform for client display
    return drivers.map((d) => ({
      id: d._id,
      name: d.name,
      photoUrl: d.photoUrl,
      rating: d.ratingCount > 0 ? d.ratingSum / d.ratingCount : null,
      ratingCount: d.ratingCount,
      serviceAreas: d.serviceAreas,
      languages: d.languages,
      vehicleInfo: {
        make: d.vehicleInfo.make,
        model: d.vehicleInfo.model,
        color: d.vehicleInfo.color,
        capacity: d.vehicleInfo.capacity,
      },
      isRoraPro: d.isRoraPro,
      isAcceptingRequests: d.isAcceptingRequests,
      verifications: d.verifications.map((v) => ({
        type: v.type,
        isValid: !v.expiresAt || v.expiresAt > Date.now(),
      })),
    }));
  },
});

/**
 * Get driver by ID with full profile
 */
export const get = query({
  args: { id: v.id("drivers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get driver profile for public display
 */
export const getProfile = query({
  args: { id: v.id("drivers") },
  handler: async (ctx, args) => {
    const driver = await ctx.db.get(args.id);
    if (!driver) return null;

    // Get recent ratings (last 10)
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_driver", (q) => q.eq("driverId", args.id))
      .order("desc")
      .take(10);

    return {
      id: driver._id,
      name: driver.name,
      photoUrl: driver.photoUrl,
      phoneNumber: driver.phoneNumber, // For calling
      rating: driver.ratingCount > 0 ? driver.ratingSum / driver.ratingCount : null,
      ratingCount: driver.ratingCount,
      serviceAreas: driver.serviceAreas,
      languages: driver.languages,
      vehicleInfo: driver.vehicleInfo,
      isRoraPro: driver.isRoraPro,
      isAcceptingRequests: driver.isAcceptingRequests,
      verifications: driver.verifications.filter(
        (v) => !v.expiresAt || v.expiresAt > Date.now()
      ),
      recentRatings: ratings.map((r) => ({
        stars: r.stars,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
    };
  },
});

/**
 * Search drivers by name
 */
export const search = query({
  args: {
    regionId: v.id("regions"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const searchLower = args.query.toLowerCase();

    const drivers = await ctx.db
      .query("drivers")
      .withIndex("by_region", (q) => q.eq("regionId", args.regionId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(100); // Get more to filter

    // Filter by name match
    const matches = drivers
      .filter((d) => d.name.toLowerCase().includes(searchLower))
      .slice(0, limit);

    return matches.map((d) => ({
      id: d._id,
      name: d.name,
      photoUrl: d.photoUrl,
      rating: d.ratingCount > 0 ? d.ratingSum / d.ratingCount : null,
    }));
  },
});

// =============================================================================
// MUTATIONS (primarily for driver app, included for completeness)
// =============================================================================

/**
 * Update driver availability
 */
export const setAcceptingRequests = mutation({
  args: {
    driverId: v.id("drivers"),
    isAccepting: v.boolean(),
  },
  handler: async (ctx, args) => {
    // TODO: Verify caller is the driver (auth check)

    await ctx.db.patch(args.driverId, {
      isAcceptingRequests: args.isAccepting,
      lastSeenAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update driver last seen (heartbeat)
 */
export const heartbeat = mutation({
  args: {
    driverId: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.driverId, {
      lastSeenAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Seed demo drivers for development
 */
export const seedDemoDrivers = mutation({
  args: {
    regionId: v.id("regions"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const demoDrivers = [
      {
        name: "Marcus Johnson",
        phoneNumber: "+1-721-555-0101",
        serviceAreas: ["airport", "philipsburg", "simpson-bay"],
        vehicleInfo: {
          make: "Toyota",
          model: "Camry",
          year: 2022,
          color: "Silver",
          licensePlate: "T-1234",
          capacity: 4,
        },
        languages: ["en", "es"],
        isRoraPro: true,
        rating: 4.8,
        ratingCount: 127,
      },
      {
        name: "Claudette Pierre",
        phoneNumber: "+1-721-555-0102",
        serviceAreas: ["philipsburg", "great-bay"],
        vehicleInfo: {
          make: "Honda",
          model: "Accord",
          year: 2021,
          color: "White",
          licensePlate: "T-2345",
          capacity: 4,
        },
        languages: ["en", "fr", "nl"],
        isRoraPro: false,
        rating: 4.6,
        ratingCount: 89,
      },
      {
        name: "Ricardo Gomez",
        phoneNumber: "+1-721-555-0103",
        serviceAreas: ["airport", "maho", "simpson-bay"],
        vehicleInfo: {
          make: "Ford",
          model: "Explorer",
          year: 2023,
          color: "Black",
          licensePlate: "T-3456",
          capacity: 6,
        },
        languages: ["en", "es"],
        isRoraPro: true,
        rating: 4.9,
        ratingCount: 203,
      },
    ];

    const createdIds: Id<"drivers">[] = [];

    for (const driver of demoDrivers) {
      const id = await ctx.db.insert("drivers", {
        regionId: args.regionId,
        name: driver.name,
        phoneNumber: driver.phoneNumber,
        status: "active",
        verifications: [
          {
            type: "government_registered",
            verifiedAt: now - 30 * 24 * 60 * 60 * 1000, // 30 days ago
          },
        ],
        serviceAreas: driver.serviceAreas,
        vehicleInfo: driver.vehicleInfo,
        languages: driver.languages,
        isAcceptingRequests: true,
        lastSeenAt: now,
        ratingCount: driver.ratingCount,
        ratingSum: Math.round(driver.rating * driver.ratingCount),
        isRoraPro: driver.isRoraPro,
        createdAt: now,
        updatedAt: now,
      });
      createdIds.push(id);
    }

    return { created: createdIds.length, ids: createdIds };
  },
});
