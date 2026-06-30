import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { requireAdmin } from "../auth/authorization";

/**
 * Admin Sessions Module
 * Manages admin identification and session tracking
 */

// Valid admin names (should match ADMIN_NAMES env var)
const VALID_ADMIN_NAMES = ["dikie", "hellen", "mwalimu"];

// ────────────────────────────────────────────────────────────────────────────
// QUERIES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get current admin session for the authenticated admin
 * Returns session info if exists, null if no session
 */
export const getCurrentAdminSession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Find admin session by session token
    const session = await ctx.db
      .query("admin_sessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session) {
      return null;
    }

    // Check if session is still active
    if (!session.isActive) {
      return null;
    }

    return {
      _id: session._id,
      adminName: session.adminName,
      loginAt: session.loginAt,
      lastActivityAt: session.lastActivityAt,
      userId: session.userId,
    };
  },
});

/**
 * Get all active admin sessions (other admins currently online)
 */
export const getActiveAdmins = query({
  args: {},
  handler: async (ctx) => {
    const activeSessions = await ctx.db
      .query("admin_sessions")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    return activeSessions.map((session) => ({
      adminName: session.adminName,
      loginAt: session.loginAt,
      lastActivityAt: session.lastActivityAt,
      userId: session.userId,
    }));
  },
});

// ────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Start a new admin session
 * Called when admin logs in and selects their name
 */
export const startAdminSession = mutation({
  args: {
    userId: v.id("users"),
    adminName: v.string(),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate admin exists and is actually an admin
    const admin = await ctx.db.get(args.userId);
    if (!admin || admin.role !== "admin") {
      throw new Error("User is not an admin");
    }

    // Validate admin name
    const normalizedName = args.adminName.toLowerCase().trim();
    if (!VALID_ADMIN_NAMES.includes(normalizedName)) {
      throw new Error(
        `Invalid admin name. Valid names are: ${VALID_ADMIN_NAMES.join(", ")}`
      );
    }

    // Check if there's already an active session for this admin user
    const existingSession = await ctx.db
      .query("admin_sessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (existingSession) {
      // Session already exists, just update it
      await ctx.db.patch(existingSession._id, {
        isActive: true,
        lastActivityAt: Date.now(),
      });

      return {
        _id: existingSession._id,
        adminName: existingSession.adminName,
        userId: existingSession.userId,
      };
    }

    // Create new session
    const sessionId = await ctx.db.insert("admin_sessions", {
      userId: args.userId,
      adminName: normalizedName,
      sessionToken: args.sessionToken,
      loginAt: Date.now(),
      lastActivityAt: Date.now(),
      isActive: true,
    });

    return {
      _id: sessionId,
      adminName: normalizedName,
      userId: args.userId,
    };
  },
});

/**
 * Update admin session activity timestamp
 * Call this on every admin action to keep session active
 */
export const updateAdminSessionActivity = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("admin_sessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session) {
      throw new Error("Admin session not found");
    }

    await ctx.db.patch(session._id, {
      lastActivityAt: Date.now(),
    });

    return {
      _id: session._id,
      adminName: session.adminName,
    };
  },
});

/**
 * End admin session (logout)
 */
export const endAdminSession = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("admin_sessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session) {
      return { success: false, message: "Session not found" };
    }

    await ctx.db.patch(session._id, {
      isActive: false,
      logoutAt: Date.now(),
    });

    return {
      success: true,
      message: "Session ended",
      adminName: session.adminName,
    };
  },
});
