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

      const adminPhone = process.env.ADMIN_EMAIL || "254712345678";

      // Look up the user in our custom users table by their _id (subject)
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("_id"), identity.subject))
        .unique();

      if (!user) return { isAdmin: false };

      // Normalize admin phone for comparison
      const normalizedAdminPhone = adminPhone.startsWith("+")
        ? adminPhone
        : `+${adminPhone}`;

      const isAdmin =
        user.phone === normalizedAdminPhone || user.phone === adminPhone;

      return { isAdmin };
    } catch {
      return { isAdmin: false };
    }
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

      const adminPhone = process.env.ADMIN_EMAIL || "254712345678";
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("_id"), identity.subject))
        .unique();

      if (!user) return { totalUsers: 0, totalDeposits: 0, activeBets: 0 };

      const normalizedAdminPhone = adminPhone.startsWith("+")
        ? adminPhone
        : `+${adminPhone}`;
      const isAdmin =
        user.phone === normalizedAdminPhone || user.phone === adminPhone;

      if (!isAdmin) {
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
