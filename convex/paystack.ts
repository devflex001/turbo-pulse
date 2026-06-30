import { v } from "convex/values"
import { mutation, query, action } from "./_generated/server"
import type { MutationCtx } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import { notifyAdmins, notifyUser } from "./notifications"

function formatKes(amount: number) {
  return `KES ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Get current Paystack configuration
 * Checks both database and environment variables
 */
export const getConfig = query(async (ctx) => {
  // Try to get config from database
  const dbConfig = await ctx.db
    .query("paystack_config")
    .filter((q) => q.eq(q.field("isEnabled"), true))
    .first()

  if (dbConfig && !dbConfig.useEnvVariables) {
    return {
      ...dbConfig,
      source: "database",
    }
  }

  // Fall back to environment variables
  return {
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
    secretKey: process.env.PAYSTACK_SECRET_KEY || "",
    isProduction: process.env.NODE_ENV === "production",
    isEnabled: true,
    useEnvVariables: true,
    source: "environment",
  }
})

/**
 * Get all saved Paystack configurations
 */
export const getAllConfigs = query(async (ctx) => {
  return await ctx.db.query("paystack_config").collect()
})

/**
 * Save new Paystack configuration
 */
export const saveConfig = mutation({
  args: {
    publicKey: v.string(),
    secretKey: v.string(),
    isProduction: v.boolean(),
    userId: v.optional(v.id("users")),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { requireAdmin } = await import("./auth/authorization")
    const admin = await requireAdmin(ctx, args.userId)

    // Disable all other configs
    const existingConfigs = await ctx.db.query("paystack_config").collect()
    for (const config of existingConfigs) {
      await ctx.db.patch(config._id, { isEnabled: false })
    }

    // Save new config as active
    const newConfigId = await ctx.db.insert("paystack_config", {
      publicKey: args.publicKey,
      secretKey: args.secretKey,
      isProduction: args.isProduction,
      isEnabled: true,
      useEnvVariables: false,
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
          actionType: "update_payment_gateway_config",
          resourceType: "paystack_config",
          resourceDescription: "Paystack configuration saved",
          details: {
            newValue: `Environment: ${args.isProduction ? "Production" : "Test"}`,
          },
        })
      }
    }

    return { success: true, configId: newConfigId }
  },
})

/**
 * Update configuration to use environment variables
 */
export const switchToEnvVariables = mutation({
  args: {
    userId: v.optional(v.id("users")),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { requireAdmin } = await import("./auth/authorization")
    const admin = await requireAdmin(ctx, args.userId)

    const existingConfigs = await ctx.db.query("paystack_config").collect()
    for (const config of existingConfigs) {
      await ctx.db.patch(config._id, { isEnabled: false })
    }

    // Log the action
    if (args.sessionToken) {
      const { logAdminActionInternal } = await import("./audit/logs")
      const { getAdminSessionByTokenInternal } = await import("./admin/sessions")

      const adminSession = await getAdminSessionByTokenInternal(ctx, args.sessionToken)
      if (adminSession) {
        await logAdminActionInternal(ctx, {
          adminName: adminSession.adminName,
          userId: admin._id,
          actionType: "update_payment_gateway_config",
          resourceType: "paystack_config",
          resourceDescription: "Paystack switched to environment variables",
          details: {
            newValue: "Using environment variables",
          },
        })
      }
    }

    return { success: true, message: "Switched to environment variables" }
  },
})

/**
 * Activate a saved configuration
 */
export const activateConfig = mutation({
  args: {
    configId: v.id("paystack_config"),
    userId: v.optional(v.id("users")),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { requireAdmin } = await import("./auth/authorization")
    const admin = await requireAdmin(ctx, args.userId)

    const configToActivate = await ctx.db.get(args.configId)
    if (!configToActivate) {
      throw new Error("Configuration not found")
    }

    // Disable all other configs
    const existingConfigs = await ctx.db.query("paystack_config").collect()
    for (const config of existingConfigs) {
      await ctx.db.patch(config._id, { isEnabled: false })
    }

    // Enable the selected config
    await ctx.db.patch(args.configId, { isEnabled: true, useEnvVariables: false })

    // Log the action
    if (args.sessionToken) {
      const { logAdminActionInternal } = await import("./audit/logs")
      const { getAdminSessionByTokenInternal } = await import("./admin/sessions")

      const adminSession = await getAdminSessionByTokenInternal(ctx, args.sessionToken)
      if (adminSession) {
        await logAdminActionInternal(ctx, {
          adminName: adminSession.adminName,
          userId: admin._id,
          actionType: "update_payment_gateway_config",
          resourceType: "paystack_config",
          resourceDescription: "Paystack configuration activated",
          details: {
            newValue: `Environment: ${configToActivate.isProduction ? "Production" : "Test"}`,
          },
        })
      }
    }

    return { success: true }
  },
})

/**
 * Delete a saved configuration
 */
export const deleteConfig = mutation({
  args: {
    configId: v.id("paystack_config"),
    userId: v.optional(v.id("users")),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { requireAdmin } = await import("./auth/authorization")
    const admin = await requireAdmin(ctx, args.userId)

    const configToDelete = await ctx.db.get(args.configId)
    if (!configToDelete) {
      throw new Error("Configuration not found")
    }

    await ctx.db.delete(args.configId)

    // Log the action
    if (args.sessionToken) {
      const { logAdminActionInternal } = await import("./audit/logs")
      const { getAdminSessionByTokenInternal } = await import("./admin/sessions")

      const adminSession = await getAdminSessionByTokenInternal(ctx, args.sessionToken)
      if (adminSession) {
        await logAdminActionInternal(ctx, {
          adminName: adminSession.adminName,
          userId: admin._id,
          actionType: "update_payment_gateway_config",
          resourceType: "paystack_config",
          resourceDescription: "Paystack configuration deleted",
          details: {
            previousValue: `Environment: ${configToDelete.isProduction ? "Production" : "Test"}`,
          },
        })
      }
    }

    return { success: true }
  },
})

/**
 * Test configuration
 */
export const testConfig = action({
  args: {
    secretKey: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const response = await fetch("https://api.paystack.co/transaction", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${args.secretKey}`,
        },
      })

      if (response.ok) {
        return { success: true, message: "Configuration is valid" }
      } else {
        const error = await response.text()
        return { success: false, message: `Authentication failed: ${error}` }
      }
    } catch (error) {
      return {
        success: false,
        message: `Error testing configuration: ${String(error)}`,
      }
    }
  },
})

