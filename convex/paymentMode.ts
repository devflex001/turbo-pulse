import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

/**
 * Get current active payment mode
 */
export const getActiveMode = query(async (ctx) => {
  // Get the active payment mode
  const config = await ctx.db.query("payment_mode").first()

  if (!config) {
    // Default to mpesa if not configured
    return {
      mode: "mpesa" as const,
      isEnabled: true,
    }
  }

  return {
    mode: config.mode,
    isEnabled: config.isEnabled,
  }
})

/**
 * Set payment mode
 */
export const setMode = mutation({
  args: {
    mode: v.union(v.literal("mpesa"), v.literal("paystack")),
    userId: v.optional(v.id("users")),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { requireAdmin } = await import("./auth/authorization")
    const admin = await requireAdmin(ctx, args.userId)

    const existing = await ctx.db.query("payment_mode").first()
    const oldMode = existing?.mode || "mpesa"

    // Delete existing config
    if (existing) {
      await ctx.db.delete(existing._id)
    }

    // Create new config
    await ctx.db.insert("payment_mode", {
      mode: args.mode,
      isEnabled: true,
      updatedAt: Date.now(),
      updatedBy: admin.phone ?? admin._id.toString(),
    })

    // Log the action
    if (args.sessionToken) {
      const { logAdminActionInternal } = await import("./audit/logs")
      const { getAdminSessionByTokenInternal } = await import("./admin/sessions")

      const adminSession = await getAdminSessionByTokenInternal(ctx, args.sessionToken)
      if (adminSession) {
        await logAdminActionInternal(ctx, {
          adminName: adminSession.adminName,
          userId: admin._id,
          actionType: "set_payment_mode",
          resourceType: "payment_mode",
          resourceDescription: "Payment mode updated",
          details: {
            previousValue: oldMode,
            newValue: args.mode,
          },
        })
      }
    }

    console.log(`[Payment Mode] Switched to: ${args.mode}`)

    return {
      success: true,
      mode: args.mode,
      message: `Payment mode switched to ${args.mode.toUpperCase()}`,
    }
  },
})

/**
 * Get payment mode history/audit
 */
export const getHistory = query(async (ctx) => {
  // For now, just return current mode
  // In future, could store full history in a separate table
  const config = await ctx.db.query("payment_mode").first()

  return {
    current: config ? config.mode : "mpesa",
    lastUpdated: config ? config.updatedAt : 0,
    lastUpdatedBy: config ? config.updatedBy : "system",
  }
})
