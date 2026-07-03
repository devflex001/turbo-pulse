/**
 * Paystack Transaction Initialization
 * POST /api/paystack/initialize
 *
 * Redis integration:
 *  1. Rate limiting  — max 10 init requests per IP per minute
 *  2. Idempotency    — same phone+amount within 5 min returns the cached
 *     authorization_url instead of creating a duplicate Paystack transaction
 */

import { NextRequest, NextResponse } from "next/server"
import { initializePaystackService } from "@/lib/paystack-service"
import {
  rateLimit,
  RATE_LIMITS,
  applyRateLimitHeaders,
  rateLimitResponse,
  getClientIp,
} from "@/lib/rate-limit"
import { setIdempotencyKey, getIdempotencyKey } from "@/lib/cache"
import { CacheKeys, TTL } from "@/lib/cache-keys"

interface IdempotencyRecord {
  reference: string
  authorization_url: string
  access_code: string
  cachedAt: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, amount, metadata } = body

    // ── Input validation ────────────────────────────────────────────────────
    if (!phone || !amount) {
      return NextResponse.json(
        { message: "Phone number and amount are required" },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { message: "Amount must be greater than 0" },
        { status: 400 }
      )
    }

    // ── Rate limiting — keyed by IP ──────────────────────────────────────────
    const ip = getClientIp(request)
    const rlResult = await rateLimit("paystack-init", ip, RATE_LIMITS.PAYSTACK_INIT)
    if (!rlResult.allowed) {
      return rateLimitResponse(rlResult) as NextResponse
    }

    // ── Idempotency — same phone+amount returns cached init within 5 min ────
    const idempotencyKey = CacheKeys.paystackIdempotency(phone, amount)
    const existing = await getIdempotencyKey<IdempotencyRecord>(idempotencyKey)

    if (existing) {
      console.info(
        `[Paystack] Returning cached init for ${phone} / ${amount}`
      )
      const response = NextResponse.json(
        {
          success: true,
          reference: existing.reference,
          authorization_url: existing.authorization_url,
          access_code: existing.access_code,
          cached: true,
        },
        { status: 200 }
      )
      applyRateLimitHeaders(response.headers, rlResult)
      return response
    }

    // ── Initialize Paystack transaction ──────────────────────────────────────
    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const paystack = await initializePaystackService()
    const placeholderEmail = `phone-${phone}@bet-flow.local`

    const paystackResponse = await paystack.initializeTransaction(
      placeholderEmail,
      amount,
      reference,
      metadata || {}
    )

    if (!paystackResponse.status) {
      return NextResponse.json(
        { message: "Failed to initialize Paystack transaction" },
        { status: 400 }
      )
    }

    // Cache the successful init to prevent duplicate transactions on retry
    const record: IdempotencyRecord = {
      reference,
      authorization_url: paystackResponse.data.authorization_url,
      access_code: paystackResponse.data.access_code,
      cachedAt: Date.now(),
    }
    await setIdempotencyKey(idempotencyKey, record, TTL.PAYMENT_IDEMPOTENCY)

    const response = NextResponse.json(
      {
        success: true,
        reference,
        authorization_url: paystackResponse.data.authorization_url,
        access_code: paystackResponse.data.access_code,
      },
      { status: 200 }
    )
    applyRateLimitHeaders(response.headers, rlResult)
    return response
  } catch (error) {
    console.error("[Paystack API] Initialize error:", error)
    return NextResponse.json(
      { message: `Error: ${String(error)}` },
      { status: 500 }
    )
  }
}
