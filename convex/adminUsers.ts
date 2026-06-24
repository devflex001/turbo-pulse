import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAdmin, requireAuth } from "./auth/authorization";

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

type UserWithBan = {
  _id: Id<"users">;
  _creationTime: number;
  phone?: string;
  activeBan: {
    _id: Id<"users_bans">;
    reason: string;
    bannedAt: number;
    bannedUntil: number | null;
    isActive: boolean;
  } | null;
};

// ────────────────────────────────────────────────────────────────────────────
// QUERIES
// ────────────────────────────────────────────────────────────────────────────

/**
 * List all users with pagination and optional search
 * Admin-only query - returns realtime data with ban status
 */
export const listUsers = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
      id: v.optional(v.number()), // Added to accept extra field from usePaginatedQuery
    }),
    search: v.optional(v.string()),
    userId: v.optional(v.id("users")), // Add userId from client
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.userId);

    // Apply search filter if provided
    let paginatedUsers;
    if (args.search && args.search.trim()) {
      const searchTerm = args.search.toLowerCase().trim();
      // Query by phone using the index
      paginatedUsers = await ctx.db
        .query("users")
        .withIndex("by_phone", (q) => q.eq("phone", searchTerm))
        .order("desc")
        .paginate(args.paginationOpts);
    } else {
      // Query all users without index
      paginatedUsers = await ctx.db
        .query("users")
        .order("desc")
        .paginate(args.paginationOpts);
    }

    // Fetch ban status for each user
    const usersWithBans: UserWithBan[] = await Promise.all(
      paginatedUsers.page.map(async (user) => {
        const activeBan = await ctx.db
          .query("users_bans")
          .withIndex("by_userId_and_isActive", (q) =>
            q.eq("userId", user._id).eq("isActive", true)
          )
          .first();

        return {
          _id: user._id,
          _creationTime: user.createdAt,
          phone: user.phone,
          activeBan: activeBan
            ? {
              _id: activeBan._id,
              reason: activeBan.reason,
              bannedAt: activeBan.bannedAt,
              bannedUntil: activeBan.bannedUntil,
              isActive: activeBan.isActive,
            }
            : null,
        };
      })
    );

    return {
      page: usersWithBans,
      isDone: paginatedUsers.isDone,
      continueCursor: paginatedUsers.continueCursor,
    };
  },
});

/**
 * Get the current user's ban status (if any)
 * Used by BanScreen component to show ban information
 */
