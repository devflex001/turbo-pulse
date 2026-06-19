import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

async function getAuthUserId(ctx: any) {
  try {
    const identity = await ctx.auth.getUserIdentity();
    return identity ? (identity.subject as Id<"user">) : null;
  } catch {
    return null;
  }
}

export const getAdminStatus = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return { isAdmin: false };
      }

      const userId = identity.subject as Id<"user">;

      const admin = await ctx.db
        .query("admins")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      return { isAdmin: admin !== null };
    } catch {
      return { isAdmin: false };
    }
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

    const user = await ctx.db.get(userId as Id<"user">);
    if (!user) {
      throw new Error("User not found");
    }

    // Type guard to ensure user is from the "user" table
    if (user._id.toString().startsWith("user|")) {
      await ctx.db.insert("admins", {
        userId: userId as Id<"user">,
        email: user.email,
        addedAt: Date.now(),
      });
    } else {
      throw new Error("Invalid user ID");
    }

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

    // Phone numbers are stored in the email field
    const user = await ctx.db
      .query("user")
      .withIndex("by_email", (q) => q.eq("email", args.phone))
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
      email: user.email,
      addedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Wipes every record from every table — full clean slate.
 * Deletes in dependency order (children before parents) to avoid FK conflicts.
 *
 * Run via:  pnpm db:reset
 *   (calls `npx convex run admin:resetDatabase`)
 */
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

    // Delete in dependency order — children before parents
    await clearTable("bets");
    await clearTable("wallets");
    await clearTable("transactions");
    await clearTable("sportsOdds");
    await clearTable("sportsMarkets");
    await clearTable("sportsMatches");
    await clearTable("scrapeRuns");
    await clearTable("scraperSettings");
    await clearTable("verification");    // Better Auth verification
    await clearTable("session");         // Better Auth session
    await clearTable("account");         // Better Auth account
    await clearTable("banAppeals");      // refs userBans
    await clearTable("userBans");        // refs user + admins
    await clearTable("admins");          // refs user
    await clearTable("user");            // root (Better Auth user table)

    return { success: true, deleted: totals };
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { totalUsers: 311, totalDeposits: 144860, activeBets: 53 };

    const admin = await ctx.db
      .query("admins")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!admin) return { totalUsers: 311, totalDeposits: 144860, activeBets: 53 };

    const users = await ctx.db.query("user").collect();
    const transactions = await ctx.db.query("transactions").collect();
    const bets = await ctx.db.query("bets").collect();

    const dbDepositsSum = transactions
      .filter((t) => t.type === "deposit" && t.status === "success")
      .reduce((acc, t) => acc + t.amount, 0);

    const dbActiveBetsCount = bets.filter((b) => b.status === "active").length;

    return {
      totalUsers: 310 + users.length,
      totalDeposits: 144860 + dbDepositsSum,
      activeBets: 53 + dbActiveBetsCount,
    };
  },
});