/**
 * Create a Paystack transaction record
 */
export const createTransaction = mutation({
  args: {
    userId: v.optional(v.id("users")),
    type: v.union(v.literal("deposit"), v.literal("withdrawal")),
    amount: v.number(),
    email: v.string(),
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate amount
    if (args.amount <= 0) {
      throw new Error("Amount must be greater than 0")
    }

    if (args.amount > 1000000) {
      throw new Error("Amount exceeds maximum limit")
    }

    // Create transaction record
    const txId = await ctx.db.insert("transactions", {
      txId: `PAYSTACK-${args.reference}`,
      userId: args.userId,
      type: args.type,
      amount: args.amount,
      phone: args.email,
      status: "pending",
      checkoutRequestID: args.reference,
      time: Date.now(),
    })

    return {
      transactionId: txId,
      reference: args.reference,
    }
  },
})

/**
 * Update transaction status after Paystack verification
 */
export const updateTransactionStatus = mutation({
  args: {
    reference: v.string(),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("pending")),
    amount: v.optional(v.number()),
    authorizationCode: v.optional(v.string()),
    cardType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find transaction by reference
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_checkoutRequestID", (q) => q.eq("checkoutRequestID", args.reference))
      .unique()

    if (!transaction) {
      console.error(`Transaction not found: ${args.reference}`)
      throw new Error(`Transaction not found: ${args.reference}`)
    }

    // Determine feedback message
    const getFeedback = (status: string) => {
      const feedbackMap: Record<
        string,
        { message: string; type: "success" | "error" | "warning" }
      > = {
        success: { message: "Payment completed successfully", type: "success" },
        pending: { message: "Payment is being processed", type: "warning" },
        failed: { message: "Payment failed", type: "error" },
      }
      return feedbackMap[status] || { message: `Payment status: ${status}`, type: "warning" }
    }

    const feedback = getFeedback(args.status)
    const oldStatus = transaction.status

    // Update transaction record
    await ctx.db.patch(transaction._id, {
      status: args.status,
      resultCode: args.status === "success" ? "0" : "1",
      resultDesc: args.status,
      feedback: feedback.message,
      feedbackType: feedback.type,
      updatedAt: Date.now(),
    })

    console.log(
      `[Paystack Transaction] Updated ${transaction._id}: status=${args.status}, feedback="${feedback.message}"`
    )

    // If successful, update wallet balance
    if (args.status === "success" && oldStatus !== "success" && args.amount && transaction.userId) {
      const userId = transaction.userId as Id<"users">;
      await updateWalletBalance(ctx, userId, args.amount, "add")
      console.log(`[Wallet] Credited with KES ${args.amount}`)

      if (transaction.userId && transaction.type === "deposit") {
        await notifyUser(ctx, {
          recipientUserId: transaction.userId,
          type: "payment",
          title: "Deposit successful",
          message: `${formatKes(args.amount)} has been added to your wallet.`,
          href: "/account",
          dedupeKey: `transaction-success:user:${transaction._id}`,
          metadata: {
            transactionId: transaction._id,
            amount: args.amount,
          },
        })
      }

      if (transaction.type === "deposit") {
        await notifyAdmins(ctx, {
          type: "payment",
          title: "New Paystack deposit",
          message: `${formatKes(args.amount)} was deposited${transaction.phone ? ` by ${transaction.phone}` : ""}.`,
          href: "/admin/payments",
          dedupeKey: `transaction-success:${transaction._id}`,
          metadata: {
            transactionId: transaction._id,
            amount: args.amount,
          },
        })
      }
    }

    return {
      transactionId: transaction._id,
      status: args.status,
      amount: transaction.amount,
      feedback: feedback.message,
      feedbackType: feedback.type,
    }
  },
})

