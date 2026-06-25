import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { notifyAdmins, notifyUser } from "./notifications";

function formatKes(amount: number) {
  return `KES ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getBetLabel(selections: { matchName: string }[]) {
  if (selections.length === 1) {
    return selections[0]?.matchName ?? "your selection";
  }

  return `${selections.length} selections`;
}

export const getWalletBalance = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get wallet for this specific user
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    return wallet ? wallet.balance : 0;
  },
});

export const getMyBets = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const bets = await ctx.db
      .query("bets")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(100);

    return bets.map((b) => ({
      ...b,
      id: b._id,
      placedAt: b.placedAt,
      time:
        new Date(b.placedAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }) +
        ", " +
        new Date(b.placedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
    }));
  },
});

export const getTransactions = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(100);

    return txs.map((t) => ({
      ...t,
      id: t.txId,
      time:
        new Date(t.time).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }) +
        ", " +
        new Date(t.time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
    }));
  },
});

export const placeBet = mutation({
  args: {
    userId: v.id("users"),
    selections: v.array(
      v.object({
        id: v.string(),
        matchId: v.string(),
        matchName: v.string(),
        team1: v.string(),
        team2: v.string(),
        market: v.string(),
        selection: v.string(),
        selectionName: v.string(),
        odds: v.number(),
        sourceOddId: v.optional(v.string()),
        marketKey: v.optional(v.string()),
        marketName: v.optional(v.string()),
        outcomeName: v.optional(v.string()),
        specifiers: v.optional(v.string()),
        matchStartTime: v.optional(v.number()),
      })
    ),
    totalOdds: v.number(),
    stake: v.number(),
    potentialReturn: v.number(),
  },
  handler: async (ctx, args) => {
    let wallet = await ctx.db
      .query("wallets")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    const balance = wallet ? wallet.balance : 0;
    if (args.stake > balance) throw new Error("Insufficient balance");

    if (wallet) {
      await ctx.db.patch(wallet._id, { balance: balance - args.stake });
    } else {
      await ctx.db.insert("wallets", { userId: args.userId, balance: 0 - args.stake });
    }

    const betId = await ctx.db.insert("bets", {
      userId: args.userId,
      selections: args.selections,
      totalOdds: args.totalOdds,
      stake: args.stake,
      potentialReturn: args.potentialReturn,
      status: "active",
      placedAt: Date.now(),
    });

    const betLabel = getBetLabel(args.selections);
    if (args.userId) {
      await notifyUser(ctx, {
        recipientUserId: args.userId,
        type: "bet",
        title: "Bet placed",
        message: `Your ${formatKes(args.stake)} bet on ${betLabel} was placed successfully.`,
        href: "/my-bets",
        dedupeKey: `bet-placed:user:${betId}`,
        metadata: {
          betId,
          amount: args.stake,
        },
      });
    }

    await notifyAdmins(ctx, {
      type: "bet",
      title: "New bet placed",
      message: `A ${formatKes(args.stake)} bet was placed on ${betLabel}.`,
      href: "/admin/bets",
      dedupeKey: `bet-placed:${betId}`,
      metadata: {
        betId,
        amount: args.stake,
      },
    });

    return { success: true, betId };
  },
});

export const createTransaction = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("deposit"), v.literal("withdrawal")),
    amount: v.number(),
    phone: v.optional(v.string()),
    status: v.union(
      v.literal("success"),
      v.literal("pending"),
      v.literal("failed")
    ),
    errorDetail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const txId =
      "TX-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const transactionId = await ctx.db.insert("transactions", {
      txId,
      userId: args.userId,
      type: args.type,
      amount: args.amount,
      phone: args.phone,
      status: args.status,
      errorDetail: args.errorDetail,
      time: Date.now(),
    });

    if (args.status === "success") {
      let wallet = await ctx.db
        .query("wallets")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .unique();
      const currentBalance = wallet ? wallet.balance : 0;
      const change = args.type === "deposit" ? args.amount : -args.amount;

      if (wallet) {
        await ctx.db.patch(wallet._id, { balance: currentBalance + change });
      } else {
        await ctx.db.insert("wallets", { userId: args.userId, balance: 0 + change });
      }

      if (args.type === "deposit") {
        await notifyUser(ctx, {
          recipientUserId: args.userId,
          type: "payment",
          title: "Deposit successful",
          message: `${formatKes(args.amount)} has been added to your wallet.`,
          href: "/account",
          dedupeKey: `transaction-success:user:${transactionId}`,
          metadata: {
            transactionId,
            amount: args.amount,
          },
        });
      }

      if (args.type === "deposit") {
        await notifyAdmins(ctx, {
          type: "payment",
          title: "New deposit",
          message: `A ${formatKes(args.amount)} deposit was completed.`,
          href: "/admin/payments",
          dedupeKey: `transaction-success:${transactionId}`,
          metadata: {
            transactionId,
            amount: args.amount,
          },
        });
      }
    }

    return { txId };
  },
});

export const updateTransactionStatus = mutation({
  args: {
    txId: v.string(),
    status: v.union(
      v.literal("success"),
      v.literal("pending"),
      v.literal("failed")
    ),
    errorDetail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_txId", (q) => q.eq("txId", args.txId))
      .unique();
    if (!transaction) throw new Error("Transaction not found");

    if (transaction.status === args.status) return { success: true };

    const oldStatus = transaction.status;
    await ctx.db.patch(transaction._id, {
      status: args.status,
      errorDetail: args.errorDetail,
    });

    if (args.status === "success" && oldStatus !== "success" && transaction.userId) {
      const userId = transaction.userId as Id<"users">;
      let wallet = await ctx.db
        .query("wallets")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();
      const currentBalance = wallet ? wallet.balance : 0;
      const change =
        transaction.type === "deposit"
          ? transaction.amount
          : -transaction.amount;

      if (wallet) {
        await ctx.db.patch(wallet._id, { balance: currentBalance + change });
      } else {
        await ctx.db.insert("wallets", {
          userId: userId,
          balance: 0 + change,
        });
      }

      if (transaction.type === "deposit") {
        await notifyUser(ctx, {
          recipientUserId: userId,
          type: "payment",
          title: "Deposit successful",
          message: `${formatKes(transaction.amount)} has been added to your wallet.`,
          href: "/account",
          dedupeKey: `transaction-success:user:${transaction._id}`,
          metadata: {
            transactionId: transaction._id,
            amount: transaction.amount,
          },
        });
      }

      if (transaction.type === "deposit") {
        await notifyAdmins(ctx, {
          type: "payment",
          title: "New deposit",
          message: `A ${formatKes(transaction.amount)} deposit was completed.`,
          href: "/admin/payments",
          dedupeKey: `transaction-success:${transaction._id}`,
          metadata: {
            transactionId: transaction._id,
            amount: transaction.amount,
          },
        });
      }
    } else if (args.status !== "success" && oldStatus === "success" && transaction.userId) {
      const userId = transaction.userId as Id<"users">;
      let wallet = await ctx.db
        .query("wallets")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();
      if (wallet) {
        const change =
          transaction.type === "deposit"
            ? -transaction.amount
            : transaction.amount;
        await ctx.db.patch(wallet._id, { balance: wallet.balance + change });
      }
    }

    return { success: true };
  },
});

export const settleSingleBet = mutation({
  args: {
    betId: v.id("bets"),
    status: v.union(v.literal("won"), v.literal("lost")),
  },
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    if (!bet) throw new Error("Bet not found");
    if (bet.status !== "active") return { success: true };

    await ctx.db.patch(args.betId, { status: args.status });

    if (args.status === "won" && bet.userId) {
      const userId = bet.userId as Id<"users">;
      let wallet = await ctx.db
        .query("wallets")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();
      const currentBalance = wallet ? wallet.balance : 0;
      if (wallet) {
        await ctx.db.patch(wallet._id, {
          balance: currentBalance + bet.potentialReturn,
        });
      } else {
        await ctx.db.insert("wallets", {
          userId: userId,
          balance: 0 + bet.potentialReturn,
        });
      }
    }

    if (bet.userId) {
      const recipientUserId = bet.userId as Id<"users">;
      await notifyUser(ctx, {
        recipientUserId,
        type: "bet",
        title: args.status === "won" ? "Bet won" : "Bet lost",
        message:
          args.status === "won"
            ? `Your bet on ${getBetLabel(bet.selections)} won. ${formatKes(bet.potentialReturn)} has been credited.`
            : `Your bet on ${getBetLabel(bet.selections)} did not win.`,
        href: "/my-bets",
        dedupeKey: `bet-settled:user:${args.betId}:${args.status}`,
        metadata: {
          betId: args.betId,
          amount: args.status === "won" ? bet.potentialReturn : bet.stake,
        },
      });
    }

    await notifyAdmins(ctx, {
      type: "bet",
      title: args.status === "won" ? "Bet settled as won" : "Bet settled as lost",
      message: `A bet on ${getBetLabel(bet.selections)} was settled as ${args.status}.`,
      href: "/admin/bets",
      dedupeKey: `bet-settled:${args.betId}:${args.status}`,
      metadata: {
        betId: args.betId,
        amount: args.status === "won" ? bet.potentialReturn : bet.stake,
      },
    });
    return { success: true };
  },
});

const CANCEL_WINDOW_MS = 5 * 60 * 1000;

export const cancelBet = mutation({
  args: {
    betId: v.id("bets"),
  },
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    if (!bet) throw new Error("Bet not found");
    if (bet.status !== "active") throw new Error("Bet is not active");

    const startTimes = bet.selections
      .map((selection) => selection.matchStartTime)
      .filter((time): time is number => typeof time === "number" && time > 0);

    if (startTimes.length === 0) {
      throw new Error("Match start times unavailable for cancellation");
    }

    const cancelDeadline = Math.min(...startTimes) - CANCEL_WINDOW_MS;
    if (Date.now() >= cancelDeadline) {
      throw new Error("Cancellation window has closed");
    }

    await ctx.db.patch(args.betId, { status: "cancelled" });

    if (bet.userId) {
      const userId = bet.userId as Id<"users">;
      let wallet = await ctx.db
        .query("wallets")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();
      const currentBalance = wallet ? wallet.balance : 0;

      if (wallet) {
        await ctx.db.patch(wallet._id, { balance: currentBalance + bet.stake });
      } else {
        await ctx.db.insert("wallets", { userId: userId, balance: 0 + bet.stake });
      }

      await notifyUser(ctx, {
        recipientUserId: userId,
        type: "bet",
        title: "Bet cancelled",
        message: `Your bet on ${getBetLabel(bet.selections)} was cancelled and ${formatKes(bet.stake)} was returned.`,
        href: "/my-bets",
        dedupeKey: `bet-cancelled:user:${args.betId}`,
        metadata: {
          betId: args.betId,
          amount: bet.stake,
        },
      });
    }

    await notifyAdmins(ctx, {
      type: "bet",
      title: "Bet cancelled",
      message: `A ${formatKes(bet.stake)} bet on ${getBetLabel(bet.selections)} was cancelled.`,
      href: "/admin/bets",
      dedupeKey: `bet-cancelled:${args.betId}`,
      metadata: {
        betId: args.betId,
        amount: bet.stake,
      },
    });

    return { success: true };
  },
});

export const settleAllBets = mutation({
  args: {},
  handler: async (ctx) => {
    const bets = await ctx.db
      .query("bets")
      .collect();

    const activeBets = bets.filter((b) => b.status === "active");

    for (const bet of activeBets) {
      const won = Math.random() > 0.4;
      const status = won ? "won" : "lost";
      await ctx.db.patch(bet._id, { status });

      if (won && bet.userId) {
        const userId = bet.userId as Id<"users">;
        let wallet = await ctx.db
          .query("wallets")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique();
        const currentBalance = wallet ? wallet.balance : 0;
        if (wallet) {
          await ctx.db.patch(wallet._id, {
            balance: currentBalance + bet.potentialReturn,
          });
        } else {
          await ctx.db.insert("wallets", {
            userId: userId,
            balance: 0 + bet.potentialReturn,
          });
        }
      }

      if (bet.userId) {
        await notifyUser(ctx, {
          recipientUserId: bet.userId as Id<"users">,
          type: "bet",
          title: won ? "Bet won" : "Bet lost",
          message: won
            ? `Your bet on ${getBetLabel(bet.selections)} won. ${formatKes(bet.potentialReturn)} has been credited.`
            : `Your bet on ${getBetLabel(bet.selections)} did not win.`,
          href: "/my-bets",
          dedupeKey: `bet-settled:user:${bet._id}:${status}`,
          metadata: {
            betId: bet._id,
            amount: won ? bet.potentialReturn : bet.stake,
          },
        });
      }

      await notifyAdmins(ctx, {
        type: "bet",
        title: won ? "Bet settled as won" : "Bet settled as lost",
        message: `A bet on ${getBetLabel(bet.selections)} was settled as ${status}.`,
        href: "/admin/bets",
        dedupeKey: `bet-settled:${bet._id}:${status}`,
        metadata: {
          betId: bet._id,
          amount: won ? bet.potentialReturn : bet.stake,
        },
      });
    }

    return { success: true };
  },
});

// ─── Admin Analytics Queries ───────────────────────────────────────────────

export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    // Total users
    const allUsers = await ctx.db
      .query("users")
      .collect();
    const totalUsers = allUsers.length;

    // Total successful deposits
    const allTransactions = await ctx.db
      .query("transactions")
      .collect();
    const totalDeposits = allTransactions
      .filter((t) => t.type === "deposit" && t.status === "success")
      .reduce((sum, t) => sum + t.amount, 0);

    // Active bets
    const allBets = await ctx.db
      .query("bets")
      .collect();
    const activeBets = allBets.filter((b) => b.status === "active").length;

    return {
      totalUsers,
      totalDeposits,
      activeBets,
    };
  },
});

export const getDepositTrend = query({
  args: {
    daysBack: v.optional(v.number()), // defaults to 7 days
  },
  handler: async (ctx, args) => {
    const daysBack = args.daysBack ?? 7;
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const millisPerDay = 24 * 60 * 60 * 1000;

    // Get all deposits in the range
    const allTransactions = await ctx.db
      .query("transactions")
      .collect();

    const depositsByDay: Record<string, number> = {};

    // Initialize days
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(startOfToday.getTime() - i * millisPerDay);
      const dayKey = date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        weekday: "short",
      });
      depositsByDay[dayKey] = 0;
    }

    // Accumulate deposits
    allTransactions.forEach((tx) => {
      if (tx.type === "deposit" && tx.status === "success") {
        const txDate = new Date(tx.time);
        const txStartOfDay = new Date(txDate);
        txStartOfDay.setHours(0, 0, 0, 0);
        const daysAgo = Math.floor(
          (startOfToday.getTime() - txStartOfDay.getTime()) / millisPerDay
        );

        if (daysAgo >= 0 && daysAgo < daysBack) {
          const dayKey = txDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            weekday: "short",
          });
          depositsByDay[dayKey] += tx.amount;
        }
      }
    });

    return Object.entries(depositsByDay).map(([day, amount]) => ({
      day,
      amount,
    }));
  },
});

export const getUserRegistrationTrend = query({
  args: {
    daysBack: v.optional(v.number()), // defaults to 7 days
  },
  handler: async (ctx, args) => {
    const daysBack = args.daysBack ?? 7;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const millisPerDay = 24 * 60 * 60 * 1000;

    // Get all users
    const allUsers = await ctx.db
      .query("users")
      .collect();

    const usersByDay: Record<string, number> = {};

    // Initialize days
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(startOfToday.getTime() - i * millisPerDay);
      const dayKey = date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      usersByDay[dayKey] = 0;
    }

    // Count users by registration date
    allUsers.forEach((user) => {
      const userDate = new Date(user.createdAt);
      const userStartOfDay = new Date(userDate);
      userStartOfDay.setHours(0, 0, 0, 0);
      const daysAgo = Math.floor(
        (startOfToday.getTime() - userStartOfDay.getTime()) / millisPerDay
      );

      if (daysAgo >= 0 && daysAgo < daysBack) {
        const dayKey = userDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        });
        usersByDay[dayKey] += 1;
      }
    });

    return Object.entries(usersByDay).map(([day, count]) => ({
      day,
      count,
    }));
  },
});
