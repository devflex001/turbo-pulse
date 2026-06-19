/**
 * Internal Convex auth helpers.
 * These are internal functions — never exposed as public Convex API.
 */
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

/**
 * Look up a user by their normalized phone number.
 */
export const getUserByPhone = internalQuery({
  args: { phone: v.string() },
  handler: async (ctx, args): Promise<Doc<"users"> | null> => {
    return await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .unique();
  },
});

/**
 * Look up a user by their Convex document ID.
 */
export const getUserById = internalQuery({
  args: { id: v.id("users") },
  handler: async (ctx, args): Promise<Doc<"users"> | null> => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create a new user with a pre-hashed password.
 * Returns the new user's ID.
 */
export const createUser = internalMutation({
  args: {
    phone: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .unique();

    if (existing) {
      throw new Error("Phone number already registered");
    }

    const id = await ctx.db.insert("users", {
      phone: args.phone,
      passwordHash: args.passwordHash,
      role: "user", // Default role
      createdAt: Date.now(),
    });

    return id;
  },
});

/**
 * Initialize wallet for a newly created user.
 */
export const initWallet = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("wallets")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!existing) {
      await ctx.db.insert("wallets", {
        userId: args.userId,
        balance: 0,
      });
    }
  },
});
