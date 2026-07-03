import { v } from "convex/values"
import { query, mutation, action } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import { requireAdmin } from "./auth/authorization"

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

export type IPLocation = {
  country: string
  countryCode: string
  state?: string
  city?: string
  timezone?: string
  latitude?: number
  longitude?: number
  org?: string // ISP / organization
}

export type DeviceInfo = {
  userAgent: string
  browserName?: string
  browserVersion?: string
  osName?: string
  osVersion?: string
  deviceType?: string
}

// ────────────────────────────────────────────────────────────────────────────
// ACTIONS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get IP geolocation and device info from ipapi.co
 * Called when tracking a visitor
 */
export const getIPLocationAndDevice = action({
  args: {
    ip: v.string(),
    userAgent: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get IP geolocation
      const geoResponse = await fetch(`https://ipapi.co/${args.ip}/json/`)
      const geoData = await geoResponse.json()

      // Parse user agent for device info (basic parsing)
      const userAgent = args.userAgent.toLowerCase()
      let deviceType = "unknown"
      let osName = "unknown"
      let browserName = "unknown"

      // Detect device type
      if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
        deviceType = "mobile"
      } else if (/tablet|ipad|android/i.test(userAgent)) {
        deviceType = "tablet"
      } else {
        deviceType = "desktop"
      }

      // Detect OS
      if (/windows/i.test(userAgent)) osName = "Windows"
      else if (/mac/i.test(userAgent)) osName = "macOS"
      else if (/android/i.test(userAgent)) osName = "Android"
      else if (/iphone|ios/i.test(userAgent)) osName = "iOS"
      else if (/linux/i.test(userAgent)) osName = "Linux"

      // Detect browser
      if (/chrome/i.test(userAgent)) browserName = "Chrome"
      else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent))
        browserName = "Safari"
      else if (/firefox/i.test(userAgent)) browserName = "Firefox"
      else if (/edge/i.test(userAgent)) browserName = "Edge"
      else if (/opera/i.test(userAgent)) browserName = "Opera"

      // Detect bot
      const botPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /googlebot/i,
      ]
      const isBot = botPatterns.some((pattern) => pattern.test(userAgent))

      return {
        location: {
          country: geoData.country_name || "Unknown",
          countryCode: geoData.country_code || "XX",
          state: geoData.region || undefined,
          city: geoData.city || undefined,
          timezone: geoData.timezone || undefined,
          latitude: geoData.latitude || undefined,
          longitude: geoData.longitude || undefined,
          org: geoData.org || undefined,
        },
        device: {
          userAgent: args.userAgent,
          browserName,
          osName,
          deviceType,
        },
        isBot,
      }
    } catch (error) {
      console.error("Error fetching IP location:", error)
      return {
        location: {
          country: "Unknown",
          countryCode: "XX",
        },
        device: {
          userAgent: args.userAgent,
          deviceType: "unknown",
        },
        isBot: false,
      }
    }
  },
})

// ────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Track a visitor to the homepage
 * Called from middleware or client-side on page load
 * Upserts visitor record to avoid duplicates - increments visit count
 */
export const trackVisitor = mutation({
  args: {
    ip: v.string(),
    userAgent: v.string(),
    userId: v.optional(v.id("users")),
    location: v.object({
      country: v.string(),
      countryCode: v.string(),
      state: v.optional(v.string()),
      city: v.optional(v.string()),
      timezone: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      org: v.optional(v.string()),
    }),
    device: v.object({
      userAgent: v.string(),
      browserName: v.optional(v.string()),
      browserVersion: v.optional(v.string()),
      osName: v.optional(v.string()),
      osVersion: v.optional(v.string()),
      deviceType: v.optional(v.string()),
    }),
    isBot: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Skip bot tracking
    if (args.isBot) {
      return { success: false, reason: "bot_skipped" }
    }

    try {
      // Check if this IP already exists
      const existingVisitor = await ctx.db
        .query("visitors")
        .withIndex("by_ip", (q) => q.eq("ip", args.ip))
        .first()

      const now = Date.now()

      if (existingVisitor) {
        // Update existing visitor - increment visit count
        const currentCount = existingVisitor.visitCount || 1
        const firstVisit = existingVisitor.firstVisitedAt || existingVisitor.visitedAt || now

        await ctx.db.patch(existingVisitor._id, {
          visitCount: currentCount + 1,
          firstVisitedAt: firstVisit,
          lastVisitedAt: now,
          // Update device info in case they switched device/browser
          device: args.device,
          location: args.location,
          userId: args.userId || existingVisitor.userId,
        })

        return { success: true, visitId: existingVisitor._id, isNew: false }
      } else {
        // Create new visitor record
        const visitId = await ctx.db.insert("visitors", {
          ip: args.ip,
          userId: args.userId,
          location: args.location,
          device: args.device,
          visitCount: 1,
          firstVisitedAt: now,
          lastVisitedAt: now,
          isBot: args.isBot,
        })

        return { success: true, visitId, isNew: true }
      }
    } catch (error) {
      console.error("Error tracking visitor:", error)
      return { success: false, reason: "tracking_failed" }
    }
  },
})