/**
 * Get latest transaction for real-time status updates
 */
export const getLatestTransaction = query({
  args: {
    reference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.reference) {
      // Get the most recent transaction
      const transactions = await ctx.db
        .query("transactions")
        .order("desc")
        .take(1)

      if (transactions.length === 0) {
        return null
      }

      return formatTransaction(transactions[0])
    }

    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_checkoutRequestID", (q) => q.eq("checkoutRequestID", args.reference))
      .unique()

    if (!transaction) {
      return null
    }

    return formatTransaction(transaction)
  },
})

function formatTransaction(transaction: any) {
  return {
    _id: transaction._id,
    status: transaction.status,
    resultCode: transaction.resultCode,
    resultDesc: transaction.resultDesc,
    amount: transaction.amount,
    type: transaction.type,
    time: transaction.time,
    updatedAt: transaction.updatedAt,
    feedback: transaction.feedback,
    feedbackType: transaction.feedbackType,
    checkoutRequestID: transaction.checkoutRequestID,
  }
}

/**
 * Internal function to update wallet balance
 * Can be used by other mutations
 */
export async function updateWalletBalance(
  ctx: MutationCtx,
  userId: Id<"users">,
  amount: number,
  operation: "add" | "subtract"
): Promise<void> {
  const wallet = await ctx.db
    .query("wallets")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique()

  if (!wallet) {
    // Create wallet if doesn't exist
    await ctx.db.insert("wallets", {
      userId,
      balance: operation === "add" ? amount : 0,
    })
    return
  }

  const newBalance =
    operation === "add"
      ? wallet.balance + amount
      : Math.max(0, wallet.balance - amount)

  await ctx.db.patch(wallet._id, {
    balance: newBalance,
  })
}
