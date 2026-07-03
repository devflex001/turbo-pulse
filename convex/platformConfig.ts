import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./auth/authorization";

const CONFIG_KEY = "main";

const DEFAULTS = {
  minDeposit: 100,
  minWithdrawal: 500,
  withdrawalFeePercent: 2.5,
  instantProcessingFee: 150,
  referralReward: 1000,
};

// ────────────────────────────────────────────────────────────────────────────
// QUERIES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get the full platform config (admin use).
 */
export const getConfig = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // For non-admin users, skip the admin check
    if (args.userId) {
      await requireAdmin(ctx, args.userId);
    }

    const config = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", CONFIG_KEY))
      .unique();

    if (!config) {
      return {
        key: CONFIG_KEY,
        ...DEFAULTS,
        updatedAt: null as number | null,
        updatedBy: null as string | null,
      };
    }

    return config;
  },
});

/**
 * Public query — returns only the fields users need for the withdrawal sheet.
 * No auth required.
 */
export const getUserFacingConfig = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", CONFIG_KEY))
      .unique();

    return {
      minDeposit: config?.minDeposit ?? DEFAULTS.minDeposit,
      minWithdrawal: config?.minWithdrawal ?? DEFAULTS.minWithdrawal,
      withdrawalFeePercent:
        config?.withdrawalFeePercent ?? DEFAULTS.withdrawalFeePercent,
      instantProcessingFee:
        config?.instantProcessingFee ?? DEFAULTS.instantProcessingFee,
      referralReward: config?.referralReward ?? DEFAULTS.referralReward,
    };
  },
});

// ────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Upsert the singleton platform config. Admin-only.
 */
export const saveConfig = mutation({
  args: {
    userId: v.optional(v.id("users")),
    sessionToken: v.optional(v.string()), // For logging
    minDeposit: v.optional(v.number()),
    minWithdrawal: v.optional(v.number()),
    withdrawalFeePercent: v.optional(v.number()),
    instantProcessingFee: v.optional(v.number()),
    referralReward: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.userId);

    const existing = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", CONFIG_KEY))
      .unique();

    const now = Date.now();
    const updatedBy = admin.phone ?? admin._id.toString();

    const changes: string[] = [];
    if (args.minDeposit !== undefined) changes.push(`minDeposit: ${args.minDeposit}`);
    if (args.minWithdrawal !== undefined) changes.push(`minWithdrawal: ${args.minWithdrawal}`);
    if (args.withdrawalFeePercent !== undefined) changes.push(`withdrawalFeePercent: ${args.withdrawalFeePercent}%`);
    if (args.instantProcessingFee !== undefined) changes.push(`instantProcessingFee: ${args.instantProcessingFee}`);
    if (args.referralReward !== undefined) changes.push(`referralReward: ${args.referralReward}`);

    if (!existing) {
      await ctx.db.insert("platform_config", {
        key: CONFIG_KEY,
        minDeposit: args.minDeposit ?? DEFAULTS.minDeposit,
        minWithdrawal: args.minWithdrawal ?? DEFAULTS.minWithdrawal,
        withdrawalFeePercent:
          args.withdrawalFeePercent ?? DEFAULTS.withdrawalFeePercent,
        instantProcessingFee:
          args.instantProcessingFee ?? DEFAULTS.instantProcessingFee,
        referralReward: args.referralReward ?? DEFAULTS.referralReward,
        updatedAt: now,
        updatedBy,
      });
    } else {
      await ctx.db.patch(existing._id, {
        ...(args.minDeposit !== undefined && { minDeposit: args.minDeposit }),
        ...(args.minWithdrawal !== undefined && {
          minWithdrawal: args.minWithdrawal,
        }),
        ...(args.withdrawalFeePercent !== undefined && {
          withdrawalFeePercent: args.withdrawalFeePercent,
        }),
        ...(args.instantProcessingFee !== undefined && {
          instantProcessingFee: args.instantProcessingFee,
        }),
        ...(args.referralReward !== undefined && {
          referralReward: args.referralReward,
        }),
        updatedAt: now,
        updatedBy,
      });
    }

    // Log the action
    if (args.sessionToken) {
      const { logAdminActionInternal } = await import("./audit/logs");
      const { getAdminSessionByTokenInternal } = await import("./admin/sessions");

      const adminSession = await getAdminSessionByTokenInternal(ctx, args.sessionToken);
      if (adminSession) {
        await logAdminActionInternal(ctx, {
          adminName: adminSession.adminName,
          userId: admin._id,
          actionType: "update_platform_config",
          resourceType: "platform_config",
          resourceDescription: "Platform configuration updated",
          details: {
            newValue: changes.join("; "),
          },
        });
      }
    }

    return { success: true };
  },
});
