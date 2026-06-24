import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAdmin } from "./auth/authorization";

// ────────────────────────────────────────────────────────────────────────────
// QUERIES
// ────────────────────────────────────────────────────────────────────────────

/**
 * List all transactions with pagination, search, type, and status filters.
 * Admin-only query.
 */
export const listTransactions = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
      id: v.optional(v.number()),
    }),
    typeFilter: v.union(v.literal("deposit"), v.literal("withdrawal")),
    statusFilter: v.optional(v.string()),
    search: v.optional(v.string()),
    userId: v.optional(v.id("users")), // Admin checking
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.userId);

    const typeFilter = args.typeFilter;
    const statusFilter = args.statusFilter ?? "all";
    const search = args.search?.toLowerCase().trim();

    // If search is provided, we fetch a larger set of recent transactions and filter in memory
    if (search && search.length > 0) {
      let baseQuery = ctx.db.query("transactions").order("desc");

      // Filter by type
      baseQuery = baseQuery.filter((q) => q.eq(q.field("type"), typeFilter));

      if (statusFilter !== "all") {
        baseQuery = baseQuery.filter((q) => q.eq(q.field("status"), statusFilter));
      }

      const allTxs = await baseQuery.take(1000);

      const filtered = allTxs.filter((tx) => {
        if (tx.txId.toLowerCase().includes(search)) return true;
        if (tx.phone && tx.phone.toLowerCase().includes(search)) return true;
        if (tx.checkoutRequestID && tx.checkoutRequestID.toLowerCase().includes(search)) return true;
        if (tx.merchantRequestID && tx.merchantRequestID.toLowerCase().includes(search)) return true;
        if (tx.mpesaReceiptNumber && tx.mpesaReceiptNumber.toLowerCase().includes(search)) return true;
        if (tx.feedback && tx.feedback.toLowerCase().includes(search)) return true;
        if (tx.errorDetail && tx.errorDetail.toLowerCase().includes(search)) return true;
        return false;
      });

      // Implement manual in-memory pagination
      const numItems = args.paginationOpts.numItems;
      const cursor = args.paginationOpts.cursor;
      const startIndex = cursor ? parseInt(cursor, 10) : 0;

      if (isNaN(startIndex)) {
        return { page: [], isDone: true, continueCursor: "" };
      }

      const pageItems = filtered.slice(startIndex, startIndex + numItems);
      const nextIndex = startIndex + numItems;
      const isDone = nextIndex >= filtered.length;

      return {
        page: pageItems,
        isDone,
        continueCursor: isDone ? "" : nextIndex.toString(),
      };
    }

    // Default database pagination
    let baseQuery = ctx.db.query("transactions").order("desc");
    baseQuery = baseQuery.filter((q) => q.eq(q.field("type"), typeFilter));

    if (statusFilter !== "all") {
      baseQuery = baseQuery.filter((q) => q.eq(q.field("status"), statusFilter));
    }

    const paginated = await baseQuery.paginate(args.paginationOpts);
    return paginated;
  },
});

/**
 * Get aggregated statistics for admin transaction view (deposits or withdrawals).
 * Admin-only query.
 */
export const getAdminTransactionStats = query({
  args: {
    type: v.union(v.literal("deposit"), v.literal("withdrawal")),
    userId: v.optional(v.id("users")), // Admin checking
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const allTxs = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("type"), args.type))
      .collect();

    const stats = {
      totalCount: allTxs.length,
      successCount: 0,
      pendingCount: 0,
      failedCount: 0,
      totalVolume: 0,
    };

    allTxs.forEach((tx) => {
      if (tx.status === "success") {
        stats.successCount += 1;
        stats.totalVolume += tx.amount;
      } else if (tx.status === "pending") {
        stats.pendingCount += 1;
      } else if (tx.status === "failed" || tx.status === "cancelled") {
        stats.failedCount += 1;
      }
    });

    return stats;
  },
});
