import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getAdminStatus = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return { isAdmin: false };
      }

      // Look up the user in our custom users table by their _id (subject)
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("_id"), identity.subject))
        .unique();

      if (!user) return { isAdmin: false };

      // Check the role field directly
      return { isAdmin: user.role === "admin" };
    } catch {
      return { isAdmin: false };
    }
  },
});

export const seedAdminUser = mutation({
  args: {
    phone: v.string(),
    passwordHash: v.string(),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.secret !== process.env.ADMIN_SEED_SECRET) {
      throw new Error("Invalid seed secret");
    }

    // 1. Check if user already exists
    let user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .unique();

    let userId;
    if (!user) {
      // Create user document with admin role
      userId = await ctx.db.insert("users", {
        phone: args.phone,
        passwordHash: args.passwordHash,
        role: "admin", // Set admin role
        createdAt: Date.now(),
      });

      // Initialize wallet
      await ctx.db.insert("wallets", {
        userId,
        balance: 0,
      });
    } else {
      userId = user._id;
      // Update password hash and role to match the seed config
      await ctx.db.patch(userId, {
        passwordHash: args.passwordHash,
        role: "admin", // Set admin role
      });
    }

    // 2. Register user in "admins" table
    const existingAdmin = await ctx.db
      .query("admins")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!existingAdmin) {
      await ctx.db.insert("admins", {
        userId,
        email: args.phone, // Phone number acts as email/identity
        addedAt: Date.now(),
      });
    }

    return { success: true, userId };
  },
});

export const resetDatabase = mutation({
  args: {
    secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (
      args.secret !== undefined &&
      args.secret !== process.env.ADMIN_SEED_SECRET
    ) {
      throw new Error("Invalid reset secret");
    }

    const totals: Record<string, number> = {};

    async function clearTable(tableName: string) {
      let count = 0;
      while (true) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const batch = await (ctx.db.query(tableName as any) as any).take(100);
        if (batch.length === 0) break;
        for (const doc of batch) {
          await ctx.db.delete(doc._id);
          count++;
        }
      }
      totals[tableName] = count;
    }

    // Delete in dependency order (do NOT delete users — admins live there)
    await clearTable("bets");
    await clearTable("wallets");
    await clearTable("transactions");
    await clearTable("sportsOdds");
    await clearTable("sportsMarkets");
    await clearTable("sportsMatches");
    await clearTable("scrapeRuns");
    await clearTable("scraperSettings");
    await clearTable("banAppeals");
    await clearTable("userBans");
    await clearTable("admins");

    return { success: true, deleted: totals };
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return { totalUsers: 0, totalDeposits: 0, activeBets: 0 };
      }

      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("_id"), identity.subject))
        .unique();

      if (!user || user.role !== "admin") {
        return { totalUsers: 0, totalDeposits: 0, activeBets: 0 };
      }

      const transactions = await ctx.db.query("transactions").take(500);
      const bets = await ctx.db.query("bets").take(500);

      const uniqueUserIds = new Set(transactions.map((t) => t.userId));

      const dbDepositsSum = transactions
        .filter((t) => t.type === "deposit" && t.status === "success")
        .reduce((acc, t) => acc + t.amount, 0);

      const dbActiveBetsCount = bets.filter((b) => b.status === "active").length;

      return {
        totalUsers: uniqueUserIds.size,
        totalDeposits: dbDepositsSum,
        activeBets: dbActiveBetsCount,
      };
    } catch {
      return { totalUsers: 0, totalDeposits: 0, activeBets: 0 };
    }
  },
});
