import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  ...authTables,
  admins: defineTable({
    userId: v.id("users"),
    email: v.string(),
    addedAt: v.number(),
  }).index("by_userId", ["userId"]).index("by_email", ["email"]),
});

export default schema;
