import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { logAdminAction } from "../audit/logger";

/**
 * Admin Session Management
 * 
 * Handles admin identification and session tracking.
 * Admins must provide their name after login to access the admin panel.
 */

const VALID_ADMIN_NAMES = process.env.NEXT_PUBLIC_ADMIN_NAMES?.split(",") || [
  "dikie",
  "hellen",
  "mwalimu",
];

/**
 * Validate if a given admin name is valid
 */
export function isValidAdminName(name: string): boolean {
  return VALID_ADMIN_NAMES.includes(name.toLowerCase());
}

/**
 * Create a new admin session when admin provides their name
 */
export const startAdminSession = mutation({
  args: {
    userId: v.id("users"),
    adminName: v.string(),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate admin name
    if (!isValidAdminName(args.adminName)) {
      throw new Error(`Invalid admin name: ${args.adminName}`);
    }

    const now = Date.now();

    // Create admin session
    const sessionId = await ctx.db.insert("admin_sessions", {
      userId: args.userId,
      adminName: args.adminName.toLowerCase(),
      sessionToken: args.sessionToken,
      loginAt: now,
      lastActivityAt: now,
      isActive: true,
    });

    // Log the admin login
    await logAdminAction(ctx, {
      adminName: args.adminName.toLowerCase(),
      userId: args.userId,
      actionType: "login",
      resourceType: "admin",
      resourceDescription: `Admin logged in as ${args.adminName}`,
    });

    return {
      success: true,
      sessionId,
      adminName: args.adminName.toLowerCase(),
    };
  },
});

/**
 * End an admin session (logout)
 */
export const endAdminSession = mutation({
  args: {
    userId: v.id("users"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the active session
    const session = await ctx.db
      .query("admin_sessions")
      .withIndex("by_sessionToken", (q) =>
        q.eq("sessionToken", args.sessionToken)
      )
      .first();

    if (!session) {
      throw new Error("Admin session not found");
    }

    const now = Date.now();

    // Update session to inactive
    await ctx.db.patch(session._id, {
      isActive: false,
      logoutAt: now,
    });

    // Log the admin logout
    await logAdminAction(ctx, {
      adminName: session.adminName,
      userId: args.userId,
      actionType: "logout",
      resourceType: "admin",
      resourceDescription: `Admin logged out`,
    });

    return { success: true };
  },
});

/**
 * Update activity timestamp for an admin session (called on each interaction)
 */
export const updateAdminActivityTimestamp = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("admin_sessions")
      .withIndex("by_sessionToken", (q) =>
        q.eq("sessionToken", args.sessionToken)
      )
      .first();

    if (session && session.isActive) {
      await ctx.db.patch(session._id, {
        lastActivityAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Get the current active admin session
 */
export const getCurrentAdminSession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("admin_sessions")
      .withIndex("by_sessionToken", (q) =>
        q.eq("sessionToken", args.sessionToken)
      )
      .first();

    if (!session || !session.isActive) {
      return null;
    }

    return {
      adminName: session.adminName,
      userId: session.userId,
      loginAt: session.loginAt,
      lastActivityAt: session.lastActivityAt,
    };
  },
});

/**
 * Check if admin has an active session with a given name
 */
export const hasActiveAdminSession = query({
  args: {
    userId: v.id("users"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("admin_sessions")
      .withIndex("by_sessionToken", (q) =>
        q.eq("sessionToken", args.sessionToken)
      )
      .first();

    if (!session) {
      return { hasSession: false, adminName: null };
    }

    return {
      hasSession: session.isActive,
      adminName: session.adminName,
      loginAt: session.loginAt,
    };
  },
});

/**
 * Get currently active admins in the system
 */
export const getActiveAdmins = query({
  args: {},
  handler: async (ctx) => {
    const activeSessions = await ctx.db
      .query("admin_sessions")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    // Enrich with user info (without phone numbers)
    const activeAdmins = await Promise.all(
      activeSessions.map(async (session) => {
        const user = await ctx.db.get(session.userId);
        return {
          adminName: session.adminName,
          loginAt: session.loginAt,
          lastActivityAt: session.lastActivityAt,
          userId: session.userId,
        };
      })
    );

    return activeAdmins;
  },
});

/**
 * Get admin session history (all sessions, active and inactive)
 */
export const getAdminSessionHistory = query({
  args: {
    adminName: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30;

    let query = ctx.db.query("admin_sessions");

    if (args.adminName) {
      query = query.withIndex("by_adminName", (q) =>
        q.eq("adminName", args.adminName)
      );
    }

    return await query.order("desc").take(limit);
  },
});
