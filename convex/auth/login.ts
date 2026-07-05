import { v } from "convex/values";
import { mutation, MutationCtx } from "../_generated/server";
import { normalizePhoneNumber, verifyPassword } from "./utils";
import { api } from "../_generated/api";

export const loginUser = mutation({
  args: {
    phone: v.string(),
    password: v.string(),
  },
  handler: async (ctx: MutationCtx, args: { phone: string; password: string }) => {
    const { phone, password } = args;

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);

    // Find user by phone
    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
      .unique();

    if (!user) {
      // Don't reveal whether phone number exists
      throw new Error("Invalid phone number or password");
    }

    // Verify password
    const isValidPassword = verifyPassword(user.passwordHash, password);

    if (!isValidPassword) {
      // Generic message for security - don't confirm if phone exists
      throw new Error("Invalid phone number or password");
    }

    // Create session
    const session: { sessionToken: string; expiresAt: number } = await ctx.runMutation(
      api.auth.sessions.createSession,
      {
        userId: user._id,
      }
    );

    // Return user data with session token
    return {
      success: true,
      userId: user._id,
      phone: user.phone,
      username: user.username || undefined,
      role: user.role,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      message: "Login successful",
    };
  },
});
