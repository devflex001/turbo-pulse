import { v } from "convex/values";
import { query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Get the current authenticated user's profile
 * Uses Convex Auth's session to identify the user
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // Get the authenticated user identity from Convex Auth
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    // Extract userId from tokenIdentifier (format: "convex|<userId>")
    const tokenIdentifier = identity.tokenIdentifier;
    const userId = tokenIdentifier.split("|")[1] as Id<"users">;

    if (!userId) {
      return null;
    }

    // Fetch user from database
    const user = await ctx.db.get(userId);

    if (!user) {
      return null;
    }

    // Return user profile without password hash
    return {
      _id: user._id,
      phone: user.phone,
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
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return null;
    }

    // Return user profile without password hash
    return {
      _id: user._id,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
});
