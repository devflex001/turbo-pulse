/**
 * Internal cache invalidation webhook
 * POST /api/cache/invalidate
 *
 * Called by Convex actions/mutations (via internal HTTP fetch) after
 * scraper runs complete or significant data mutations occur.
 *
 * Protected by a shared secret — never expose this endpoint publicly
 * without the secret header.
 *
 * Payload shape:
 *   { scope: "sports" }                          — clears all match/competition caches
 *   { scope: "match", sourceMatchId: string }    — clears one match
 *   { scope: "odds", sourceMatchId, marketKey }  — clears one market's odds
 *   { scope: "admin-stats" }                     — clears admin stats
 *   { scope: "all" }                             — nuclear wipe (use with care)
 */

import { NextRequest, NextResponse } from "next/server"
import {
  invalidateSportsData,
  invalidateMatch,
  invalidateMatchOdds,
  invalidateAdminStats,
  invalidateAll,
} from "@/lib/cache-invalidation"

type InvalidatePayload =
  | { scope: "sports" }
  | { scope: "match"; sourceMatchId: string }
  | { scope: "odds"; sourceMatchId: string; marketKey: string }
  | { scope: "admin-stats" }
  | { scope: "all" }

export async function POST(request: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const secret = process.env.CACHE_INVALIDATION_SECRET
  if (!secret) {
    console.error("[CacheInvalidate] CACHE_INVALIDATION_SECRET not configured")
    return NextResponse.json({ message: "Server misconfiguration" }, { status: 500 })
  }

  const authHeader = request.headers.get("x-cache-invalidation-secret")
  if (!authHeader || authHeader !== secret) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  // ── Parse payload ────────────────────────────────────────────────────────
  let payload: InvalidatePayload
  try {
    payload = (await request.json()) as InvalidatePayload
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 })
  }

  if (!payload?.scope) {
    return NextResponse.json({ message: "Missing required field: scope" }, { status: 400 })
  }

  // ── Dispatch ─────────────────────────────────────────────────────────────
  try {
    switch (payload.scope) {
      case "sports": {
        await invalidateSportsData()
        return NextResponse.json({ success: true, scope: "sports" })
      }

      case "match": {
        if (!payload.sourceMatchId) {
          return NextResponse.json(
            { message: "Missing required field: sourceMatchId" },
            { status: 400 }
          )
        }
        await invalidateMatch(payload.sourceMatchId)
        return NextResponse.json({
          success: true,
          scope: "match",
          sourceMatchId: payload.sourceMatchId,
        })
      }

      case "odds": {
        if (!payload.sourceMatchId || !payload.marketKey) {
          return NextResponse.json(
            { message: "Missing required fields: sourceMatchId, marketKey" },
            { status: 400 }
          )
        }
        await invalidateMatchOdds(payload.sourceMatchId, payload.marketKey)
        return NextResponse.json({
          success: true,
          scope: "odds",
          sourceMatchId: payload.sourceMatchId,
          marketKey: payload.marketKey,
        })
      }

      case "admin-stats": {
        await invalidateAdminStats()
        return NextResponse.json({ success: true, scope: "admin-stats" })
      }

      case "all": {
        const count = await invalidateAll()
        return NextResponse.json({ success: true, scope: "all", keysDeleted: count })
      }

      default: {
        return NextResponse.json(
          { message: `Unknown scope: ${(payload as { scope: string }).scope}` },
          { status: 400 }
        )
      }
    }
  } catch (err) {
    console.error("[CacheInvalidate] Error:", err)
    return NextResponse.json(
      { message: "Cache invalidation failed", error: String(err) },
      { status: 500 }
    )
  }
}

// Health probe — confirms the endpoint is reachable without triggering invalidation
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "cache/invalidate" })
}
