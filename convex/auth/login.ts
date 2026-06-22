import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { normalizePhoneNumber, verifyPassword } from "./utils";

export const loginUser = mutation({
  args: {
    phone: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const { phone, password } = args;

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);

    // Find user by phone
    const user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
      .unique();

    if (!user) {
      throw new Error("Invalid phone number or password");
    }

    // Verify password
    const isValidPassword = verifyPassword(user.passwordHash, password);

    if (!isValidPassword) {
      throw new Error("Invalid phone number or password");
    }

    // Return user data (excluding password hash) for JWT creation
    return {
      success: true,
      userId: user._id,
      phone: user.phone,
      role: user.role,
      tokenIdentifier: `convex|${user._id}`, // Standard Convex token identifier format
      message: "Login successful",
    };
  },
});
