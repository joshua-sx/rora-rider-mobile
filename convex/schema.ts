import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// =============================================================================
// ENUMS AS VALIDATORS
// =============================================================================

export const rideState = v.union(
  v.literal("created"),
  v.literal("discovery"),
  v.literal("hold"),
  v.literal("confirmed"),
  v.literal("active"),
  v.literal("completed"),
  v.literal("canceled"),
  v.literal("expired")
);

export const offerType = v.union(
  v.literal("match"),    // Driver accepts Rora Fare
  v.literal("counter")   // Driver proposes different amount
);

export const offerStatus = v.union(
  v.literal("pending"),
  v.literal("declined"),
  v.literal("expired"),
  v.literal("selected")
);

export const requestType = v.union(
  v.literal("broadcast"),  // Send to multiple drivers
  v.literal("direct")      // Send to specific driver (favorite)
);

export const priceLabel = v.union(
  v.literal("good_deal"),
  v.literal("normal"),
  v.literal("pricier")
);

export const driverStatus = v.union(
  v.literal("active"),
  v.literal("unverified"),
  v.literal("suspended")
);

export const verificationType = v.union(
  v.literal("government_registered"),
  v.literal("rora_verified")
);

export const rideEventType = v.union(
  v.literal("STATE_CHANGED"),
  v.literal("OFFER_CREATED"),
  v.literal("OFFER_SELECTED"),
  v.literal("OFFER_DECLINED"),
  v.literal("OFFER_EXPIRED"),
  v.literal("DISCOVERY_WAVE_SENT"),
  v.literal("QR_GENERATED"),
  v.literal("QR_SCANNED"),
  v.literal("HOLD_STARTED"),
  v.literal("HOLD_EXPIRED"),
  v.literal("CANCELED"),
  v.literal("COMPLETED")
);

export const actorType = v.union(
  v.literal("rider"),
  v.literal("driver"),
  v.literal("system")
);

export const reportCategory = v.union(
  v.literal("safety_concern"),
  v.literal("pricing_dispute"),
  v.literal("unprofessional_behavior"),
  v.literal("route_issue"),
  v.literal("vehicle_condition"),
  v.literal("other")
);

export const ticketStatus = v.union(
  v.literal("open"),
  v.literal("in_progress"),
  v.literal("resolved"),
  v.literal("closed")
);

// =============================================================================
// SCHEMA
// =============================================================================

