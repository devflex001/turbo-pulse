import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireAuth } from "./auth/authorization";
import { notifyAdmins, notifyUser } from "./notifications";

const MAX_MESSAGE_LENGTH = 2000;

export const getMyConversation = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.userId);

    return await ctx.db
      .query("support_conversations")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
  },
});

export const getMessages = query({
  args: {
    userId: v.id("users"),
    conversationId: v.id("support_conversations"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.userId);
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const isOwner = conversation.userId === user._id;
    const isAdminUser = user.role === "admin";

    if (!isOwner && !isAdminUser) {
      throw new Error("Permission denied");
    }

    return await ctx.db
      .query("support_messages")
      .withIndex("by_conversationId_and_createdAt", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .take(200);
  },
});

export const listConversations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const conversations = await ctx.db
      .query("support_conversations")
      .withIndex("by_lastMessageAt")
      .order("desc")
      .take(100);

    const enriched = await Promise.all(
      conversations.map(async (conversation) => {
        const user = await ctx.db.get(conversation.userId);
        return {
          ...conversation,
          userPhone: user?.phone ?? "Unknown",
        };
      })
    );

    return enriched;
  },
});

export const sendMessage = mutation({
  args: {
    userId: v.id("users"),
    conversationId: v.optional(v.id("support_conversations")),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.userId);
    const body = args.body.trim();

    if (!body) {
      throw new Error("Message cannot be empty");
    }

    if (body.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`);
    }

    let conversationId = args.conversationId;
    let conversation = conversationId ? await ctx.db.get(conversationId) : null;

    if (user.role === "admin") {
      if (!conversation) {
        throw new Error("Conversation ID required");
      }
    } else if (conversation) {
      if (conversation.userId !== user._id) {
        throw new Error("Conversation not found");
      }
    } else {
      conversation = await ctx.db
        .query("support_conversations")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();

      if (!conversation) {
        conversationId = await ctx.db.insert("support_conversations", {
          userId: user._id,
          status: "open",
          lastMessageAt: Date.now(),
          lastMessagePreview: body.slice(0, 100),
          unreadByAdmin: 0,
          unreadByUser: 0,
          createdAt: Date.now(),
        });
        conversation = await ctx.db.get(conversationId);
      } else {
        conversationId = conversation._id;
      }
    }

    if (!conversation || !conversationId) {
      throw new Error("Conversation not found");
    }

    const now = Date.now();
    const preview = body.slice(0, 100);
    const senderRole = user.role === "admin" ? "admin" : "user";

    await ctx.db.insert("support_messages", {
      conversationId,
      senderId: user._id,
      senderRole,
      body,
      createdAt: now,
    });

    if (senderRole === "admin") {
      await ctx.db.patch(conversationId, {
        lastMessageAt: now,
        lastMessagePreview: preview,
        unreadByUser: conversation.unreadByUser + 1,
        status: "open",
      });

      await notifyUser(ctx, {
        recipientUserId: conversation.userId,
        type: "system",
        title: "Support replied",
        message: preview,
        href: "/",
      });
    } else {
      await ctx.db.patch(conversationId, {
        lastMessageAt: now,
        lastMessagePreview: preview,
        unreadByAdmin: conversation.unreadByAdmin + 1,
        status: "open",
      });

      await notifyAdmins(ctx, {
        type: "system",
        title: "New support message",
        message: `${user.phone}: ${preview}`,
        href: "/admin/support",
        dedupeKey: `support:${conversationId}:${now}`,
      });
    }

    return { success: true, conversationId };
  },
});

export const markAsRead = mutation({
  args: {
    userId: v.id("users"),
    conversationId: v.id("support_conversations"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.userId);
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (user.role === "admin") {
      await ctx.db.patch(args.conversationId, { unreadByAdmin: 0 });
    } else if (conversation.userId === user._id) {
      await ctx.db.patch(args.conversationId, { unreadByUser: 0 });
    } else {
      throw new Error("Permission denied");
    }

    return { success: true };
  },
});

export const getUnreadCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.userId);

    if (user.role === "admin") {
      const conversations = await ctx.db
        .query("support_conversations")
        .withIndex("by_lastMessageAt")
        .order("desc")
        .take(100);

      return conversations.reduce((sum, conversation) => sum + conversation.unreadByAdmin, 0);
    }

    const conversation = await ctx.db
      .query("support_conversations")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    return conversation?.unreadByUser ?? 0;
  },
});

export const closeConversation = mutation({
  args: {
    userId: v.id("users"),
    conversationId: v.id("support_conversations"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(args.conversationId, { status: "closed" });
    return { success: true };
  },
});

export const reopenConversation = mutation({
  args: {
    userId: v.id("users"),
    conversationId: v.id("support_conversations"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(args.conversationId, { status: "open" });
    return { success: true };
  },
});
