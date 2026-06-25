import { v } from "convex/values";
import { mutation } from "../_generated/server";
import {
  hashPassword,
  normalizePhoneNumber,
  isValidPhoneNumber,
  validatePassword,
} from "./utils";

// Generate unique referral code for a user
function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const registerUser = mutation({
  args: {
    phone: v.string(),
    password: v.string(),
    referralCode: v.optional(v.string()), // referral code from signup link
  },
  handler: async (ctx, args) => {
    const { phone, password, referralCode } = args;

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

    // Validate referral code if provided
    let referrerId = null;
    if (referralCode) {
      const referrer = await ctx.db
        .query("users")
        .withIndex("by_referralCode", (q) => q.eq("referralCode", referralCode))
        .first();

      if (!referrer) {
        throw new Error("Invalid referral code");
      }

      referrerId = referrer._id;
    }

    // Hash the password
    const passwordHash = hashPassword(password);

    // Generate unique referral code for this new user
    let newUserReferralCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      newUserReferralCode = generateReferralCode();
      const existing = await ctx.db
        .query("users")
        .withIndex("by_referralCode", (q) => q.eq("referralCode", newUserReferralCode))
        .first();

      if (!existing) {
        break;
      }

      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique referral code");
    }

    // Create the user with referral info
    const userId = await ctx.db.insert("users", {
      phone: normalizedPhone,
      passwordHash,
      role: "user",
      createdAt: Date.now(),
      referralCode: newUserReferralCode,
      referredBy: referrerId || undefined,
      totalReferrals: 0,
      totalReferralEarnings: 0,
    });

    // If user was referred, track the referral and award the referrer
    if (referralCode && referrerId) {
      // Get dynamic referral reward from config
      const config = await ctx.db
        .query("platform_config")
        .withIndex("by_key", (q) => q.eq("key", "main"))
        .first();
      const REFERRAL_REWARD = config?.referralReward ?? 1000; // KES, default to 1000
      const now = Date.now();

      // Find or create referral record
      let referralRecord = await ctx.db
        .query("referrals")
        .withIndex("by_referralCode", (q) => q.eq("referralCode", referralCode))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .first();

      if (referralRecord) {
        // Update existing pending referral
        await ctx.db.patch(referralRecord._id, {
          referredUserId: userId,
          status: "completed",
          amountEarned: REFERRAL_REWARD,
          completedAt: now,
        });
      } else {
        // Create new referral record
        await ctx.db.insert("referrals", {
          referrerId,
          referredUserId: userId,
          referralCode,
          status: "completed",
          amountEarned: REFERRAL_REWARD,
          createdAt: now,
          completedAt: now,
        });
      }

      // Update referrer's stats
      const referrer = await ctx.db.get(referrerId);
      if (referrer) {
        const currentReferrals = referrer.totalReferrals ?? 0;
        const currentEarnings = referrer.totalReferralEarnings ?? 0;

        await ctx.db.patch(referrerId, {
          totalReferrals: currentReferrals + 1,
          totalReferralEarnings: currentEarnings + REFERRAL_REWARD,
        });

        // Award the referrer in the wallet
        let wallet = await ctx.db
          .query("wallets")
          .filter((q) => q.eq(q.field("userId"), referrerId.toString()))
          .first();

        if (!wallet) {
          // Create wallet if it doesn't exist
          await ctx.db.insert("wallets", {
            userId: referrerId,
            balance: REFERRAL_REWARD,
          });
        } else {
          // Update existing wallet
          await ctx.db.patch(wallet._id, {
            balance: wallet.balance + REFERRAL_REWARD,
          });
        }
      }
    }

    // Return success response with user info (excluding password hash)
    return {
      success: true,
      userId,
      phone: normalizedPhone,
      role: "user" as const,
      message: "User registered successfully",
      referralCode: newUserReferralCode,
      referredBy: referrerId,
    };
  },
});
