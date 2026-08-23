import { mutation, query, action, MutationCtx, QueryCtx, ActionCtx } from "./_generated/server"
import { v } from "convex/values"
import { requireAdmin } from "./auth/authorization"
import { logAdminActionInternal } from "./audit/logs"
import { getAdminSessionByTokenInternal } from "./admin/sessions"

/**
 * Get current Daraja configuration
 * Checks both database and environment variables
 */
export const getConfig = query(async (ctx: QueryCtx) => {
  // Try to get enabled config from database
  const allConfigs = await ctx.db.query("daraja_config").collect()

  console.log(`[Daraja] Found ${allConfigs.length} configs in database`);
  allConfigs.forEach((config: any, idx: number) => {
    console.log(`  Config ${idx}: isEnabled=${config.isEnabled}, useEnvVariables=${config.useEnvVariables}, source=DB`);
  });

  const dbConfig = allConfigs.find((config: any) => config.isEnabled === true)

  if (dbConfig && !dbConfig.useEnvVariables) {
    console.log(`[Daraja] Using enabled DB config`);
    console.log(`  Consumer Key: ${dbConfig.consumerKey ? `${dbConfig.consumerKey.substring(0, 5)}...${dbConfig.consumerKey.substring(dbConfig.consumerKey.length - 5)}` : "EMPTY"} (length: ${dbConfig.consumerKey?.length || 0})`);
    console.log(`  Consumer Secret: ${dbConfig.consumerSecret ? `${dbConfig.consumerSecret.substring(0, 5)}...${dbConfig.consumerSecret.substring(dbConfig.consumerSecret.length - 5)}` : "EMPTY"} (length: ${dbConfig.consumerSecret?.length || 0})`);
    return {
      ...dbConfig,
      source: "database",
    }
  }

  // If there's any config in DB, use the first one even if not marked enabled
  if (allConfigs.length > 0 && !allConfigs[0].useEnvVariables) {
    console.log(`[Daraja] Using first DB config (not enabled but available)`);
    console.log(`  Consumer Key: ${allConfigs[0].consumerKey ? `${allConfigs[0].consumerKey.substring(0, 5)}...${allConfigs[0].consumerKey.substring(allConfigs[0].consumerKey.length - 5)}` : "EMPTY"} (length: ${allConfigs[0].consumerKey?.length || 0})`);
    console.log(`  Consumer Secret: ${allConfigs[0].consumerSecret ? `${allConfigs[0].consumerSecret.substring(0, 5)}...${allConfigs[0].consumerSecret.substring(allConfigs[0].consumerSecret.length - 5)}` : "EMPTY"} (length: ${allConfigs[0].consumerSecret?.length || 0})`);
    return {
      ...allConfigs[0],
      source: "database",
    }
  }

  // Fall back to environment variables
  console.log(`[Daraja] No DB config found, falling back to environment variables`);
  console.log(`  MPESA_CONSUMER_KEY: ${process.env.MPESA_CONSUMER_KEY ? `${process.env.MPESA_CONSUMER_KEY.substring(0, 5)}...` : "EMPTY"}`);
  console.log(`  MPESA_CONSUMER_SECRET: ${process.env.MPESA_CONSUMER_SECRET ? `${process.env.MPESA_CONSUMER_SECRET.substring(0, 5)}...` : "EMPTY"}`);

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
export const getAllConfigs = query(async (ctx: QueryCtx) => {
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
  handler: async (ctx: MutationCtx, args) => {
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
  handler: async (ctx: MutationCtx, args) => {
    const admin = await requireAdmin(ctx, args.userId)

    const existingConfigs = await ctx.db.query("daraja_config").collect()
    for (const config of existingConfigs) {
      await ctx.db.patch(config._id, { isEnabled: false })
    }

    // Log the action
    if (args.sessionToken) {
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
  handler: async (ctx: MutationCtx, args) => {
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
  handler: async (ctx: MutationCtx, args) => {
    const admin = await requireAdmin(ctx, args.userId)

    const configToDelete = await ctx.db.get(args.configId)
    if (!configToDelete) {
      throw new Error("Configuration not found")
    }

    await ctx.db.delete(args.configId)

    // Log the action
    if (args.sessionToken) {
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
  handler: async (ctx: ActionCtx, args) => {
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

/**
 * Update callback URLs in all configs
 */
export const updateCallbackUrls = mutation({
  args: {
    callbackUrl: v.string(),
    timeoutUrl: v.string(),
    userId: v.optional(v.id("users")),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const admin = await requireAdmin(ctx, args.userId)

    const allConfigs = await ctx.db.query("daraja_config").collect()

    for (const config of allConfigs) {
      await ctx.db.patch(config._id, {
        callbackUrl: args.callbackUrl,
        timeoutUrl: args.timeoutUrl,
        updatedAt: Date.now(),
        updatedBy: admin.phone ?? admin._id.toString(),
      })
    }

    if (args.sessionToken) {
      const adminSession = await getAdminSessionByTokenInternal(ctx, args.sessionToken)
      if (adminSession) {
        await logAdminActionInternal(ctx, {
          adminName: adminSession.adminName,
          userId: admin._id,
          actionType: "update_payment_gateway_config",
          resourceType: "daraja_config",
          resourceDescription: "M-Pesa callback URLs updated",
          details: {
            newValue: `Callback: ${args.callbackUrl}, Timeout: ${args.timeoutUrl}`,
          },
        })
      }
    }

    return { success: true, message: "Callback URLs updated" }
  },
})
