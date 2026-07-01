import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { requireAdmin } from "../auth/authorization";
import { logAdminActionInternal } from "../audit/logs";

/**
 * Admin Sessions Module
 * Manages admin identification and session tracking
 */

// Valid admin names (should match ADMIN_NAMES env var)
const VALID_ADMIN_NAMES = ["dikie", "hellen", "mwalimu"];

// ────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Internal helper to get admin session by token
 * Can be called from both queries and mutations
 */
export async function getAdminSessionByTokenInternal(
  ctx: QueryCtx | MutationCtx,
  sessionToken: string
): Promise<{
  _id: Id<"admin_sessions">;
  adminName: string;
  loginAt: number;
  lastActivityAt: number;
  userId: Id<"users">;
} | null> {
  const session = await ctx.db
    .query("admin_sessions")
    .withIndex("by_sessionToken", (q) => q.eq("sessionToken", sessionToken))
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
}

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
    return await getAdminSessionByTokenInternal(ctx, args.sessionToken);
  },
});

// Sessions inactive for longer than this are treated as stale / offline.
// Matches the heartbeat interval in the UI (5 min) with generous buffer.
const SESSION_STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Get all active admin sessions (other admins currently online).
 * Excludes sessions whose lastActivityAt is older than SESSION_STALE_THRESHOLD_MS
 * so crashed or abandoned tabs don't show as permanently online.
 */
export const getActiveAdmins = query({
  args: {},
  handler: async (ctx) => {
    const activeSessions = await ctx.db
      .query("admin_sessions")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const cutoff = Date.now() - SESSION_STALE_THRESHOLD_MS;

    return activeSessions
      .filter((session) => session.lastActivityAt >= cutoff)
      .map((session) => ({
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

    // Log the admin login
    await logAdminActionInternal(ctx, {
      adminName: normalizedName,
      userId: args.userId,
      actionType: "login",
      resourceType: "admin_session",
      resourceDescription: `Admin login (${normalizedName})`,
    });

    return {
      _id: sessionId,
      adminName: normalizedName,
      userId: args.userId,
    };
  },
});

/**
 * Update admin session activity timestamp.
 * Called as a heartbeat every few minutes to keep the session fresh.
 * Silently no-ops if the session no longer exists.
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

    if (!session || !session.isActive) {
      return null;
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
 * Log inactivity timeout logout (called before session ends)
 */
export const logInactivityLogout = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("admin_sessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session) {
      return { success: false };
    }

    // Log the inactivity timeout
    await logAdminActionInternal(ctx, {
      adminName: session.adminName,
      userId: session.userId,
      actionType: "logout",
      resourceType: "admin_session",
      resourceDescription: `Admin auto-logout due to inactivity (${session.adminName})`,
      details: {
        reason: "inactivity_timeout",
      },
    });

    return { success: true };
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

    // Log manual logout (inactivity logout is logged separately via logInactivityLogout mutation)
    await logAdminActionInternal(ctx, {
      adminName: session.adminName,
      userId: session.userId,
      actionType: "logout",
      resourceType: "admin_session",
      resourceDescription: `Admin manual logout (${session.adminName})`,
    });

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
