import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Audit Logger Module
 * Centralizes all admin activity logging
 */

export type AdminActionType =
  | "login"
  | "logout"
  | "ban_user"
  | "unban_user"
  | "edit_user"
  | "update_bet_status"
  | "approve_withdrawal"
  | "reject_withdrawal"
  | "create_custom_event"
  | "update_custom_event"
  | "settle_custom_event"
  | "update_custom_market"
  | "update_custom_odds"
  | "other";

export interface AdminLogInput {
  adminName: string;
  userId: Id<"users">;
  actionType: AdminActionType;
  resourceType: string;
  resourceDescription: string;
  details?: {
    previousValue?: string;
    newValue?: string;
    reason?: string;
    amount?: number;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Log an admin action (internal mutation - call from other mutations)
 */
const logAdminActionInternal = async (
  ctx: MutationCtx,
  input: AdminLogInput
): Promise<Id<"admin_logs">> => {
  const now = Date.now();

  const logId = await ctx.db.insert("admin_logs", {
    adminName: input.adminName,
    userId: input.userId,
    actionType: input.actionType,
    resourceType: input.resourceType,
    resourceDescription: input.resourceDescription,
    details: input.details,
    timestamp: now,
    createdAt: now,
  });

  return logId;
};

/**
 * Public mutation to log actions from client/mutations
 */
export const logAdminAction = mutation({
  args: {
    adminName: v.string(),
    userId: v.id("users"),
    actionType: v.string(),
    resourceType: v.string(),
    resourceDescription: v.string(),
    details: v.optional(
      v.object({
        previousValue: v.optional(v.string()),
        newValue: v.optional(v.string()),
        reason: v.optional(v.string()),
        amount: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await logAdminActionInternal(ctx, args as AdminLogInput);
  },
});

// ────────────────────────────────────────────────────────────────────────────
// QUERIES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get most recent admin logs (for real-time activity feed)
 */
export const getRecentAdminLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    return await ctx.db
      .query("admin_logs")
      .order("desc")
      .take(limit);
  },
});

/**
 * Get all admin logs with pagination
 */
export const getAdminLogs = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const logs = await ctx.db
      .query("admin_logs")
      .order("desc")
      .take(limit + 1);

    const cursor = args.cursor ? parseInt(args.cursor, 10) : 0;
    const page = logs.slice(cursor, cursor + limit);
    const hasMore = logs.length > cursor + limit;

    return {
      logs: page,
      hasMore,
      nextCursor: hasMore ? (cursor + limit).toString() : null,
    };
  },
});

/**
 * Get logs for a specific admin
 */
export const getAdminPersonalLogs = query({
  args: {
    adminName: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30;
    return await ctx.db
      .query("admin_logs")
      .withIndex("by_adminName_and_timestamp", (q) =>
        q.eq("adminName", args.adminName)
      )
      .order("desc")
      .take(limit);
  },
});

/**
 * Get logs by action type
 */
export const getLogsByActionType = query({
  args: {
    actionType: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30;
    return await ctx.db
      .query("admin_logs")
      .withIndex("by_actionType_and_timestamp", (q) =>
        q.eq("actionType", args.actionType as any)
      )
      .order("desc")
      .take(limit);
  },
});

/**
 * Get summary statistics for admin logs
 */
export const getAdminLogStats = query({
  args: {
    adminName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let logs;

    if (args.adminName) {
      logs = await ctx.db
        .query("admin_logs")
        .withIndex("by_adminName", (q) => q.eq("adminName", args.adminName!))
        .collect();
    } else {
      logs = await ctx.db.query("admin_logs").collect();
    }

    // Count by action type
    const actionCounts: Record<string, number> = {};
    const resourceCounts: Record<string, number> = {};

    logs.forEach((log) => {
      actionCounts[log.actionType] = (actionCounts[log.actionType] ?? 0) + 1;
      resourceCounts[log.resourceType] = (resourceCounts[log.resourceType] ?? 0) + 1;
    });

    return {
      totalActions: logs.length,
      actionCounts,
      resourceCounts,
    };
  },
});

// Export the internal function for use in other modules
export { logAdminActionInternal };
