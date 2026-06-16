import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  ...authTables,
  admins: defineTable({
    userId: v.id("users"),
    email: v.string(),
    addedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  /**
   * Tracks bans for users. One active ban per user at a time.
   * bannedUntil = null means permanent ban.
   */
  userBans: defineTable({
    userId: v.id("users"),
    reason: v.string(),
    bannedAt: v.number(),
    bannedByAdminId: v.id("admins"),
    /** null = permanent */
    bannedUntil: v.union(v.number(), v.null()),
    isActive: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_isActive", ["userId", "isActive"]),

  /**
   * Appeal submissions from banned users.
   */
  banAppeals: defineTable({
    banId: v.id("userBans"),
    userId: v.id("users"),
    message: v.string(),
    submittedAt: v.number(),
    /** pending | approved | rejected */
    status: v.string(),
    reviewedAt: v.union(v.number(), v.null()),
    reviewedByAdminId: v.union(v.id("admins"), v.null()),
    adminNote: v.union(v.string(), v.null()),
  })
    .index("by_banId", ["banId"])
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),
});

export default schema;
