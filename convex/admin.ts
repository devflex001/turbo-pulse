import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getAdminStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { isAdmin: false };
    }

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    return { isAdmin: admin !== null };
  },
});

export const seedAdmin = mutation({
  args: {
    email: v.string(),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    const existingAdmin = await ctx.db.query("admins").first();
    if (existingAdmin !== null) {
      throw new Error("Admin already seeded");
    }

    if (args.secret !== process.env.ADMIN_SEED_SECRET) {
      throw new Error("Invalid seed secret");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      throw new Error("User not found. Register first, then seed admin.");
    }

    await ctx.db.insert("admins", {
      userId: user._id,
      email: args.email,
      addedAt: Date.now(),
    });

    return { success: true };
  },
});

export const makeAdmin = mutation({
  args: {
    targetEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const callerAdmin = await ctx.db
      .query("admins")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!callerAdmin) {
      throw new Error("Unauthorized: caller is not an admin");
    }

    const targetUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.targetEmail))
      .unique();

    if (!targetUser) {
      throw new Error("Target user not found");
    }

    const existingAdmin = await ctx.db
      .query("admins")
      .withIndex("by_userId", (q) => q.eq("userId", targetUser._id))
      .unique();

    if (existingAdmin) {
      throw new Error("User is already an admin");
    }

    await ctx.db.insert("admins", {
      userId: targetUser._id,
      email: args.targetEmail,
      addedAt: Date.now(),
    });

    return { success: true };
  },
});
