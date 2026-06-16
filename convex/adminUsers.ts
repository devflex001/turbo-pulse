import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Throws if the caller is not a logged-in admin. Returns the admin doc. */
async function requireAdmin(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  const admin = await ctx.db
    .query("admins")
    .withIndex("by_userId", (q) => q.eq("userId", userId as Id<"users">))
    .unique();

  if (!admin) throw new Error("Not authorized: admin access required");
  return admin;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Paginated list of all users with their current ban status joined in.
 */
export const listUsers = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_userId", (q) => q.eq("userId", userId as Id<"users">))
      .unique();
    if (!admin) throw new Error("Not authorized");

    const result = await ctx.db
      .query("users")
      .order("desc")
      .paginate(args.paginationOpts);

    // Attach active ban to each user
    const page = await Promise.all(
      result.page.map(async (user) => {
        const activeBan = await ctx.db
          .query("userBans")
          .withIndex("by_userId_and_isActive", (q) =>
            q.eq("userId", user._id).eq("isActive", true)
          )
          .unique();
        return { ...user, activeBan: activeBan ?? null };
      })
    );

    // Client-side search filter (bounded by the paginated page)
    const search = args.search?.toLowerCase().trim();
    const filtered = search
      ? page.filter(
          (u) =>
            u.phone?.toLowerCase().includes(search) ||
            u.email?.toLowerCase().includes(search) ||
            u._id.toLowerCase().includes(search)
        )
      : page;

    return { ...result, page: filtered };
  },
});

/**
 * Get the active ban (if any) for the currently logged-in user.
 * Used by the front-end to show the ban screen.
 */
export const getMyBanStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const activeBan = await ctx.db
      .query("userBans")
      .withIndex("by_userId_and_isActive", (q) =>
        q.eq("userId", userId as Id<"users">).eq("isActive", true)
      )
      .unique();

    if (!activeBan) return null;

    // Check if ban has expired
    if (activeBan.bannedUntil !== null && activeBan.bannedUntil < Date.now()) {
      return null; // Expired — treat as not banned (admin can clean up async)
    }

    // Check if user has a pending appeal for this ban
    const pendingAppeal = await ctx.db
      .query("banAppeals")
      .withIndex("by_banId", (q) => q.eq("banId", activeBan._id))
      .order("desc")
      .take(1);

    return {
      ban: activeBan,
      pendingAppeal: pendingAppeal[0] ?? null,
    };
  },
});

/**
 * Get all appeals for admin review.
 */
export const listAppeals = query({
  args: {
    paginationOpts: paginationOptsValidator,
    statusFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_userId", (q) => q.eq("userId", userId as Id<"users">))
      .unique();
    if (!admin) throw new Error("Not authorized");

    const result = await ctx.db
      .query("banAppeals")
      .withIndex("by_status", (q) =>
        args.statusFilter
          ? q.eq("status", args.statusFilter)
          : q.eq("status", "pending")
      )
      .order("desc")
      .paginate(args.paginationOpts);

    // Attach user info
    const page = await Promise.all(
      result.page.map(async (appeal) => {
        const user = await ctx.db.get(appeal.userId);
        const ban = await ctx.db.get(appeal.banId);
        return { ...appeal, user, ban };
      })
    );

    return { ...result, page };
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Ban a user. Deactivates any existing ban first, then inserts a new one.
 */
export const banUser = mutation({
  args: {
    targetUserId: v.id("users"),
    reason: v.string(),
    /** Duration in hours. null = permanent. */
    durationHours: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    // Deactivate any existing active ban
    const existingBan = await ctx.db
      .query("userBans")
      .withIndex("by_userId_and_isActive", (q) =>
        q.eq("userId", args.targetUserId).eq("isActive", true)
      )
      .unique();

    if (existingBan) {
      await ctx.db.patch(existingBan._id, { isActive: false });
    }

    const bannedUntil =
      args.durationHours !== null
        ? Date.now() + args.durationHours * 60 * 60 * 1000
        : null;

    await ctx.db.insert("userBans", {
      userId: args.targetUserId,
      reason: args.reason,
      bannedAt: Date.now(),
      bannedByAdminId: admin._id,
      bannedUntil,
      isActive: true,
    });

    return { success: true };
  },
});

/**
 * Unban a user — deactivates their active ban.
 */
export const unbanUser = mutation({
  args: {
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const activeBan = await ctx.db
      .query("userBans")
      .withIndex("by_userId_and_isActive", (q) =>
        q.eq("userId", args.targetUserId).eq("isActive", true)
      )
      .unique();

    if (!activeBan) throw new Error("User is not currently banned");

    await ctx.db.patch(activeBan._id, { isActive: false });
    return { success: true };
  },
});

/**
 * Edit a user's phone and/or email.
 */
export const editUser = mutation({
  args: {
    targetUserId: v.id("users"),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const phone = args.phone.trim();
    if (!phone) throw new Error("Phone number is required");

    await ctx.db.patch(args.targetUserId, { phone });
    return { success: true };
  },
});

/**
 * Submit a ban appeal (called by the banned user themselves).
 */
export const submitAppeal = mutation({
  args: {
    banId: v.id("userBans"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const ban = await ctx.db.get(args.banId);
    if (!ban) throw new Error("Ban not found");
    if (ban.userId !== userId) throw new Error("Not authorized");
    if (!ban.isActive) throw new Error("This ban is no longer active");

    // Check for existing pending appeal
    const existingAppeal = await ctx.db
      .query("banAppeals")
      .withIndex("by_banId", (q) => q.eq("banId", args.banId))
      .order("desc")
      .take(1);

    if (existingAppeal[0]?.status === "pending") {
      throw new Error("You already have a pending appeal for this ban");
    }

    await ctx.db.insert("banAppeals", {
      banId: args.banId,
      userId: userId as Id<"users">,
      message: args.message,
      submittedAt: Date.now(),
      status: "pending",
      reviewedAt: null,
      reviewedByAdminId: null,
      adminNote: null,
    });

    return { success: true };
  },
});

/**
 * Review a ban appeal (admin).
 */
export const reviewAppeal = mutation({
  args: {
    appealId: v.id("banAppeals"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const appeal = await ctx.db.get(args.appealId);
    if (!appeal) throw new Error("Appeal not found");
    if (appeal.status !== "pending") throw new Error("Appeal already reviewed");

    await ctx.db.patch(args.appealId, {
      status: args.decision,
      reviewedAt: Date.now(),
      reviewedByAdminId: admin._id,
      adminNote: args.adminNote ?? null,
    });

    // If approved, unban the user
    if (args.decision === "approved") {
      const ban = await ctx.db.get(appeal.banId);
      if (ban?.isActive) {
        await ctx.db.patch(appeal.banId, { isActive: false });
      }
    }

    return { success: true };
  },
});
