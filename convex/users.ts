import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Returns the current user from the `users` table using the subject claim
 * from the verified JWT. Returns null if unauthenticated.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return null;

      // The subject is the Convex user document _id
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("_id"), identity.subject))
        .unique();

      if (!user) return null;

      return {
        _id: user._id,
        phone: user.phone,
        role: user.role,
        // Expose as email/name for backwards compatibility
        email: user.phone,
        name: user.phone,
      };
    } catch {
      return null;
    }
  },
});

/**
 * Public query: look up a user by phone number.
 * Used by the registration API route to check for duplicates.
 */
export const getUserByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .unique();

    if (!user) return null;
    // Never expose the password hash
    return { _id: user._id, phone: user.phone };
  },
});

/**
 * Public query: look up a user's hashed password for login verification.
 * Returns the passwordHash and role — the API route handles bcrypt comparison.
 */
export const getUserForLogin = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .unique();

    if (!user) return null;
    return {
      _id: user._id,
      phone: user.phone,
      passwordHash: user.passwordHash,
      role: user.role,
    };
  },
});

/**
 * Public mutation: register a new user with a pre-hashed password.
 * Returns the new user's _id as a string.
 */
export const registerUser = mutation({
  args: {
    phone: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    // Guard against duplicates
    const existing = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .unique();

    if (existing) throw new Error("Phone number already registered");

    const id = await ctx.db.insert("users", {
      phone: args.phone,
      passwordHash: args.passwordHash,
      role: "user", // Default role is "user"
      createdAt: Date.now(),
    });

    // Initialize wallet
    await ctx.db.insert("wallets", {
      userId: id,
      balance: 0,
    });

    return id;
  },
});
