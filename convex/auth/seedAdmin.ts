import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import {
  hashPassword,
  normalizePhoneNumber,
  isValidPhoneNumber,
  validatePassword,
} from "./utils";

/**
 * Seed an admin user
 * CRITICAL SECURITY RULES:
 * 1. This is an INTERNAL mutation - cannot be called from public frontend
 * 2. In production, requires ADMIN_SEED_SECRET environment variable
 * 3. Will not create duplicate admins
 * 4. Only callable via Convex dashboard or backend scripts
 */
export const seedAdminUser = internalMutation({
  args: {
    phone: v.string(),
    password: v.string(),
    secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { phone, password, secret } = args;

    // Security check: In production, require secret
    const isProduction = process.env.NODE_ENV === "production";
    const adminSeedSecret = process.env.ADMIN_SEED_SECRET;

    if (isProduction) {
      if (!adminSeedSecret) {
        throw new Error(
          "ADMIN_SEED_SECRET environment variable must be set in production"
        );
      }

      if (!secret || secret !== adminSeedSecret) {
        throw new Error("Invalid admin seed secret");
      }
    }

    // Validate phone number format
    if (!isValidPhoneNumber(phone)) {
      throw new Error(
        "Invalid phone number format. Please use a valid Kenyan phone number"
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);

    // Check if admin with this phone already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
      .unique();

    if (existingUser) {
      if (existingUser.role === "admin") {
        throw new Error(
          `Admin with phone ${normalizedPhone} already exists`
        );
      } else {
        throw new Error(
          `User with phone ${normalizedPhone} already exists but is not an admin`
        );
      }
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      throw new Error(passwordError);
    }

    // Hash the password
    const passwordHash = hashPassword(password);

    // Create the admin user
    const adminId = await ctx.db.insert("users", {
      phone: normalizedPhone,
      passwordHash,
      role: "admin",
      createdAt: Date.now(),
    });

    console.log(
      `✅ Admin user created successfully: ${normalizedPhone} (ID: ${adminId})`
    );

    return {
      success: true,
      adminId,
      phone: normalizedPhone,
      role: "admin" as const,
      message: "Admin user created successfully",
    };
  },
});

/**
 * Check if any admin users exist in the system
 * Useful for determining if initial admin seeding is needed
 */
export const hasAdminUser = internalMutation({
  args: {},
  handler: async (ctx) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .first();

    return {
      hasAdmin: !!admin,
    };
  },
});
