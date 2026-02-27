/**
 * Support Functions
 *
 * Issue reporting and support ticket management.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { reportCategory, ticketStatus } from "./schema";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get open tickets for a rider
 */
export const openForRider = query({
  args: {
    riderId: v.id("riders"),
  },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("supportTickets")
      .withIndex("by_rider", (q) => q.eq("riderId", args.riderId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "open"),
          q.eq(q.field("status"), "in_progress")
        )
      )
      .collect();

    return tickets;
  },
});

/**
 * Get all tickets for a rider
 */
export const allForRider = query({
  args: {
    riderId: v.id("riders"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    return await ctx.db
      .query("supportTickets")
      .withIndex("by_rider", (q) => q.eq("riderId", args.riderId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get ticket by ID
 */
export const get = query({
  args: { id: v.id("supportTickets") },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.id);
    if (!ticket) return null;

    // Get associated ride if any
    let ride = null;
    if (ticket.rideId) {
      ride = await ctx.db.get(ticket.rideId);
    }

    return {
      ...ticket,
      ride: ride
        ? {
            id: ride._id,
            origin: ride.origin.label,
            destination: ride.destination.label,
            state: ride.state,
            createdAt: ride.createdAt,
          }
        : null,
    };
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Report an issue (create support ticket)
 */
export const reportIssue = mutation({
  args: {
    riderId: v.id("riders"),
    rideId: v.optional(v.id("rides")),
    category: reportCategory,
    description: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"supportTickets">> => {
    // Validate rider exists
    const rider = await ctx.db.get(args.riderId);
    if (!rider) {
      throw new Error("Rider not found");
    }

    // Validate ride if provided
    if (args.rideId) {
      const ride = await ctx.db.get(args.rideId);
      if (!ride) {
        throw new Error("Ride not found");
      }

      // Verify rider owns the ride
      if (ride.riderId !== args.riderId) {
        throw new Error("Can only report issues for your own rides");
      }
    }

    // Validate description
    if (args.description.trim().length < 10) {
      throw new Error("Description must be at least 10 characters");
    }

    const now = Date.now();

    // Create ticket
    return await ctx.db.insert("supportTickets", {
      riderId: args.riderId,
      rideId: args.rideId,
      category: args.category,
      description: args.description.trim(),
      status: "open",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update ticket status (for admin/support team)
 */
export const updateStatus = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    status: ticketStatus,
    resolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    const now = Date.now();
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: now,
    };

    if (args.status === "resolved" || args.status === "closed") {
      updates.resolvedAt = now;
      if (args.resolution) {
        updates.resolution = args.resolution;
      }
    }

    await ctx.db.patch(args.ticketId, updates);

    return { success: true };
  },
});

/**
 * Add additional information to a ticket
 */
export const addInfo = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    riderId: v.id("riders"),
    additionalInfo: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // Verify rider owns the ticket
    if (ticket.riderId !== args.riderId) {
      throw new Error("Can only update your own tickets");
    }

    // Can only add info to open/in_progress tickets
    if (ticket.status === "resolved" || ticket.status === "closed") {
      throw new Error("Cannot update resolved or closed tickets");
    }

    // Append to description
    const updatedDescription = `${ticket.description}\n\n[Additional Info - ${new Date().toISOString()}]\n${args.additionalInfo}`;

    await ctx.db.patch(args.ticketId, {
      description: updatedDescription,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
