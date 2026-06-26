/**
 * M-Pesa Transaction Status Query API Route
 * GET /api/mpesa/query-status
 *
 * Redis integration:
 *  1. Rate limiting — max 30 queries per IP per minute
 *  2. Response cache — cache Safaricom's status response for 10 seconds
 *     so polling UIs don't hammer the Safaricom API on every render cycle
 */

import { NextRequest, NextResponse } from "next/server"
import { initializeMPesaService } from "@/lib/mpesa-service"
import {
  rateLimit,
  RATE_LIMITS,
  applyRateLimitHeaders,
  rateLimitResponse,
  getClientIp,
} from "@/lib/rate-limit"
import { cacheGet, cacheSet } from "@/lib/cache"
import { CacheKeys, TTL } from "@/lib/cache-keys"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const checkoutRequestID = searchParams.get("checkoutRequestID")
    const merchantRequestID = searchParams.get("merchantRequestID")

    if (!checkoutRequestID || !merchantRequestID) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      )
    }

    // ── Rate limiting — keyed by IP ──────────────────────────────────────────
    const ip = getClientIp(request)
    const rlResult = await rateLimit("mpesa-status", ip, RATE_LIMITS.MPESA_STATUS)
    if (!rlResult.allowed) {
      return rateLimitResponse(rlResult) as NextResponse
    }

    // ── Cache check — avoid hammering Safaricom on every poll ───────────────
    const cacheKey = CacheKeys.mpesaStatus(checkoutRequestID)
    const cached = await cacheGet<Record<string, unknown>>(cacheKey)

    if (cached) {
      const response = NextResponse.json(
        { ...cached, cached: true },
        { status: 200 }
      )
      applyRateLimitHeaders(response.headers, rlResult)
      return response
    }

    // ── Query Safaricom ──────────────────────────────────────────────────────
    const mpesa = initializeMPesaService(false)
    const statusResponse = await mpesa.queryTransactionStatus(
      merchantRequestID,
      checkoutRequestID
    )

    // Only cache non-pending responses — pending status changes frequently
    const responseData = statusResponse as unknown as Record<string, unknown> | undefined
    const isPending =
      !responseData?.ResultCode ||
      responseData.ResultCode === "1032" || // Request cancelled by user
      responseData.ResultCode === "" // Still processing

    if (!isPending && responseData) {
      await cacheSet(cacheKey, responseData, {
        ttl: TTL.MPESA_STATUS,
        tag: "mpesa-status",
      })
    }

    const response = NextResponse.json(statusResponse, { status: 200 })
    applyRateLimitHeaders(response.headers, rlResult)
    return response
  } catch (error) {
    console.error("[M-Pesa Status] Query error:", error)
    const message =
      error instanceof Error ? error.message : "Failed to query transaction status"
    return NextResponse.json({ message }, { status: 500 })
  }
}
