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
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const existingAdmin = await ctx.db.query("admins").first();
    if (existingAdmin !== null) {
      throw new Error("Admin already seeded");
    }

    if (args.secret !== process.env.ADMIN_SEED_SECRET) {
      throw new Error("Invalid seed secret");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.insert("admins", {
      userId: user._id,
      email: user.email ?? "",
      addedAt: Date.now(),
    });

    return { success: true };
  },
});

export const seedAdminByPhone = mutation({
  args: {
    phone: v.string(),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.secret !== process.env.ADMIN_SEED_SECRET) {
      throw new Error("Invalid seed secret");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("phone", (q) => q.eq("phone", args.phone))
      .unique();

    if (!user) {
      throw new Error(`No user found with phone ${args.phone}`);
    }

    const existingAdmin = await ctx.db
      .query("admins")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (existingAdmin) {
      return { success: true, message: "User is already an admin" };
    }

    await ctx.db.insert("admins", {
      userId: user._id,
      email: user.email ?? "",
      addedAt: Date.now(),
    });

    return { success: true };
  },
});
