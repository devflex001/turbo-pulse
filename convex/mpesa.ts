/**
 * M-Pesa Transaction Management in Convex
 * Handles transaction creation, status updates, and wallet operations
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx } from "./_generated/server";

/**
 * Create a new transaction record (pending)
 */
export const createTransaction = mutation({
  args: {
    type: v.union(v.literal("deposit"), v.literal("withdrawal")),
    amount: v.number(),
    phone: v.string(),
    checkoutRequestID: v.string(),
    merchantRequestID: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate amount
    if (args.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (args.amount > 150000) {
      throw new Error("Amount exceeds maximum limit of KES 150,000");
    }

    // Create transaction record
    const txId = await ctx.db.insert("transactions", {
      userId,
      txId: `${args.type.toUpperCase()}-${args.checkoutRequestID}`,
      type: args.type,
      amount: args.amount,
      phone: args.phone,
      status: "pending",
      checkoutRequestID: args.checkoutRequestID,
      merchantRequestID: args.merchantRequestID,
      time: Date.now(),
    });

    return {
      transactionId: txId,
      checkoutRequestID: args.checkoutRequestID,
      merchantRequestID: args.merchantRequestID,
    };
  },
});

/**
 * Update transaction status after callback from M-Pesa
 * This is called from the HTTP callback endpoint
 */
export const updateTransactionStatus = mutation({
  args: {
    checkoutRequestID: v.string(),
    resultCode: v.string(),
    resultDesc: v.string(),
    mpesaReceiptNumber: v.optional(v.string()),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find transaction by checkoutRequestID
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_checkoutRequestID", (q) =>
        q.eq("checkoutRequestID", args.checkoutRequestID)
      )
      .take(1);

    if (transactions.length === 0) {
      console.error(`Transaction not found: ${args.checkoutRequestID}`);
      throw new Error(`Transaction not found: ${args.checkoutRequestID}`);
    }

    const transaction = transactions[0];
    const status =
      args.resultCode === "0"
        ? "success"
        : args.resultCode === "1032"
          ? "pending"
          : "failed";

    // Update transaction record with M-Pesa response
    await ctx.db.patch(transaction._id, {
      status,
      resultCode: args.resultCode,
      resultDesc: args.resultDesc,
      mpesaReceiptNumber: args.mpesaReceiptNumber || undefined,
      updatedAt: Date.now(),
    });

    console.log(`[Transaction] Updated ${transaction._id}: status=${status}, code=${args.resultCode}`);

    // If successful, update wallet balance
    if (status === "success" && args.amount) {
      await updateWalletBalance(ctx, transaction.userId, args.amount, "add");
      console.log(`[Wallet] Credited ${transaction.userId} with KES ${args.amount}`);
    }

    return {
      transactionId: transaction._id,
      status,
      amount: transaction.amount,
    };
  },
});

/**
 * Get user's wallet
 */
export const getWallet = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(1);

    if (wallets.length === 0) {
      // Return default wallet (creation is deferred)
      return {
        _id: null as any,
        userId,
        balance: 0,
      };
    }

    return wallets[0];
  },
});

/**
 * Get latest transaction for real-time status updates
 */
export const getLatestTransaction = query({
  args: {
    checkoutRequestID: v.string(),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_checkoutRequestID", (q) =>
        q.eq("checkoutRequestID", args.checkoutRequestID)
      )
      .take(1);

    if (transactions.length === 0) {
      return null;
    }

    const tx = transactions[0];
    return {
      _id: tx._id,
      status: tx.status,
      resultCode: tx.resultCode,
      resultDesc: tx.resultDesc,
      mpesaReceiptNumber: tx.mpesaReceiptNumber,
      amount: tx.amount,
      type: tx.type,
      time: tx.time,
      updatedAt: tx.updatedAt,
    };
  },
});

/**
 * Get user's transaction history
 */
export const getTransactionHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const limit = args.limit ?? 20;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return {
      items: transactions,
      total: transactions.length,
    };
  },
});

/**
 * Get transaction by ID
 */
export const getTransaction = query({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const transaction = await ctx.db.get(args.transactionId);

    if (!transaction || transaction.userId !== userId) {
      throw new Error("Transaction not found or not authorized");
    }

    return transaction;
  },
});

/**
 * Internal function to update wallet balance
 * Can be used by other mutations
 */
export async function updateWalletBalance(
  ctx: MutationCtx,
  userId: any,
  amount: number,
  operation: "add" | "subtract"
): Promise<void> {
  const wallets = await ctx.db
    .query("wallets")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(1);

  if (wallets.length === 0) {
    // Create wallet if doesn't exist
    await ctx.db.insert("wallets", {
      userId,
      balance: operation === "add" ? amount : 0,
    });
    return;
  }

  const wallet = wallets[0];

  const newBalance =
    operation === "add"
      ? wallet.balance + amount
      : Math.max(0, wallet.balance - amount);

  await ctx.db.patch(wallet._id, {
    balance: newBalance,
  });
}

/**
 * Withdraw from wallet (for bets placed)
 */
export const withdrawFromWallet = mutation({
  args: {
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (args.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(1);

    if (wallets.length === 0) {
      throw new Error("Wallet not found");
    }

    const wallet = wallets[0];

    if (wallet.balance < args.amount) {
      throw new Error("Insufficient balance");
    }

    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - args.amount,
    });

    return {
      newBalance: wallet.balance - args.amount,
    };
  },
});
