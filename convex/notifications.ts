import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAdmin, requireAuth } from "./auth/authorization";

const notificationTypeValidator = v.union(
  v.literal("payment"),
  v.literal("bet"),
  v.literal("match"),
  v.literal("withdrawal"),
  v.literal("system")
);

type NotificationType = "payment" | "bet" | "match" | "withdrawal" | "system";

type NotificationMetadata = {
  betId?: Id<"bets">;
  transactionId?: Id<"transactions">;
  withdrawalId?: Id<"withdrawal_requests">;
  sourceMatchId?: string;
  amount?: number;
};

type CreateNotificationArgs = {
  recipientUserId: Id<"users">;
  recipientRole: "user" | "admin";
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  dedupeKey?: string;
  metadata?: NotificationMetadata;
};

export async function createNotification(
  ctx: MutationCtx,
  args: CreateNotificationArgs
) {
  if (args.dedupeKey) {
    const existing = await ctx.db
      .query("notifications")
      .withIndex("by_dedupeKey", (q) => q.eq("dedupeKey", args.dedupeKey))
      .first();

    if (existing) {
      return existing._id;
    }
  }

  return await ctx.db.insert("notifications", {
    recipientUserId: args.recipientUserId,
    recipientRole: args.recipientRole,
    type: args.type,
    title: args.title,
    message: args.message,
    href: args.href,
    readAt: null,
    createdAt: Date.now(),
    dedupeKey: args.dedupeKey,
    metadata: args.metadata,
  });
}

export async function notifyUser(
  ctx: MutationCtx,
  args: Omit<CreateNotificationArgs, "recipientRole">
) {
  return await createNotification(ctx, {
    ...args,
    recipientRole: "user",
  });
}

export async function notifyAdmins(
  ctx: MutationCtx,
  args: Omit<CreateNotificationArgs, "recipientUserId" | "recipientRole">
) {
  const admins = await ctx.db
    .query("users")
    .withIndex("by_role", (q) => q.eq("role", "admin"))
    .take(100);

  for (const admin of admins) {
    await createNotification(ctx, {
      ...args,
      recipientUserId: admin._id,
      recipientRole: "admin",
      dedupeKey: args.dedupeKey
        ? `${args.dedupeKey}:admin:${admin._id}`
        : undefined,
    });
  }
}

export const listMine = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.userId);

    const limit = Math.min(args.limit ?? 30, 50);
    return await ctx.db
      .query("notifications")
      .withIndex("by_recipientUserId_and_createdAt", (q) =>
        q.eq("recipientUserId", args.userId)
      )
      .order("desc")
      .take(limit);
  },
});

export const getUnreadCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.userId);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipientUserId_and_readAt", (q) =>
        q.eq("recipientUserId", args.userId).eq("readAt", null)
      )
      .take(100);

    return unread.length;
  },
});

export const markRead = mutation({
  args: {
    userId: v.id("users"),
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.userId);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification || notification.recipientUserId !== user._id) {
      throw new Error("Notification not found");
    }

    if (notification.readAt === null) {
      await ctx.db.patch(args.notificationId, { readAt: Date.now() });
    }

    return { success: true };
  },
});

export const markAllRead = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.userId);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipientUserId_and_readAt", (q) =>
        q.eq("recipientUserId", args.userId).eq("readAt", null)
      )
      .take(100);

    const readAt = Date.now();
    for (const notification of unread) {
      await ctx.db.patch(notification._id, { readAt });
    }

    return { success: true, count: unread.length };
  },
});

export const remove = mutation({
  args: {
    userId: v.id("users"),
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.userId);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification || notification.recipientUserId !== user._id) {
      throw new Error("Notification not found");
    }

    await ctx.db.delete(args.notificationId);
    return { success: true };
  },
});

export const createAdminSystemNotification = mutation({
  args: {
    adminUserId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.optional(notificationTypeValidator),
    href: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminUserId);

    await notifyAdmins(ctx, {
      type: args.type ?? "system",
      title: args.title,
      message: args.message,
      href: args.href,
    });

    return { success: true };
  },
});

export const notifyCustomEventStarted = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("customEvents"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.userId);
    const event = await ctx.db.get(args.eventId);
    if (!event || event.status !== "published") {
      return { success: true, created: 0 };
    }

    const now = Date.now();
    if (event.startTime > now) {
      return { success: true, created: 0 };
    }

    const activeBets = await ctx.db
      .query("bets")
      .withIndex("by_userId", (q) => q.eq("userId", user._id.toString()))
      .take(100);

    let created = 0;

    for (const bet of activeBets) {
      if (bet.status !== "active") {
        continue;
      }

      const matchingSelection = bet.selections.find(
        (selection) => selection.matchId === args.eventId
      );

      if (!matchingSelection) {
        continue;
      }

      const id = await notifyUser(ctx, {
        recipientUserId: user._id,
        type: "match",
        title: "Match started",
        message: `${event.homeTeam} vs ${event.awayTeam} has started. Your ${matchingSelection.selectionName} bet is now live.`,
        href: "/my-bets",
        dedupeKey: `custom-event-start:user:${user._id}:${event._id}`,
        metadata: {
          betId: bet._id,
          sourceMatchId: event._id,
        },
      });

      if (id) {
        created += 1;
      }
    }

    return { success: true, created };
  },
});
