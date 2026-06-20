import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getWalletBalance = query({
  args: {},
  handler: async (ctx) => {
    const wallet = await ctx.db
      .query("wallets")
      .first();
    return wallet ? wallet.balance : 1000;
  },
});

export const getMyBets = query({
  args: {},
  handler: async (ctx) => {
    const bets = await ctx.db
      .query("bets")
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
  args: {},
  handler: async (ctx) => {
    const txs = await ctx.db
      .query("transactions")
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
      .first();

    const balance = wallet ? wallet.balance : 1000;
    if (args.stake > balance) throw new Error("Insufficient balance");

    if (wallet) {
      await ctx.db.patch(wallet._id, { balance: balance - args.stake });
    } else {
      await ctx.db.insert("wallets", { balance: 1000 - args.stake });
    }

    const betId = await ctx.db.insert("bets", {
      selections: args.selections,
      totalOdds: args.totalOdds,
      stake: args.stake,
      potentialReturn: args.potentialReturn,
      status: "active",
      placedAt: Date.now(),
    });

    return { success: true, betId };
  },
});

export const createTransaction = mutation({
  args: {
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

    await ctx.db.insert("transactions", {
      txId,
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
        .first();
      const currentBalance = wallet ? wallet.balance : 1000;
      const change = args.type === "deposit" ? args.amount : -args.amount;

      if (wallet) {
        await ctx.db.patch(wallet._id, { balance: currentBalance + change });
      } else {
        await ctx.db.insert("wallets", { balance: 1000 + change });
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

    if (args.status === "success" && oldStatus !== "success") {
      let wallet = await ctx.db
        .query("wallets")
        .first();
      const currentBalance = wallet ? wallet.balance : 1000;
      const change =
        transaction.type === "deposit"
          ? transaction.amount
          : -transaction.amount;

      if (wallet) {
        await ctx.db.patch(wallet._id, { balance: currentBalance + change });
      } else {
        await ctx.db.insert("wallets", {
          balance: 1000 + change,
        });
      }
    } else if (args.status !== "success" && oldStatus === "success") {
      let wallet = await ctx.db
        .query("wallets")
        .first();
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

    if (args.status === "won") {
      let wallet = await ctx.db
        .query("wallets")
        .first();
      const currentBalance = wallet ? wallet.balance : 1000;
      if (wallet) {
        await ctx.db.patch(wallet._id, {
          balance: currentBalance + bet.potentialReturn,
        });
      } else {
        await ctx.db.insert("wallets", {
          balance: 1000 + bet.potentialReturn,
        });
      }
    }
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

    let wallet = await ctx.db
      .query("wallets")
      .first();
    const currentBalance = wallet ? wallet.balance : 1000;

    if (wallet) {
      await ctx.db.patch(wallet._id, { balance: currentBalance + bet.stake });
    } else {
      await ctx.db.insert("wallets", { balance: 1000 + bet.stake });
    }

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

      if (won) {
        let wallet = await ctx.db
          .query("wallets")
          .first();
        const currentBalance = wallet ? wallet.balance : 1000;
        if (wallet) {
          await ctx.db.patch(wallet._id, {
            balance: currentBalance + bet.potentialReturn,
          });
        } else {
          await ctx.db.insert("wallets", {
            balance: 1000 + bet.potentialReturn,
          });
        }
      }
    }

    return { success: true };
  },
});
