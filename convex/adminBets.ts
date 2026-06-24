import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./auth/authorization";

// ────────────────────────────────────────────────────────────────────────────
// QUERIES
// ────────────────────────────────────────────────────────────────────────────

/**
 * List all bets with pagination, search, and status filters.
 * Admin-only query.
 */
export const listBets = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
      id: v.optional(v.number()),
    }),
    search: v.optional(v.string()),
    statusFilter: v.optional(v.string()),
    userId: v.optional(v.id("users")), // Admin ID checking
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.userId);

    const statusFilter = args.statusFilter ?? "all";
    const search = args.search?.toLowerCase().trim();

    // If search is provided, we fetch a larger set of recent bets and filter in memory
    // to allow substring matching on nested selections arrays.
    if (search && search.length > 0) {
      let baseQuery = ctx.db.query("bets").order("desc");
      if (statusFilter !== "all") {
        baseQuery = baseQuery.filter((q) => q.eq(q.field("status"), statusFilter));
      }
      
      const allBets = await baseQuery.take(1000);

      const filteredBets = allBets.filter((bet) => {
        // Match bet ID
        if (bet._id.toString().toLowerCase().includes(search)) return true;
        
        // Match selections
        for (const sel of bet.selections) {
          if (sel.matchName?.toLowerCase().includes(search)) return true;
          if (sel.team1?.toLowerCase().includes(search)) return true;
          if (sel.team2?.toLowerCase().includes(search)) return true;
          if (sel.market?.toLowerCase().includes(search)) return true;
          if (sel.selectionName?.toLowerCase().includes(search)) return true;
        }
        return false;
      });

      // Implement manual in-memory pagination to keep usePaginatedQuery interface intact
      const numItems = args.paginationOpts.numItems;
      const cursor = args.paginationOpts.cursor;
      const startIndex = cursor ? parseInt(cursor, 10) : 0;
      
      if (isNaN(startIndex)) {
        return { page: [], isDone: true, continueCursor: "" };
      }

      const pageItems = filteredBets.slice(startIndex, startIndex + numItems);
      const nextIndex = startIndex + numItems;
      const isDone = nextIndex >= filteredBets.length;

      return {
        page: pageItems,
        isDone,
        continueCursor: isDone ? "" : nextIndex.toString(),
      };
    }

    // Default pagination using Convex's database pagination
    let baseQuery = ctx.db.query("bets").order("desc");
    if (statusFilter !== "all") {
      baseQuery = baseQuery.filter((q) => q.eq(q.field("status"), statusFilter));
    }

    const paginated = await baseQuery.paginate(args.paginationOpts);
    return paginated;
  },
});

/**
 * Get aggregated bet stats for the admin overview.
 * Admin-only query.
 */
export const getAdminBetStats = query({
  args: {
    userId: v.optional(v.id("users")), // Admin ID checking
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const allBets = await ctx.db.query("bets").collect();

    const stats = {
      totalBets: allBets.length,
      totalStake: 0,
      totalPayout: 0,
      activeBets: 0,
      wonBets: 0,
      lostBets: 0,
      voidBets: 0,
    };

    allBets.forEach((bet) => {
      stats.totalStake += bet.stake;
      if (bet.status === "active") {
        stats.activeBets += 1;
      } else if (bet.status === "won") {
        stats.wonBets += 1;
        stats.totalPayout += bet.potentialReturn;
      } else if (bet.status === "lost") {
        stats.lostBets += 1;
      } else if (bet.status === "void" || bet.status === "cancelled") {
        stats.voidBets += 1;
        stats.totalPayout += bet.stake;
      }
    });

    return stats;
  },
});

// ────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Update the status of a single bet and adjust the wallet balance accordingly.
 * Admin-only mutation.
 */
export const updateBetStatus = mutation({
  args: {
    betId: v.id("bets"),
    status: v.union(
      v.literal("active"),
      v.literal("won"),
      v.literal("lost"),
      v.literal("void"),
      v.literal("cancelled")
    ),
    userId: v.optional(v.id("users")), // Admin ID checking
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.userId);

    const bet = await ctx.db.get(args.betId);
    if (!bet) {
      throw new Error("Bet not found");
    }

    const oldStatus = bet.status;
    const newStatus = args.status;

    if (oldStatus === newStatus) {
      return { success: true };
    }

    // 1. Calculate how much the user was refunded/paid out in the OLD status
    let oldRefund = 0;
    if (oldStatus === "won") {
      oldRefund = bet.potentialReturn;
    } else if (oldStatus === "cancelled" || oldStatus === "void") {
      oldRefund = bet.stake;
    }

    // 2. Calculate how much the user should be refunded/paid out in the NEW status
    let newRefund = 0;
    if (newStatus === "won") {
      newRefund = bet.potentialReturn;
    } else if (newStatus === "cancelled" || newStatus === "void") {
      newRefund = bet.stake;
    }

    // 3. Compute net balance adjustment: newRefund - oldRefund
    const adjustment = newRefund - oldRefund;

    // 4. Update the bet status
    await ctx.db.patch(args.betId, { status: newStatus });

    // 5. Update wallet balance if there is any adjustment
    if (adjustment !== 0) {
      const wallet = await ctx.db.query("wallets").first();
      if (wallet) {
        await ctx.db.patch(wallet._id, {
          balance: Math.max(0, wallet.balance + adjustment),
        });
      } else {
        await ctx.db.insert("wallets", {
          balance: Math.max(0, adjustment),
        });
      }
    }

    return {
      success: true,
      message: `Bet status updated from ${oldStatus} to ${newStatus}. Wallet balance adjusted by ${adjustment.toFixed(2)} KES.`,
    };
  },
});
