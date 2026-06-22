import { v } from "convex/values";
import { mutation } from "../_generated/server";
import {
  hashPassword,
  normalizePhoneNumber,
  isValidPhoneNumber,
  validatePassword,
} from "./utils";

export const registerUser = mutation({
  args: {
    phone: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const { phone, password } = args;

    // Validate phone number format
    if (!isValidPhoneNumber(phone)) {
      throw new Error(
        "Invalid phone number format. Please use a valid Kenyan phone number (e.g., 0712345678 or 254712345678)"
      );
    }

    // Normalize phone number to E.164 format
    const normalizedPhone = normalizePhoneNumber(phone);

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      throw new Error(passwordError);
    }

    // Check if phone number already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
      .unique();

    if (existingUser) {
      throw new Error("Phone number already registered");
    }

    // Hash the password
    const passwordHash = hashPassword(password);

    // Create the user
    const userId = await ctx.db.insert("users", {
      phone: normalizedPhone,
      passwordHash,
      role: "user",
      createdAt: Date.now(),
    });

    // Return success response with user info (excluding password hash)
    return {
      success: true,
      userId,
      phone: normalizedPhone,
      role: "user" as const,
      message: "User registered successfully",
    };
  },
});