export const getMyBanStatus = query({
  args: {
    userId: v.optional(v.id("users")), // Add userId from client
  },
  handler: async (ctx, args) => {
    // Get current authenticated user
    const user = await requireAuth(ctx, args.userId);

    // Check for active ban
    const activeBan = await ctx.db
      .query("users_bans")
      .withIndex("by_userId_and_isActive", (q) =>
        q.eq("userId", user._id).eq("isActive", true)
      )
      .first();

    if (!activeBan) {
      return null;
    }

    // Check for pending appeal
    const pendingAppeal = await ctx.db
      .query("ban_appeals")
      .withIndex("by_banId", (q) => q.eq("banId", activeBan._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    return {
      ban: {
        _id: activeBan._id,
        userId: activeBan.userId,
        reason: activeBan.reason,
        bannedAt: activeBan.bannedAt,
        bannedUntil: activeBan.bannedUntil,
        isActive: activeBan.isActive,
      },
      pendingAppeal: pendingAppeal || null,
    };
  },
});

// ────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Edit user profile (phone number)
 * Admin-only mutation
 */
export const editUser = mutation({
  args: {
    userId: v.optional(v.id("users")), // Add userId from client
    targetUserId: v.id("users"),
    email: v.string(), // Maps to phone in this system
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.userId);

    const user = await ctx.db.get(args.targetUserId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update user phone number
    await ctx.db.patch(args.targetUserId, {
      phone: args.email,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: `User phone updated to ${args.email}`,
    };
  },
});

/**
 * Ban a user
 * Admin-only mutation
 */
export const banUser = mutation({
  args: {
    userId: v.optional(v.id("users")), // Add userId from client
    targetUserId: v.id("users"),
    reason: v.string(),
    durationHours: v.union(v.number(), v.null()), // null = permanent
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    const admin = await requireAdmin(ctx, args.userId);

    const user = await ctx.db.get(args.targetUserId);
    if (!user) {
      throw new Error("User not found");
    }

    // Deactivate any existing active bans
    const existingBans = await ctx.db
      .query("users_bans")
      .withIndex("by_userId_and_isActive", (q) =>
        q.eq("userId", args.targetUserId).eq("isActive", true)
      )
      .collect();

    for (const ban of existingBans) {
      await ctx.db.patch(ban._id, { isActive: false });
    }

    // Calculate ban expiration
    const bannedUntil =
      args.durationHours === null ? null : Date.now() + args.durationHours * 60 * 60 * 1000;

    // Create new ban
    const banId = await ctx.db.insert("users_bans", {
      userId: args.targetUserId,
      reason: args.reason,
      bannedAt: Date.now(),
      bannedUntil,
      isActive: true,
      bannedBy: admin.phone || admin._id.toString(),
    });

    return {
      success: true,
      banId,
      message: `User ${user.phone} has been banned`,
    };
  },
});

/**
 * Unban a user
 * Admin-only mutation
 */
export const unbanUser = mutation({
  args: {
    userId: v.optional(v.id("users")), // Add userId from client
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.userId);

    const user = await ctx.db.get(args.targetUserId);
    if (!user) {
      throw new Error("User not found");
    }

    // Deactivate all active bans
    const activeBans = await ctx.db
      .query("users_bans")
      .withIndex("by_userId_and_isActive", (q) =>
        q.eq("userId", args.targetUserId).eq("isActive", true)
      )
      .collect();

    for (const ban of activeBans) {
      await ctx.db.patch(ban._id, { isActive: false });
    }

    return {
      success: true,
      message: `User ${user.phone} has been unbanned`,
    };
  },
});

/**
 * Submit a ban appeal
 * User mutation - called by banned users
 */
export const submitAppeal = mutation({
  args: {
    userId: v.optional(v.id("users")), // Add userId from client
    banId: v.id("users_bans"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.userId);

    // Verify ban exists and belongs to this user
    const ban = await ctx.db.get(args.banId);
    if (!ban) {
      throw new Error("Ban not found");
    }

    if (ban.userId !== user._id) {
      throw new Error("Cannot appeal someone else's ban");
    }

    // Check if there's already a pending appeal
    const existingAppeal = await ctx.db
      .query("ban_appeals")
      .withIndex("by_banId", (q) => q.eq("banId", args.banId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingAppeal) {
      throw new Error("You already have a pending appeal for this ban");
    }

    // Create appeal
    const appealId = await ctx.db.insert("ban_appeals", {
      banId: args.banId,
      userId: user._id,
      message: args.message,
      status: "pending",
      submittedAt: Date.now(),
    });

    return {
      success: true,
      appealId,
      message: "Appeal submitted. Our team will review it shortly.",
    };
  },
});

/**
 * Get aggregated stats for the user administration overview.
 * Admin-only query.
 */
export const getUserStats = query({
  args: {
    userId: v.optional(v.id("users")), // Admin ID checking
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.userId);

    const allUsers = await ctx.db.query("users").collect();
    const totalUsers = allUsers.length;
    const adminUsers = allUsers.filter((u) => u.role === "admin").length;

    const activeBans = await ctx.db
      .query("users_bans")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const pendingAppeals = await ctx.db
      .query("ban_appeals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return {
      totalUsers,
      adminUsers,
      activeBans: activeBans.length,
      pendingAppeals: pendingAppeals.length,
    };
  },
});

