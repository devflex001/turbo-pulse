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

      // Check if user email matches admin email from env
      const adminEmail = process.env.ADMIN_EMAIL || "254712345678";
      
      // If user email matches admin email, they're an admin
      const isAdmin = identity.preferred_username === adminEmail || 
                      identity.email === adminEmail;

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

    // Delete in dependency order (skip Better Auth tables - managed by plugin)
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

      const adminEmail = process.env.ADMIN_EMAIL || "254712345678";
      const isAdmin = identity.preferred_username === adminEmail || 
                      identity.email === adminEmail;
      
      if (!isAdmin) {
        return { totalUsers: 0, totalDeposits: 0, activeBets: 0 };
      }

      // Get user count from the Better Auth component (managed tables)
      // For now, we can just count transactions and bets since we don't have direct access
      const transactions = await ctx.db.query("transactions").collect();
      const bets = await ctx.db.query("bets").collect();

      // Get unique user IDs from transactions to estimate user count
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
