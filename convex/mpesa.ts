import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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
    // Validate amount
    if (args.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (args.amount > 150000) {
      throw new Error("Amount exceeds maximum limit of KES 150,000");
    }

    // Create transaction record
    const txId = await ctx.db.insert("transactions", {
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
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_checkoutRequestID", (q) =>
        q.eq("checkoutRequestID", args.checkoutRequestID)
      )
      .unique();

    if (!transaction) {
      console.error(`Transaction not found: ${args.checkoutRequestID}`);
      throw new Error(`Transaction not found: ${args.checkoutRequestID}`);
    }

    const status =
      args.resultCode === "0"
        ? "success"
        : args.resultCode === "1032" || args.resultCode === "1" || args.resultCode === "2"
          ? "cancelled"
          : "failed";

    // Determine the feedback message and status based on result code
    // This is the single source of truth for feedback
    const getFeedback = (code: string) => {
      const feedbackMap: Record<string, { message: string; type: "success" | "error" | "warning" }> = {
        "0": { message: "Transaction completed successfully", type: "success" },
        "1": { message: "Transaction cancelled by user", type: "warning" },
        "2": { message: "Request timeout. No response from customer.", type: "warning" },
        "1001": { message: "Unable to lock subscriber record", type: "error" },
        "1002": { message: "Invalid Account Number", type: "error" },
        "1003": { message: "Funds insufficient for transaction", type: "error" },
        "1004": { message: "Transaction exceeds daily limit", type: "error" },
        "1005": { message: "One or more parameters invalid", type: "error" },
        "1006": { message: "Transaction ID already exists", type: "error" },
        "1007": { message: "Connect timeout with payment gateway", type: "error" },
        "1008": { message: "Message delivery failed", type: "error" },
        "1009": { message: "Invalid shortcode", type: "error" },
        "1010": { message: "Invalid initiator", type: "error" },
        "1011": { message: "Invalid credentials", type: "error" },
        "1012": { message: "Invalid amount", type: "error" },
        "1013": { message: "Subscriber not found", type: "error" },
        "1014": { message: "Transaction query timeout", type: "error" },
        "1015": { message: "Queue timeout", type: "error" },
        "1016": { message: "Reversal timeout", type: "error" },
        "1017": { message: "Message undeliverable", type: "error" },
        "1018": { message: "Account restricted", type: "error" },
        "1019": { message: "Transaction failed", type: "error" },
        "1020": { message: "OTP validate not successful", type: "error" },
        "1021": { message: "Invalid format", type: "error" },
        "1032": { message: "Request cancelled by user", type: "warning" },
        "1033": { message: "System malfunction", type: "error" },
        "1034": { message: "Request timeout", type: "error" },
        "1035": { message: "Invalid encryption", type: "error" },
        "1036": { message: "Invalid command type", type: "error" },
        "1037": { message: "Invalid transaction ID", type: "error" },
        "1038": { message: "Invalid session", type: "error" },
        "1039": { message: "Invalid account", type: "error" },
        "1040": { message: "Transaction processing failed", type: "error" },
        "1041": { message: "Network timeout", type: "error" },
        "1042": { message: "Insufficient credit", type: "error" },
        "1043": { message: "User account suspended", type: "error" },
        "1044": { message: "Duplicate transaction", type: "error" },
      };
      return feedbackMap[code] || { message: `Transaction error: ${code}`, type: "error" };
    };

    const feedback = getFeedback(args.resultCode);

    // Update transaction record with M-Pesa response
    await ctx.db.patch(transaction._id, {
      status,
      resultCode: args.resultCode,
      resultDesc: args.resultDesc,
      mpesaReceiptNumber: args.mpesaReceiptNumber || undefined,
      feedback: feedback.message,
      feedbackType: feedback.type,
      updatedAt: Date.now(),
    });

    console.log(`[Transaction] Updated ${transaction._id}: status=${status}, code=${args.resultCode}, feedback="${feedback.message}"`);

    // If successful, update wallet balance
    if (status === "success" && args.amount) {
      await updateWalletBalance(ctx, args.amount, "add");
      console.log(`[Wallet] Credited with KES ${args.amount}`);
    }

    return {
      transactionId: transaction._id,
      status,
      amount: transaction.amount,
      feedback: feedback.message,
      feedbackType: feedback.type,
    };
  },
});

/**
 * Get user's wallet
 */
export const getWallet = query({
  args: {},
  handler: async (ctx) => {
    const wallet = await ctx.db
      .query("wallets")
      .unique();

    if (!wallet) {
      // Return default wallet structure
      return {
        _id: null as any,
        balance: 0,
      };
    }

    return wallet;
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
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_checkoutRequestID", (q) =>
        q.eq("checkoutRequestID", args.checkoutRequestID)
      )
      .unique();

    if (!transaction) {
      return null;
    }

    return {
      _id: transaction._id,
      status: transaction.status,
      resultCode: transaction.resultCode,
      resultDesc: transaction.resultDesc,
      mpesaReceiptNumber: transaction.mpesaReceiptNumber,
      amount: transaction.amount,
      type: transaction.type,
      time: transaction.time,
      updatedAt: transaction.updatedAt,
      feedback: transaction.feedback,
      feedbackType: transaction.feedbackType,
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
    const limit = args.limit ?? 20;

    const transactions = await ctx.db
      .query("transactions")
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
    const transaction = await ctx.db.get(args.transactionId);

    if (!transaction) {
      throw new Error("Transaction not found");
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
  amount: number,
  operation: "add" | "subtract"
): Promise<void> {
  const wallet = await ctx.db
    .query("wallets")
    .unique();

  if (!wallet) {
    // Create wallet if doesn't exist
    await ctx.db.insert("wallets", {
      balance: operation === "add" ? amount : 0,
    });
    return;
  }

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
    if (args.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const wallet = await ctx.db
      .query("wallets")
      .unique();

    if (!wallet) {
      throw new Error("Wallet not found");
    }

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
