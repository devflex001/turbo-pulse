import { v } from "convex/values";
import { query, QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Get the current authenticated user's profile
 * Uses session token passed from client
 */
export const getCurrentUser = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx: QueryCtx, args: any) => {
    // Find session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_sessionToken", (q: any) =>
        q.eq("sessionToken", args.sessionToken)
      )
      .unique();

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      return null;
    }

    // Get user
    const user = await ctx.db.get(session.userId);

    if (!user) {
      return null;
    }

    // Return user profile without password hash
    return {
      _id: user._id,
      phone: user.phone,
      username: user.username || undefined,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
});

/**
 * Get user by ID (for admin or internal use)
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx: QueryCtx, args: any) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return null;
    }

    // Return user profile without password hash
    return {
      _id: user._id,
      phone: user.phone,
      username: user.username || undefined,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
});
