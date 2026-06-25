import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { requireAuth } from "./auth/authorization"

// This is the default - actual value comes from platform_config
const DEFAULT_REFERRAL_REWARD = 1000; // KES

// Helper to get referral reward from config
async function getReferralReward(ctx: QueryCtx | MutationCtx): Promise<number> {
  const config = await ctx.db
    .query("platform_config")
    .withIndex("by_key", (q) => q.eq("key", "main"))
    .first()
  return config?.referralReward ?? DEFAULT_REFERRAL_REWARD
}
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

    // Get configurable reward
    const REFERRAL_REWARD = await getReferralReward(ctx);

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
      .withIndex("by_userId", (q) => q.eq("userId", referrer._id))
      .first();

    if (!wallet) {
      // Create wallet if it doesn't exist
      await ctx.db.insert("wallets", {
        userId: referrer._id,
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

    const rewardAmount = await getReferralReward(ctx);

    return {
      valid: true,
      referrerPhone: referrer.phone,
      rewardAmount,
    };
  },
});


/**
 * Admin: Get all referrals with pagination and filtering
 */
export const getAllReferrals = query({
  args: {
    userId: v.id("users"),
    status: v.optional(v.union(v.literal("pending"), v.literal("completed"), v.literal("all"))),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const limit = Math.min(args.limit ?? 50, 500);
    const offset = args.offset ?? 0;

    // Get total count
    const allReferrals = await ctx.db.query("referrals").collect();
    const total = allReferrals.length;

    // Filter by status if needed
    let filtered = allReferrals;
    if (args.status && args.status !== "all") {
      filtered = allReferrals.filter((r) => r.status === args.status);
    }

    // Sort descending and apply pagination
    const referrals = filtered
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(offset, offset + limit);

    // Enrich with referrer and referred user details
    const enriched = await Promise.all(
      referrals.map(async (referral) => {
        const referrer = await ctx.db.get(referral.referrerId);
        const referredUser = referral.referredUserId
          ? await ctx.db.get(referral.referredUserId)
          : null;

        const referrerPhone = referrer?.phone || "Unknown";
        const referredUserPhone = referredUser?.phone || referral.phone || "Unknown";

        return {
          ...referral,
          referrerPhone,
          referrerName: `User-${referrerPhone.slice(-4)}`,
          referredUserPhone,
          referredUserName: `User-${referredUserPhone.slice(-4)}`,
          referredUserRole: referredUser?.role || undefined,
          createdDate: new Date(referral.createdAt).toLocaleDateString("en-KE"),
          completedDate: referral.completedAt
            ? new Date(referral.completedAt).toLocaleDateString("en-KE")
            : null,
        };
      })
    );

    return {
      referrals: enriched,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  },
});

/**
 * Admin: Get referral summary statistics
 */
export const getReferralSummary = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const allReferrals = await ctx.db.query("referrals").collect();
    const completedReferrals = allReferrals.filter((r) => r.status === "completed");
    const pendingReferrals = allReferrals.filter((r) => r.status === "pending");

    const totalEarnings = completedReferrals.reduce(
      (sum, r) => sum + (r.amountEarned || 0),
      0
    );

    // Get top referrers
    const referrerStats: Record<string, { count: number; earnings: number }> = {};

    allReferrals.forEach((referral) => {
      const referrerId = referral.referrerId.toString();
      if (!referrerStats[referrerId]) {
        referrerStats[referrerId] = { count: 0, earnings: 0 };
      }
      if (referral.status === "completed") {
        referrerStats[referrerId].count++;
        referrerStats[referrerId].earnings += referral.amountEarned || 0;
      }
    });

    // Get referrer details
    const topReferrers = await Promise.all(
      Object.entries(referrerStats)
        .sort(([, a], [, b]) => b.earnings - a.earnings)
        .slice(0, 10)
        .map(async ([referrerId, stats]) => {
          const referrer = await ctx.db.get(referrerId as Id<"users">);
          const phone = referrer?.phone || "Unknown";
          return {
            referrerId,
            phone,
            name: `User-${phone.slice(-4)}`,
            referralCount: stats.count,
            totalEarnings: stats.earnings,
          };
        })
    );

    return {
      totalReferrals: allReferrals.length,
      completedReferrals: completedReferrals.length,
      pendingReferrals: pendingReferrals.length,
      totalEarningsAwarded: totalEarnings,
      averageReward:
        completedReferrals.length > 0
          ? totalEarnings / completedReferrals.length
          : 0,
      topReferrers,
    };
  },
});

/**
 * Admin: Get referral trends by date (last 30 days)
 */
export const getReferralTrends = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const allReferrals = await ctx.db.query("referrals").collect();

    // Group by date (last 30 days)
    const trends: Record<string, { created: number; completed: number }> = {};
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    allReferrals.forEach((referral) => {
      if (referral.createdAt >= thirtyDaysAgo) {
        const date = new Date(referral.createdAt).toLocaleDateString("en-KE");
        if (!trends[date]) {
          trends[date] = { created: 0, completed: 0 };
        }
        trends[date].created++;

        if (referral.status === "completed" && referral.completedAt) {
          const completedDate = new Date(referral.completedAt).toLocaleDateString(
            "en-KE"
          );
          if (!trends[completedDate]) {
            trends[completedDate] = { created: 0, completed: 0 };
          }
          trends[completedDate].completed++;
        }
      }
    });

    return Object.entries(trends)
      .sort(
        ([dateA], [dateB]) =>
          new Date(dateA).getTime() - new Date(dateB).getTime()
      )
      .map(([date, data]) => ({
        date,
        created: data.created,
        completed: data.completed,
      }));
  },
});

/**
 * Admin: Get detailed referrer performance
 */
export const getReferrerPerformance = query({
  args: {
    userId: v.id("users"),
    referrerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const referrer = await ctx.db.get(args.referrerId);
    if (!referrer) {
      throw new Error("Referrer not found");
    }

    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrerId", (q) => q.eq("referrerId", args.referrerId))
      .collect();

    const completed = referrals.filter((r) => r.status === "completed");
    const pending = referrals.filter((r) => r.status === "pending");

    // Calculate conversion rate
    const conversionRate =
      referrals.length > 0 ? (completed.length / referrals.length) * 100 : 0;

    // Get referral details
    const referralDetails = await Promise.all(
      referrals.map(async (referral) => {
        const referredUser = referral.referredUserId
          ? await ctx.db.get(referral.referredUserId)
          : null;
        const phone = referredUser?.phone || referral.phone || "Unknown";
        return {
          ...referral,
          referredUserPhone: phone,
          createdDate: new Date(referral.createdAt).toLocaleDateString("en-KE"),
          completedDate: referral.completedAt
            ? new Date(referral.completedAt).toLocaleDateString("en-KE")
            : null,
        };
      })
    );

    return {
      referrerPhone: referrer.phone,
      referrerRole: referrer.role,
      totalReferrals: referrals.length,
      completedCount: completed.length,
      pendingCount: pending.length,
      totalEarnings: completed.reduce((sum, r) => sum + (r.amountEarned || 0), 0),
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      referralDetails: referralDetails.sort((a, b) => b.createdAt - a.createdAt),
    };
  },
});

