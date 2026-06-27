import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  getUserIdFromSessionToken,
  requireAuth,
} from "./auth/authorization";
import { notifyAdmins, notifyUser } from "./notifications";

const MAX_MESSAGE_LENGTH = 2000;
const MIN_DISPLAY_NAME_LENGTH = 2;
const MAX_DISPLAY_NAME_LENGTH = 50;

const authArgs = {
  sessionToken: v.optional(v.string()),
  userId: v.optional(v.id("users")),
};

async function resolveAuthenticatedUser(
  ctx: QueryCtx | MutationCtx,
  args: { sessionToken?: string; userId?: Id<"users"> }
): Promise<Doc<"users">> {
  if (args.sessionToken) {
    const userId = await getUserIdFromSessionToken(ctx, args.sessionToken);
    if (!userId) {
      throw new Error("Invalid or expired session. Please log in again.");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found.");
    }
    return user;
  }

  if (args.userId) {
    return await requireAuth(ctx, args.userId);
  }

  throw new Error("Authentication required. Please log in.");
}

function normalizeDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function validateDisplayName(displayName: string) {
  const normalized = normalizeDisplayName(displayName);
  if (normalized.length < MIN_DISPLAY_NAME_LENGTH) {
    throw new Error(`Name must be at least ${MIN_DISPLAY_NAME_LENGTH} characters.`);
  }
  if (normalized.length > MAX_DISPLAY_NAME_LENGTH) {
    throw new Error(`Name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`);
  }
  return normalized;
}

export const getMyConversation = query({
  args: authArgs,
  handler: async (ctx, args) => {
    const user = await resolveAuthenticatedUser(ctx, args);

    return await ctx.db
      .query("support_conversations")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
  },
});

export const getMessages = query({
  args: {
    ...authArgs,
    conversationId: v.id("support_conversations"),
  },
  handler: async (ctx, args) => {
    const user = await resolveAuthenticatedUser(ctx, args);
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
  args: authArgs,
  handler: async (ctx, args) => {
    const user = await resolveAuthenticatedUser(ctx, args);

    if (user.role !== "admin") {
      throw new Error("Admin access required.");
    }

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
          displayName: conversation.displayName ?? user?.phone ?? "Unknown",
        };
      })
    );

    return enriched;
  },
});

export const initSupportChat = mutation({
  args: {
    ...authArgs,
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await resolveAuthenticatedUser(ctx, args);

    if (user.role === "admin") {
      throw new Error("Admins cannot start a user support conversation.");
    }

    const displayName = validateDisplayName(args.displayName);

    const existing = await ctx.db
      .query("support_conversations")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      if (!existing.displayName) {
        await ctx.db.patch(existing._id, { displayName });
      }
      return { success: true, conversationId: existing._id, displayName };
    }

    const now = Date.now();
    const conversationId = await ctx.db.insert("support_conversations", {
      userId: user._id,
      displayName,
      status: "open",
      lastMessageAt: now,
      lastMessagePreview: undefined,
      unreadByAdmin: 0,
      unreadByUser: 0,
      createdAt: now,
    });

    return { success: true, conversationId, displayName };
  },
});

export const sendMessage = mutation({
  args: {
    ...authArgs,
    conversationId: v.optional(v.id("support_conversations")),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await resolveAuthenticatedUser(ctx, args);
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
    } else {
      if (conversation) {
        if (conversation.userId !== user._id) {
          throw new Error("Conversation not found");
        }
      } else {
        conversation = await ctx.db
          .query("support_conversations")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .first();
        if (conversation) {
          conversationId = conversation._id;
        }
      }

      if (!conversation) {
        throw new Error("Please enter your name before sending a message.");
      }

      if (!conversation.displayName) {
        throw new Error("Please enter your name before sending a message.");
      }
    }

    if (!conversation || !conversationId) {
      throw new Error("Conversation not found");
    }

    const now = Date.now();
    const preview = body.slice(0, 100);
    const senderRole = user.role === "admin" ? "admin" : "user";

    const messageId = await ctx.db.insert("support_messages", {
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

      try {
        await notifyUser(ctx, {
          recipientUserId: conversation.userId,
          type: "system",
          title: "Support replied",
          message: preview,
          href: "/",
        });
      } catch (error) {
        console.error("Failed to notify user about support reply:", error);
      }
    } else {
      await ctx.db.patch(conversationId, {
        lastMessageAt: now,
        lastMessagePreview: preview,
        unreadByAdmin: conversation.unreadByAdmin + 1,
        status: "open",
      });

      try {
        const label = conversation.displayName ?? user.phone;
        await notifyAdmins(ctx, {
          type: "system",
          title: "New support message",
          message: `${label}: ${preview}`,
          href: "/admin/support",
          dedupeKey: `support:${conversationId}:${messageId}`,
        });
      } catch (error) {
        console.error("Failed to notify admins about support message:", error);
      }
    }

    return { success: true, conversationId, messageId };
  },
});

export const markAsRead = mutation({
  args: {
    ...authArgs,
    conversationId: v.id("support_conversations"),
  },
  handler: async (ctx, args) => {
    const user = await resolveAuthenticatedUser(ctx, args);
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
  args: authArgs,
  handler: async (ctx, args) => {
    const user = await resolveAuthenticatedUser(ctx, args);

    if (user.role === "admin") {
      const conversations = await ctx.db
        .query("support_conversations")
        .withIndex("by_lastMessageAt")
        .order("desc")
        .take(100);

      return conversations.reduce(
        (sum, conversation) => sum + conversation.unreadByAdmin,
        0
      );
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
    ...authArgs,
    conversationId: v.id("support_conversations"),
  },
  handler: async (ctx, args) => {
    const user = await resolveAuthenticatedUser(ctx, args);

    if (user.role !== "admin") {
      throw new Error("Admin access required.");
    }

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
    ...authArgs,
    conversationId: v.id("support_conversations"),
  },
  handler: async (ctx, args) => {
    const user = await resolveAuthenticatedUser(ctx, args);

    if (user.role !== "admin") {
      throw new Error("Admin access required.");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(args.conversationId, { status: "open" });
    return { success: true };
  },
});
