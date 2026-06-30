import { mutation, query, action } from "./_generated/server"
import { v } from "convex/values"

/**
 * Get current Daraja configuration
 * Checks both database and environment variables
 */
export const getConfig = query(async (ctx) => {
  // Try to get config from database
  const dbConfig = await ctx.db
    .query("daraja_config")
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
    consumerKey: process.env.MPESA_CONSUMER_KEY || "",
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || "",
    businessCode: process.env.MPESA_BUSINESS_CODE || "174379",
    passkey: process.env.MPESA_PASSKEY || "",
    callbackUrl: process.env.MPESA_CALLBACK_URL || "",
    timeoutUrl: process.env.MPESA_TIMEOUT_URL || "",
    shortcode: process.env.MPESA_SHORTCODE || "174379",
    initiatorName: process.env.MPESA_INITIATOR_NAME || "testapi",
    initiatorPassword: process.env.MPESA_INITIATOR_PASSWORD || "",
    isProduction: false,
    isEnabled: true,
    useEnvVariables: true,
    source: "environment",
  }
})

/**
 * Get all saved configurations
 */
export const getAllConfigs = query(async (ctx) => {
  return await ctx.db.query("daraja_config").collect()
})

/**
 * Save new Daraja configuration
 */
export const saveConfig = mutation({
  args: {
    consumerKey: v.string(),
    consumerSecret: v.string(),
    businessCode: v.string(),
    passkey: v.string(),
    callbackUrl: v.string(),
    timeoutUrl: v.string(),
    shortcode: v.string(),
    initiatorName: v.string(),
    initiatorPassword: v.string(),
    isProduction: v.boolean(),
    configName: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { requireAdmin } = await import("./auth/authorization")
    const admin = await requireAdmin(ctx, args.userId)

    // Disable all other configs
    const existingConfigs = await ctx.db.query("daraja_config").collect()
    for (const config of existingConfigs) {
      await ctx.db.patch(config._id, { isEnabled: false })
    }

    // Save new config as active
    const newConfigId = await ctx.db.insert("daraja_config", {
      consumerKey: args.consumerKey,
      consumerSecret: args.consumerSecret,
      businessCode: args.businessCode,
      passkey: args.passkey,
      callbackUrl: args.callbackUrl,
      timeoutUrl: args.timeoutUrl,
      shortcode: args.shortcode,
      initiatorName: args.initiatorName,
      initiatorPassword: args.initiatorPassword,
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
          resourceType: "daraja_config",
          resourceDescription: "M-Pesa Daraja configuration saved",
          details: {
            newValue: `Environment: ${args.isProduction ? "Production" : "Sandbox"}, Shortcode: ${args.shortcode}`,
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

    const existingConfigs = await ctx.db.query("daraja_config").collect()
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
          resourceType: "daraja_config",
          resourceDescription: "M-Pesa Daraja switched to environment variables",
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
    configId: v.id("daraja_config"),
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
    const existingConfigs = await ctx.db.query("daraja_config").collect()
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
          resourceType: "daraja_config",
          resourceDescription: "M-Pesa Daraja configuration activated",
          details: {
            newValue: `Shortcode: ${configToActivate.shortcode}, Environment: ${configToActivate.isProduction ? "Production" : "Sandbox"}`,
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
    configId: v.id("daraja_config"),
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
          resourceType: "daraja_config",
          resourceDescription: "M-Pesa Daraja configuration deleted",
          details: {
            previousValue: `Shortcode: ${configToDelete.shortcode}`,
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
    consumerKey: v.string(),
    consumerSecret: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const baseUrl = "https://sandbox.safaricom.co.ke"
      const auth = Buffer.from(
        `${args.consumerKey}:${args.consumerSecret}`
      ).toString("base64")

      const response = await fetch(
        `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      )

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