/**
 * Update user's IP tracking info when they log in
 */
export const updateUserIPTracking = mutation({
  args: {
    userId: v.id("users"),
    ip: v.string(),
    location: v.object({
      country: v.string(),
      countryCode: v.string(),
      state: v.optional(v.string()),
      city: v.optional(v.string()),
      timezone: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      org: v.optional(v.string()),
    }),
    device: v.object({
      userAgent: v.string(),
      browserName: v.optional(v.string()),
      browserVersion: v.optional(v.string()),
      osName: v.optional(v.string()),
      osVersion: v.optional(v.string()),
      deviceType: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ip_tracking")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        ip: args.ip,
        location: args.location,
        device: args.device,
        lastSeen: Date.now(),
      })
    } else {
      await ctx.db.insert("ip_tracking", {
        ip: args.ip,
        userId: args.userId,
        location: args.location,
        device: args.device,
        lastSeen: Date.now(),
        createdAt: Date.now(),
        isBot: false,
      })
    }

    return { success: true }
  },
})

// ────────────────────────────────────────────────────────────────────────────
// QUERIES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get user's IP tracking info
 * Admin-only - includes IP and location data
 */
export const getUserIPInfo = query({
  args: {
    userId: v.id("users"),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Require admin
    await requireAdmin(ctx, args.adminUserId)

    const tracking = await ctx.db
      .query("ip_tracking")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first()

    return tracking || null
  },
})

/**
 * List recent visitors with pagination
 * Admin-only query
 */
export const listVisitors = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
      id: v.optional(v.number()),
    }),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Require admin
    await requireAdmin(ctx, args.adminUserId)

    const paginatedVisitors = await ctx.db
      .query("visitors")
      .withIndex("by_lastVisitedAt", (q) => q.gte("lastVisitedAt", 0))
      .order("desc")
      .paginate(args.paginationOpts)

    return {
      page: paginatedVisitors.page,
      isDone: paginatedVisitors.isDone,
      continueCursor: paginatedVisitors.continueCursor,
    }
  },
})

/**
 * Get visitors for a specific date range
 * Admin-only query
 */
export const getVisitorsByDateRange = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Require admin
    await requireAdmin(ctx, args.adminUserId)

    const visitors = await ctx.db
      .query("visitors")
      .withIndex("by_lastVisitedAt", (q) =>
        q.gte("lastVisitedAt", args.startTime).lte("lastVisitedAt", args.endTime)
      )
      .order("desc")
      .take(1000) // Limit to prevent huge responses

    return visitors
  },
})

/**
 * Get all tracked users with their IP info
 * Admin-only - for display in admin users panel
 */
export const getTrackedUsers = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
      id: v.optional(v.number()),
    }),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Require admin
    await requireAdmin(ctx, args.adminUserId)

    const tracked = await ctx.db
      .query("ip_tracking")
      .order("desc")
      .paginate(args.paginationOpts)

    return {
      page: tracked.page,
      isDone: tracked.isDone,
      continueCursor: tracked.continueCursor,
    }
  },
})

/**
 * Get visitor count for today
 */
export const getTodayVisitorCount = query({
  args: {
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Require admin
    await requireAdmin(ctx, args.adminUserId)

    const now = Date.now()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const visitors = await ctx.db
      .query("visitors")
      .withIndex("by_lastVisitedAt", (q) =>
        q.gte("lastVisitedAt", todayStart.getTime())
      )
      .take(1000) // This is approximate, real implementation would use a counter table

    return {
      count: visitors.length,
      totalVisits: visitors.reduce((sum, v) => sum + (v.visitCount || 1), 0),
      timestamp: now,
    }
  },
})

/**
 * Get visitor statistics
 */
export const getVisitorStats = query({
  args: {
    daysBack: v.optional(v.number()),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Require admin
    await requireAdmin(ctx, args.adminUserId)

    const daysBack = args.daysBack || 7
    const now = Date.now()
    const startTime = now - daysBack * 24 * 60 * 60 * 1000

    const visitors = await ctx.db
      .query("visitors")
      .withIndex("by_lastVisitedAt", (q) => q.gte("lastVisitedAt", startTime))
      .take(10000)

    // Group by country
    const byCountry: Record<string, number> = {}
    const byDevice: Record<string, number> = {}
    const byBrowser: Record<string, number> = {}

    let totalVisits = 0

    visitors.forEach((v) => {
      totalVisits += v.visitCount || 1
      byCountry[v.location.country] = (byCountry[v.location.country] || 0) + 1
      const device = v.device.deviceType || "unknown"
      byDevice[device] = (byDevice[device] || 0) + 1
      const browser = v.device.browserName || "unknown"
      byBrowser[browser] = (byBrowser[browser] || 0) + 1
    })

    return {
      uniqueVisitors: visitors.length,
      totalVisits,
      byCountry,
      byDevice,
      byBrowser,
      period: { daysBack, startTime, now },
    }
  },
})
