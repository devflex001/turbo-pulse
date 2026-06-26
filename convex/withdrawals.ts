import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { requireAdmin, requireAuth } from "./auth/authorization";
import { updateWalletBalance } from "./mpesa";
import { notifyAdmins, notifyUser } from "./notifications";

const CONFIG_KEY = "main";

const CONFIG_DEFAULTS = {
  minWithdrawal: 500,
  withdrawalFeePercent: 2.5,
};

function formatKes(amount: number) {
  return `KES ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ────────────────────────────────────────────────────────────────────────────
// QUERIES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get the current user's withdrawal history.
 */
export const getMyWithdrawals = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.userId);

    const requests = await ctx.db
      .query("withdrawal_requests")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);

    return requests;
  },
});

/**
 * Admin: list all withdrawal requests with optional status filter.
 */
export const listWithdrawalRequests = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
      id: v.optional(v.number()),
    }),
    statusFilter: v.optional(
      v.union(
        v.literal("all"),
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected")
      )
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const statusFilter = args.statusFilter ?? "all";

    let baseQuery;

    if (statusFilter !== "all") {
      baseQuery = ctx.db
        .query("withdrawal_requests")
        .withIndex("by_status", (q) => q.eq("status", statusFilter))
        .order("desc");
    } else {
      baseQuery = ctx.db
        .query("withdrawal_requests")
        .order("desc");
    }

    const paginated = await baseQuery.paginate(args.paginationOpts);

    // Enrich each request with the user's phone
    const enriched = await Promise.all(
      paginated.page.map(async (req) => {
        const user = await ctx.db.get(req.userId);
        return {
          ...req,
          userPhone: user?.phone ?? "Unknown",
        };
      })
    );

    return {
      page: enriched,
      isDone: paginated.isDone,
      continueCursor: paginated.continueCursor,
    };
  },
});

/**
 * Admin: get stats for the withdrawal panel header.
 */
export const getWithdrawalStats = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const pending = await ctx.db
      .query("withdrawal_requests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const approved = await ctx.db
      .query("withdrawal_requests")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();

    const rejected = await ctx.db
      .query("withdrawal_requests")
      .withIndex("by_status", (q) => q.eq("status", "rejected"))
      .collect();

    const totalApprovedVolume = approved.reduce((sum, r) => sum + r.amount, 0);

    return {
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      total: pending.length + approved.length + rejected.length,
      totalApprovedVolume,
    };
  },
});

// ────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ────────────────────────────────────────────────────────────────────────────

/**
 * User submits a withdrawal request after paying the fee via Paystack.
 * Deducts the withdrawal amount from their wallet immediately (reserve).
 */
export const submitWithdrawalRequest = mutation({
  args: {
    userId: v.optional(v.id("users")),
    amount: v.number(),
    feeAmount: v.number(),
    feeTxReference: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.userId);

    // Load platform config
    const config = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", CONFIG_KEY))
      .unique();

    const minWithdrawal =
      config?.minWithdrawal ?? CONFIG_DEFAULTS.minWithdrawal;

    if (args.amount < minWithdrawal) {
      throw new Error(
        `Minimum withdrawal is KES ${minWithdrawal.toLocaleString()}`
      );
    }

    if (args.amount <= 0) {
      throw new Error("Withdrawal amount must be greater than 0");
    }

    // Check wallet balance
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (!wallet || wallet.balance < args.amount) {
      throw new Error("Insufficient wallet balance");
    }

    // Deduct from wallet (reserve funds)
    await updateWalletBalance(ctx, user._id, args.amount, "subtract");

    // Create withdrawal request
    const requestId = await ctx.db.insert("withdrawal_requests", {
      userId: user._id,
      amount: args.amount,
      feeAmount: args.feeAmount,
      feeTxReference: args.feeTxReference,
      phone: args.phone,
      status: "pending",
      isInstant: false,
      requestedAt: Date.now(),
    });

    await notifyUser(ctx, {
      recipientUserId: user._id,
      type: "withdrawal",
      title: "Withdrawal requested",
      message: `Your ${formatKes(args.amount)} withdrawal request is pending admin review.`,
      href: "/withdraw",
      dedupeKey: `withdrawal-request:user:${requestId}`,
      metadata: {
        withdrawalId: requestId,
        amount: args.amount,
      },
    });

    await notifyAdmins(ctx, {
      type: "withdrawal",
      title: "New withdrawal request",
      message: `${user.phone} requested a ${formatKes(args.amount)} withdrawal.`,
      href: "/admin/withdrawals",
      dedupeKey: `withdrawal-request:${requestId}`,
      metadata: {
        withdrawalId: requestId,
        amount: args.amount,
      },
    });

    return { success: true, requestId };
  },
});

/**
 * User pays KES 150 for instant processing.
 * Marks the request as instant and stores the Paystack reference.
 */
export const payInstantFee = mutation({
  args: {
    userId: v.optional(v.id("users")),
    requestId: v.id("withdrawal_requests"),
    instantFeeTxReference: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.userId);

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Withdrawal request not found");
    }

    if (request.userId !== user._id) {
      throw new Error("Cannot modify another user's withdrawal request");
    }

    if (request.status !== "pending") {
      throw new Error("Withdrawal request is no longer pending");
    }

    await ctx.db.patch(args.requestId, {
      isInstant: true,
      instantFeeTxReference: args.instantFeeTxReference,
    });

    await notifyAdmins(ctx, {
      type: "withdrawal",
      title: "Instant withdrawal requested",
      message: `${user.phone} paid for instant processing on a ${formatKes(request.amount)} withdrawal.`,
      href: "/admin/withdrawals",
      dedupeKey: `withdrawal-instant:${args.requestId}`,
      metadata: {
        withdrawalId: args.requestId,
        amount: request.amount,
      },
    });

    return { success: true };
  },
});

/**
 * Admin approves a withdrawal request.
 */
export const approveWithdrawal = mutation({
  args: {
    userId: v.optional(v.id("users")),
    requestId: v.id("withdrawal_requests"),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.userId);

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Withdrawal request not found");
    }

    if (request.status !== "pending") {
      throw new Error(`Request is already ${request.status}`);
    }

    await ctx.db.patch(args.requestId, {
      status: "approved",
      processedAt: Date.now(),
      processedBy: admin.phone ?? admin._id.toString(),
    });

    await notifyUser(ctx, {
      recipientUserId: request.userId,
      type: "withdrawal",
      title: "Withdrawal approved",
      message: `Your ${formatKes(request.amount)} withdrawal request was approved.`,
      href: "/withdraw",
      dedupeKey: `withdrawal-approved:user:${args.requestId}`,
      metadata: {
        withdrawalId: args.requestId,
        amount: request.amount,
      },
    });

    await notifyAdmins(ctx, {
      type: "withdrawal",
      title: "Withdrawal approved",
      message: `${formatKes(request.amount)} withdrawal was approved by ${admin.phone ?? "an admin"}.`,
      href: "/admin/withdrawals",
      dedupeKey: `withdrawal-approved:${args.requestId}`,
      metadata: {
        withdrawalId: args.requestId,
        amount: request.amount,
      },
    });

    return { success: true };
  },
});

/**
 * Admin rejects a withdrawal request.
 * The reserved wallet balance is restored to the user.
 */
export const rejectWithdrawal = mutation({
  args: {
    userId: v.optional(v.id("users")),
    requestId: v.id("withdrawal_requests"),
    rejectionReason: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.userId);

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Withdrawal request not found");
    }

    if (request.status !== "pending") {
      throw new Error(`Request is already ${request.status}`);
    }

    // Restore the wallet balance (the amount was deducted on submit)
    await updateWalletBalance(ctx, request.userId, request.amount, "add");

    await ctx.db.patch(args.requestId, {
      status: "rejected",
      processedAt: Date.now(),
      processedBy: admin.phone ?? admin._id.toString(),
      rejectionReason: args.rejectionReason,
    });

    await notifyUser(ctx, {
      recipientUserId: request.userId,
      type: "withdrawal",
      title: "Withdrawal rejected",
      message: `Your ${formatKes(request.amount)} withdrawal request was rejected. ${args.rejectionReason}`,
      href: "/withdraw",
      dedupeKey: `withdrawal-rejected:user:${args.requestId}`,
      metadata: {
        withdrawalId: args.requestId,
        amount: request.amount,
      },
    });

    await notifyAdmins(ctx, {
      type: "withdrawal",
      title: "Withdrawal rejected",
      message: `${formatKes(request.amount)} withdrawal was rejected by ${admin.phone ?? "an admin"}.`,
      href: "/admin/withdrawals",
      dedupeKey: `withdrawal-rejected:${args.requestId}`,
      metadata: {
        withdrawalId: args.requestId,
        amount: request.amount,
      },
    });

    return { success: true };
  },
});
