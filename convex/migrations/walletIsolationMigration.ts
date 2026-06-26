import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

/**
 * Migration: Assign existing wallets to users
 * 
 * Strategy: 
 * 1. For each user that doesn't have a wallet, create one with 0 balance
 * 2. For existing wallets without userId, assign them to the first user 
 *    (this handles the legacy shared wallet scenario)
 */
export const migrateWalletsToPerUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all users
    const allUsers = await ctx.db.query("users").collect();

    // Get all wallets
    const allWallets = await ctx.db.query("wallets").collect();

    const migratedCount = { created: 0, existing: 0, updated: 0 };

    // First, handle wallets without userId (legacy shared wallet)
    const walletsWithoutUserId = allWallets.filter((w) => !w.userId);
    if (walletsWithoutUserId.length > 0 && allUsers.length > 0) {
      // Assign the shared wallet balance to the first user
      const firstUser = allUsers[0];
      for (const wallet of walletsWithoutUserId) {
        await ctx.db.patch(wallet._id, {
          userId: firstUser._id,
        });
        migratedCount.updated++;
      }
    }

    // Then, for each user, ensure they have a wallet
    for (const user of allUsers) {
      const userWallet = await ctx.db
        .query("wallets")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();

      if (!userWallet) {
        // User doesn't have a wallet yet, create one with 0 balance
        await ctx.db.insert("wallets", {
          userId: user._id,
          balance: 0,
        });
        migratedCount.created++;
      } else {
        migratedCount.existing++;
      }
    }

    console.log(`[Migration] Wallet isolation migration completed:
      - Created new wallets: ${migratedCount.created}
      - Updated legacy wallets: ${migratedCount.updated}
      - Existing user wallets: ${migratedCount.existing}
      - Total users: ${allUsers.length}`);

    return {
      success: true,
      message: `Migration completed. Created ${migratedCount.created} wallets and updated ${migratedCount.updated} legacy wallets.`,
      ...migratedCount,
    };
  },
});

/**
 * Cleanup: Remove any orphaned wallets (wallets without associated users)
 * This is a safe operation that can be run anytime
 */
export const cleanupOrphanedWallets = mutation({
  args: {},
  handler: async (ctx) => {
    const allWallets = await ctx.db.query("wallets").collect();
    const allUsers = await ctx.db.query("users").collect();
    const userIds = new Set(allUsers.map((u) => u._id));

    let deletedCount = 0;

    for (const wallet of allWallets) {
      // If wallet userId is not in user list, delete it
      if (wallet.userId) {
        const userId = wallet.userId as Id<"users">;
        if (!userIds.has(userId)) {
          await ctx.db.delete(wallet._id);
          deletedCount++;
        }
      }
    }

    console.log(`[Migration] Cleanup completed: Deleted ${deletedCount} orphaned wallets`);

    return {
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} orphaned wallets.`,
    };
  },
});

/**
 * Validation: Check wallet isolation integrity
 * Returns issues if any exist
 */
export const validateWalletIsolation = mutation({
  args: {},
  handler: async (ctx) => {
    const issues: string[] = [];

    // Get all users and wallets
    const allUsers = await ctx.db.query("users").collect();
    const allWallets = await ctx.db.query("wallets").collect();
    const userIds = new Set(allUsers.map((u) => u._id));

    // Check 1: Each user should have exactly one wallet
    for (const user of allUsers) {
      const userWallets = allWallets.filter((w) => w.userId === user._id);
      if (userWallets.length === 0) {
        issues.push(`User ${user._id} (${user.phone}) has no wallet`);
      } else if (userWallets.length > 1) {
        issues.push(`User ${user._id} (${user.phone}) has ${userWallets.length} wallets`);
      }
    }

    // Check 2: No orphaned wallets
    for (const wallet of allWallets) {
      if (wallet.userId) {
        const userId = wallet.userId as Id<"users">;
        if (!userIds.has(userId)) {
          issues.push(`Orphaned wallet ${wallet._id} with userId ${userId}`);
        }
      }
    }

    // Check 3: All bets have userId
    const allBets = await ctx.db.query("bets").collect();
    const betsWithoutUserId = allBets.filter((b) => !b.userId);
    if (betsWithoutUserId.length > 0) {
      issues.push(`${betsWithoutUserId.length} bets without userId`);
    }

    // Check 4: All transactions have userId
    const allTransactions = await ctx.db.query("transactions").collect();
    const txsWithoutUserId = allTransactions.filter((t) => !t.userId);
    if (txsWithoutUserId.length > 0) {
      issues.push(`${txsWithoutUserId.length} transactions without userId`);
    }

    return {
      healthy: issues.length === 0,
      issues,
      summary: {
        totalUsers: allUsers.length,
        totalWallets: allWallets.length,
        totalBets: allBets.length,
        totalTransactions: allTransactions.length,
        betsWithoutUserId: betsWithoutUserId.length,
        transactionsWithoutUserId: txsWithoutUserId.length,
      },
    };
  },
});
