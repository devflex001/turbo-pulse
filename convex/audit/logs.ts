import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Audit Logging Module
 * Centralized logging for all admin actions
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
  | "update_custom_event_score"
  | "mark_event_finished"
  | "delete_custom_event"
  | "publish_custom_event"
  | "unpublish_custom_event"
  | "settle_custom_event"
  | "update_custom_market"
  | "update_custom_odds"
  | "create_custom_odds"
  | "update_platform_config"
  | "update_scraper_settings"
  | "run_scraper"
  | "update_payment_gateway_config"
  | "set_payment_mode"
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
// INTERNAL HELPERS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Internal helper to log admin actions
 * Called from other mutations to record activities
 */
export async function logAdminActionInternal(
  ctx: MutationCtx,
  input: AdminLogInput
): Promise<Id<"admin_logs">> {
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
}

// ────────────────────────────────────────────────────────────────────────────
// QUERIES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get recent admin logs for real-time activity feed
 */
export const getRecentAdminLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    return await ctx.db
      .query("admin_logs")
      .order("desc")
      .take(limit);
  },
});

/**
 * Get admin logs with pagination and filters
 */
export const getAdminLogs = query({
  args: {
    adminNameFilter: v.optional(v.string()),
    actionTypeFilter: v.optional(v.string()),
    resourceTypeFilter: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 100, 500);

    let logs;

    // Apply filters based on provided arguments
    if (args.adminNameFilter) {
      logs = await ctx.db
        .query("admin_logs")
        .withIndex("by_adminName", (q) =>
          q.eq("adminName", args.adminNameFilter!)
        )
        .order("desc")
        .take(limit);
    } else {
      logs = await ctx.db
        .query("admin_logs")
        .order("desc")
        .take(limit);
    }

    // Filter further if needed (for multiple filters)
    return {
      logs: logs.filter((log) => {
        if (
          args.actionTypeFilter &&
          log.actionType !== args.actionTypeFilter
        ) {
          return false;
        }
        if (
          args.resourceTypeFilter &&
          log.resourceType !== args.resourceTypeFilter
        ) {
          return false;
        }
        return true;
      }),
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
    const limit = Math.min(args.limit ?? 50, 200);
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
    const limit = Math.min(args.limit ?? 50, 200);
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
        .withIndex("by_adminName", (q) =>
          q.eq("adminName", args.adminName!)
        )
        .collect();
    } else {
      // Get recent logs for stats (last 1000 for performance)
      logs = await ctx.db
        .query("admin_logs")
        .order("desc")
        .take(1000);
    }

    // Count by action type
    const actionCounts: Record<string, number> = {};
    const resourceCounts: Record<string, number> = {};
    const adminCounts: Record<string, number> = {};

    logs.forEach((log) => {
      actionCounts[log.actionType] = (actionCounts[log.actionType] ?? 0) + 1;
      resourceCounts[log.resourceType] =
        (resourceCounts[log.resourceType] ?? 0) + 1;
      adminCounts[log.adminName] = (adminCounts[log.adminName] ?? 0) + 1;
    });

    return {
      totalActions: logs.length,
      actionCounts,
      resourceCounts,
      adminCounts,
    };
  },
});
