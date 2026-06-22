/**
 * Example usage of authentication and authorization in Convex functions
 * These are NOT production functions - just examples to show you how to use the auth system
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import {
  requireAuth,
  requireAdmin,
  requireOwnershipOrAdmin,
  isAuthenticated,
  isAdmin,
} from "./authorization";

// ==========================================
// Example 1: Protected Query (Require Auth)
// ==========================================
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    // This will throw if user is not authenticated
    const user = await requireAuth(ctx);

    // User is authenticated, return their profile
    return {
      userId: user._id,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };
  },
});

// ==========================================
// Example 2: Protected Mutation (Require Auth)
// ==========================================
export const updateMyProfile = mutation({
  args: {
    // Add fields you want users to update
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx);

    // Update user's own profile
    await ctx.db.patch(user._id, {
      updatedAt: Date.now(),
      // ...other fields
    });

    return { success: true };
  },
});

// ==========================================
// Example 3: Admin-Only Query
// ==========================================
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    // This will throw if user is not admin
    const admin = await requireAdmin(ctx);

    // Fetch all users (admin can see this)
    const users = await ctx.db.query("users").collect();

    // Don't return password hashes
    return users.map((user) => ({
      _id: user._id,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    }));
  },
});

// ==========================================
// Example 4: Admin-Only Mutation
// ==========================================
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Require admin role
    const admin = await requireAdmin(ctx);

    // Delete the user
    await ctx.db.delete(args.userId);

    return { success: true, message: "User deleted" };
  },
});

// ==========================================
// Example 5: Owner or Admin Access
// ==========================================
export const getUserBets = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // User can view their own bets, or admin can view any user's bets
    await requireOwnershipOrAdmin(ctx, args.userId);

    // Fetch bets for the user
    // Note: You'll need to update your bets table schema to have userId field
    const bets = await ctx.db
      .query("bets")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    return bets;
  },
});

// ==========================================
// Example 6: Optional Authentication
// ==========================================
export const getPublicData = query({
  args: {},
  handler: async (ctx) => {
    // Check if user is authenticated (doesn't throw)
    const isAuth = await isAuthenticated(ctx);

    // Check if user is admin
    const isAdminUser = await isAdmin(ctx);

    // Return different data based on auth state
    if (isAdminUser) {
      return { data: "admin-level-data", level: "admin" };
    } else if (isAuth) {
      return { data: "authenticated-user-data", level: "user" };
    } else {
      return { data: "public-data", level: "public" };
    }
  },
});

// ==========================================
// Example 7: Placing a Bet (Authenticated)
// ==========================================
export const placeBet = mutation({
  args: {
    selections: v.array(
      v.object({
        matchId: v.string(),
        marketKey: v.string(),
        oddValue: v.number(),
        // ...other fields
      })
    ),
    stake: v.number(),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx);

    // Calculate total odds
    const totalOdds = args.selections.reduce(
      (acc, sel) => acc * sel.oddValue,
      1
    );
    const potentialReturn = args.stake * totalOdds;

    // Create bet associated with the authenticated user
    const betId = await ctx.db.insert("bets", {
      userId: user._id, // Use authenticated user's ID
      selections: args.selections.map((sel) => ({
        id: crypto.randomUUID(),
        matchId: sel.matchId,
        matchName: "",
        team1: "",
        team2: "",
        market: sel.marketKey,
        selection: "",
        selectionName: "",
        odds: sel.oddValue,
        marketKey: sel.marketKey,
      })),
      totalOdds,
      stake: args.stake,
      potentialReturn,
      status: "active",
      placedAt: Date.now(),
    });

    return { success: true, betId };
  },
});

// ==========================================
// Example 8: Admin Configuration
// ==========================================
export const updateSystemSettings = mutation({
  args: {
    setting: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    // Only admins can update system settings
    const admin = await requireAdmin(ctx);

    // Update settings...
    // Your logic here

    return { success: true };
  },
});