export default defineSchema({
  // ---------------------------------------------------------------------------
  // REGIONS & PRICING
  // ---------------------------------------------------------------------------

  regions: defineTable({
    countryCode: v.string(),           // "SX" for Sint Maarten
    islandName: v.string(),            // "Sint Maarten"
    currencyCode: v.string(),          // "USD"
    distanceUnit: v.string(),          // "km" or "mi"
    discoveryConfig: v.object({
      wave1RadiusKm: v.number(),       // e.g., 2
      wave2RadiusKm: v.number(),       // e.g., 5
      wave3RadiusKm: v.number(),       // e.g., 10
      waveDurationSeconds: v.number(), // e.g., 60
    }),
    isActive: v.boolean(),
  }).index("by_country", ["countryCode"]),

  pricingRules: defineTable({
    regionId: v.id("regions"),
    version: v.number(),               // Incrementing version for audit
    baseFare: v.number(),              // Base fare in cents
    perKmRate: v.number(),             // Per-kilometer rate in cents
    perMinuteRate: v.number(),         // Per-minute rate in cents (optional)
    minimumFare: v.number(),           // Minimum fare in cents
    goodDealThreshold: v.number(),     // % below estimate = "good deal"
    pricierThreshold: v.number(),      // % above estimate = "pricier"
    activeFrom: v.number(),            // Unix timestamp
    activeTo: v.optional(v.number()),  // Unix timestamp, null = current
  })
    .index("by_region", ["regionId"])
    .index("by_region_active", ["regionId", "activeTo"]),

  pricingZones: defineTable({
    regionId: v.id("regions"),
    name: v.string(),                  // e.g., "Airport", "Philipsburg"
    // Polygon represented as array of [lng, lat] pairs
    boundary: v.array(v.array(v.number())),
  }).index("by_region", ["regionId"]),

  pricingFixedFares: defineTable({
    regionId: v.id("regions"),
    fromZoneId: v.id("pricingZones"),
    toZoneId: v.id("pricingZones"),
    fareAmount: v.number(),            // Fixed fare in cents
    version: v.number(),
  }).index("by_zones", ["fromZoneId", "toZoneId"]),

  // ---------------------------------------------------------------------------
  // RIDERS (includes guest mode)
  // ---------------------------------------------------------------------------

  riders: defineTable({
    // Auth linkage (one of these is set)
    authUserId: v.optional(v.string()),        // Convex Auth user ID when authenticated
    guestToken: v.optional(v.string()),        // Server-generated token for guests
    guestTokenExpiresAt: v.optional(v.number()), // TTL for guest token (30 days)

    // Profile (populated when authenticated)
    fullName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    preferredLanguage: v.string(),             // Default: "en"

    // Rate limiting for guests
    qrGenerationCount: v.number(),             // Reset hourly
    qrGenerationResetAt: v.number(),           // Unix timestamp

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_auth_user", ["authUserId"])
    .index("by_guest_token", ["guestToken"]),

  // ---------------------------------------------------------------------------
  // DRIVERS
  // ---------------------------------------------------------------------------

  drivers: defineTable({
    // Identity
    authUserId: v.optional(v.string()),        // If driver has app account
    name: v.string(),
    phoneNumber: v.string(),
    photoUrl: v.optional(v.string()),

    // Verification
    status: driverStatus,
    verifications: v.array(v.object({
      type: verificationType,
      verifiedAt: v.number(),
      expiresAt: v.optional(v.number()),
      documentRef: v.optional(v.string()),
    })),

    // Service info
    regionId: v.id("regions"),
    serviceAreas: v.array(v.string()),         // Area tags like "airport", "philipsburg"
    vehicleInfo: v.object({
      make: v.string(),
      model: v.string(),
      year: v.number(),
      color: v.string(),
      licensePlate: v.string(),
      capacity: v.number(),                    // Passenger capacity
    }),
    languages: v.array(v.string()),            // ["en", "es", "nl"]

    // Availability
    isAcceptingRequests: v.boolean(),
    lastSeenAt: v.number(),

    // Ratings (aggregate, updated via mutation)
    ratingCount: v.number(),
    ratingSum: v.number(),                     // Sum of all ratings (for avg calculation)

    // Rora Pro status
    isRoraPro: v.boolean(),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_region", ["regionId"])
    .index("by_status", ["status"])
    .index("by_accepting", ["isAcceptingRequests", "regionId"]),

  // ---------------------------------------------------------------------------
  // RIDES (Core state machine)
  // ---------------------------------------------------------------------------

  rides: defineTable({
    // Ownership
    riderId: v.id("riders"),
    driverId: v.optional(v.id("drivers")),     // Set when offer selected

    // Region
    regionId: v.id("regions"),

    // Route
    origin: v.object({
      lat: v.number(),
      lng: v.number(),
      label: v.string(),                       // Formatted address or place name
      placeId: v.optional(v.string()),         // Google Place ID
    }),
    destination: v.object({
      lat: v.number(),
      lng: v.number(),
      label: v.string(),
      placeId: v.optional(v.string()),
    }),
    routeSummary: v.optional(v.object({
      distanceMeters: v.number(),
      durationSeconds: v.number(),
      polyline: v.optional(v.string()),        // Encoded polyline for map display
    })),

    // State machine
    state: rideState,
    requestType: requestType,
    targetDriverId: v.optional(v.id("drivers")), // For direct requests

    // Pricing
    estimatedFare: v.number(),                 // Rora Fare in cents
    negotiatedFare: v.optional(v.number()),    // Final agreed amount in cents
    currency: v.string(),                      // "USD"
    pricingRuleVersion: v.number(),            // For audit trail
    fareMetadata: v.optional(v.any()),         // Calculation details for audit

    // Discovery tracking
    discoveryStartedAt: v.optional(v.number()),
    discoveryWave: v.optional(v.number()),     // Current wave (1, 2, or 3)

    // Selection & hold
    selectedOfferId: v.optional(v.id("rideOffers")),
    holdExpiresAt: v.optional(v.number()),     // 5-minute hold timeout

    // Completion
    confirmedAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),         // When ride actually begins
    completedAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    cancelReason: v.optional(v.string()),
    canceledBy: v.optional(actorType),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_rider", ["riderId"])
    .index("by_driver", ["driverId"])
    .index("by_state", ["state"])
    .index("by_rider_state", ["riderId", "state"]),

  // ---------------------------------------------------------------------------
  // RIDE OFFERS
  // ---------------------------------------------------------------------------

  rideOffers: defineTable({
    rideId: v.id("rides"),
    driverId: v.id("drivers"),

    // Offer details
    offerType: offerType,
    amount: v.number(),                        // In cents
    priceLabel: v.optional(priceLabel),        // Computed label for UI

    // Status
    status: offerStatus,
    expiresAt: v.number(),                     // Offer expiration

    // Response tracking
    respondedAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_ride", ["rideId"])
    .index("by_driver", ["driverId"])
    .index("by_ride_status", ["rideId", "status"]),

  // ---------------------------------------------------------------------------
  // RIDE EVENTS (Append-only audit ledger)
  // ---------------------------------------------------------------------------

  rideEvents: defineTable({
    rideId: v.id("rides"),

    // Event details
    type: rideEventType,
    fromState: v.optional(rideState),
    toState: v.optional(rideState),
    actor: actorType,
    actorId: v.optional(v.string()),           // rider/driver ID

    // Additional context
    metadata: v.optional(v.any()),             // Event-specific data

    // Timestamp
    createdAt: v.number(),
  })
    .index("by_ride", ["rideId"])
    .index("by_ride_type", ["rideId", "type"]),

  // ---------------------------------------------------------------------------
  // QR SESSIONS
  // ---------------------------------------------------------------------------

  qrSessions: defineTable({
    rideId: v.id("rides"),

    // Session token (short-lived, scannable)
    sessionToken: v.string(),                  // UUID or short code

    // Cached payload for offline display
    routeSummarySnapshot: v.object({
      originLabel: v.string(),
      destinationLabel: v.string(),
      estimatedFare: v.number(),
      currency: v.string(),
    }),
    payloadHash: v.string(),                   // For cache invalidation

    // Expiration
    expiresAt: v.number(),                     // 24-hour TTL

    // Scan tracking
    scannedAt: v.optional(v.number()),
    scannedByDriverId: v.optional(v.id("drivers")),

    // Timestamp
    createdAt: v.number(),
  })
    .index("by_session_token", ["sessionToken"])
    .index("by_ride", ["rideId"]),

  // ---------------------------------------------------------------------------
  // FAVORITES
  // ---------------------------------------------------------------------------

  favorites: defineTable({
    riderId: v.id("riders"),
    driverId: v.id("drivers"),
    createdAt: v.number(),
  })
    .index("by_rider", ["riderId"])
    .index("by_rider_driver", ["riderId", "driverId"]),

  // ---------------------------------------------------------------------------
  // RATINGS
  // ---------------------------------------------------------------------------

  ratings: defineTable({
    rideId: v.id("rides"),
    riderId: v.id("riders"),
    driverId: v.id("drivers"),

    stars: v.number(),                         // 1-5
    comment: v.optional(v.string()),

    createdAt: v.number(),
  })
    .index("by_ride", ["rideId"])
    .index("by_driver", ["driverId"])
    .index("by_rider", ["riderId"]),

  // ---------------------------------------------------------------------------
  // SUPPORT TICKETS
  // ---------------------------------------------------------------------------

  supportTickets: defineTable({
    rideId: v.optional(v.id("rides")),
    riderId: v.id("riders"),

    category: reportCategory,
    description: v.string(),
    status: ticketStatus,

    // Resolution
    resolvedAt: v.optional(v.number()),
    resolution: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_rider", ["riderId"])
    .index("by_status", ["status"]),

  // ---------------------------------------------------------------------------
  // DEVICES (Push notifications)
  // ---------------------------------------------------------------------------

  devices: defineTable({
    riderId: v.optional(v.id("riders")),
    driverId: v.optional(v.id("drivers")),

    pushToken: v.string(),                     // Expo push token
    platform: v.union(v.literal("ios"), v.literal("android")),
    isActive: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_rider", ["riderId"])
    .index("by_driver", ["driverId"])
    .index("by_push_token", ["pushToken"]),
});
