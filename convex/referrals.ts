import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAuth } from "./auth/authorization";

// Constants
const REFERRAL_REWARD = 1000; // KES

/**
 * Generate a unique referral code
 */
async function generateUniqueReferralCode(ctx: QueryCtx | MutationCtx): Promise<string> {
  let referralCode: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    referralCode = "";
    for (let i = 0; i < 8; i++) {
      referralCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", referralCode))
      .first();

    if (!existing) {
      break;
    }

    attempts++;
  } while (attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    throw new Error("Failed to generate unique referral code");
  }

  return referralCode;
}

/**
 * Ensure user has a referral code (generate if missing)
 * Should be called on referrals page load
 */
export const ensureReferralCode = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.userId.toString());

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // If user already has a code, return it
    if (user.referralCode) {
      return {
        referralCode: user.referralCode,
        isNew: false,
      };
    }

    // Generate unique referral code
    const referralCode = await generateUniqueReferralCode(ctx);

    // Update user with new referral code and initialize stats
    await ctx.db.patch(args.userId, {
      referralCode,
      totalReferrals: 0,
      totalReferralEarnings: 0,
    });

    return {
      referralCode,
      isNew: true,
    };
  },
});

/**
 * Generate referral code for a user (called during signup)
 */
export const generateUserReferralCode = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Only generate if user doesn't already have one
    if (user.referralCode) {
      return user.referralCode;
    }

    const referralCode = await generateUniqueReferralCode(ctx);

    // Update user with referral code
    await ctx.db.patch(args.userId, {
      referralCode,
      totalReferrals: 0,
      totalReferralEarnings: 0,
    });

    return referralCode;
  },
});

/**
 * Get referral stats for a user
 */
export const getReferralStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.userId.toString());

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Return stats as-is. If no code, client should call ensureReferralCode mutation
    const completedReferrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrerId_and_status", (q) =>
        q.eq("referrerId", args.userId).eq("status", "completed")
      )
      .collect();

    const pendingReferrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrerId_and_status", (q) =>
        q.eq("referrerId", args.userId).eq("status", "pending")
      )
      .collect();

    return {
      referralCode: user.referralCode ?? null,
      totalReferrals: user.totalReferrals ?? 0,
      totalReferralEarnings: user.totalReferralEarnings ?? 0,
      completedCount: completedReferrals.length,
      pendingCount: pendingReferrals.length,
    };
  },
});

/**
 * Get referral history for a user
 */
export const getReferralHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.userId.toString());

    const limit = Math.min(args.limit ?? 50, 100);

    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrerId", (q) => q.eq("referrerId", args.userId))
      .order("desc")
      .take(limit);

    // Enrich with referred user info
    const enriched = await Promise.all(
      referrals.map(async (referral) => {
        let referredUser = null;
        if (referral.referredUserId) {
          referredUser = await ctx.db.get(referral.referredUserId);
        }

        return {
          ...referral,
          referredUserPhone: referredUser?.phone ?? referral.phone ?? "Unknown",
        };
      })
    );

    return enriched;
  },
});

/**
 * Track a user signing up with a referral code
 * Called during signup to complete the referral
 */
export const trackReferralSignup = mutation({
  args: {
    referralCode: v.string(),
    newUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const newUser = await ctx.db.get(args.newUserId);
    if (!newUser) {
      throw new Error("New user not found");
    }

    // Find the referral code
    const referrer = await ctx.db
      .query("users")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", args.referralCode))
      .first();

    if (!referrer) {
      throw new Error("Invalid referral code");
    }

    // Check if this user was already referred (shouldn't happen but safety check)
    if (newUser.referredBy) {
      throw new Error("User already has a referrer");
    }

    // Find or create the referral record
    let referralRecord = await ctx.db
      .query("referrals")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", args.referralCode))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    const now = Date.now();

    if (referralRecord) {
      // Update existing pending referral
      await ctx.db.patch(referralRecord._id, {
        referredUserId: args.newUserId,
        status: "completed",
        amountEarned: REFERRAL_REWARD,
        completedAt: now,
      });
    } else {
      // Create new referral record (this handles direct signup with code)
      await ctx.db.insert("referrals", {
        referrerId: referrer._id,
        referredUserId: args.newUserId,
        referralCode: args.referralCode,
        status: "completed",
        amountEarned: REFERRAL_REWARD,
        createdAt: now,
        completedAt: now,
      });
    }

    // Update new user with referrer info
    await ctx.db.patch(args.newUserId, {
      referredBy: referrer._id,
    });

    // Update referrer's stats
    const currentReferrals = referrer.totalReferrals ?? 0;
    const currentEarnings = referrer.totalReferralEarnings ?? 0;

    await ctx.db.patch(referrer._id, {
      totalReferrals: currentReferrals + 1,
      totalReferralEarnings: currentEarnings + REFERRAL_REWARD,
    });

    // Award the referrer their bonus in the wallet
    let wallet = await ctx.db
      .query("wallets")
      .filter((q) => q.eq(q.field("userId"), referrer._id.toString()))
      .first();

    if (!wallet) {
      // Create wallet if it doesn't exist
      await ctx.db.insert("wallets", {
        userId: referrer._id.toString(),
        balance: REFERRAL_REWARD,
      });
    } else {
      // Update existing wallet
      await ctx.db.patch(wallet._id, {
        balance: wallet.balance + REFERRAL_REWARD,
      });
    }

    return {
      success: true,
      referralId: referralRecord?._id,
      rewardAmount: REFERRAL_REWARD,
      referrerPhone: referrer.phone,
    };
  },
});

/**
 * Create a pending referral when someone clicks a referral link
 * (Optional - for tracking clicks before signup)
 */
export const createPendingReferral = mutation({
  args: {
    referralCode: v.string(),
    visitorPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the referrer
    const referrer = await ctx.db
      .query("users")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", args.referralCode))
      .first();

    if (!referrer) {
      throw new Error("Invalid referral code");
    }

    // Check if pending referral already exists for this phone
    if (args.visitorPhone) {
      const existing = await ctx.db
        .query("referrals")
        .withIndex("by_referralCode", (q) => q.eq("referralCode", args.referralCode))
        .filter((q) =>
          q.and(
            q.eq(q.field("phone"), args.visitorPhone),
            q.eq(q.field("status"), "pending")
          )
        )
        .first();

      if (existing) {
        return existing._id;
      }
    }

    // Create new pending referral
    const referralId = await ctx.db.insert("referrals", {
      referrerId: referrer._id,
      referralCode: args.referralCode,
      phone: args.visitorPhone,
      status: "pending",
      amountEarned: 0,
      createdAt: Date.now(),
    });

    return referralId;
  },
});

/**
 * Get referral link for sharing
 */
export const getReferralLink = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.userId.toString());

    const user = await ctx.db.get(args.userId);
    if (!user || !user.referralCode) {
      return null;
    }

    // Build the referral link - when clicked, adds ?ref=CODE to homepage
    // The RegisterModal will detect this and auto-fill the referral code
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const referralLink = `${baseUrl}?ref=${user.referralCode}`;

    return {
      referralCode: user.referralCode,
      referralLink,
    };
  },
});

/**
 * Verify referral code is valid
 */
export const verifyReferralCode = query({
  args: {
    referralCode: v.string(),
  },
  handler: async (ctx, args) => {
    const referrer = await ctx.db
      .query("users")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", args.referralCode))
      .first();

    if (!referrer) {
      return { valid: false };
    }

    return {
      valid: true,
      referrerPhone: referrer.phone,
      rewardAmount: REFERRAL_REWARD,
    };
  },
});
