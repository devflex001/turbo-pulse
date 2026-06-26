/**
 * M-Pesa STK Push Initiation API Route
 * POST /api/mpesa/initiate-stk
 *
 * Redis integration:
 *  1. Rate limiting — max 5 STK pushes per phone number per minute
 *  2. Idempotency   — deduplicate identical phone+amount requests within 5 minutes
 *     so a network retry from the client doesn't fire two STK pushes
 */

import { NextRequest, NextResponse } from "next/server"
import { initializeMPesaService } from "@/lib/mpesa-service"
import {
  rateLimit,
  RATE_LIMITS,
  applyRateLimitHeaders,
  rateLimitResponse,
} from "@/lib/rate-limit"
import { setIdempotencyKey, getIdempotencyKey } from "@/lib/cache"
import { CacheKeys, TTL } from "@/lib/cache-keys"

interface IdempotencyRecord {
  checkoutRequestID: string
  merchantRequestID: string
  responseCode: string
  customerMessage: string
  cachedAt: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, amount, accountReference, transactionDesc } = body

    // ── Input validation ────────────────────────────────────────────────────
    if (!phone || !amount || !accountReference) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { message: "Invalid amount" },
        { status: 400 }
      )
    }

    // ── Rate limiting — keyed by phone number ────────────────────────────────
    const rlResult = await rateLimit("mpesa-stk", phone, RATE_LIMITS.MPESA_STK)
    if (!rlResult.allowed) {
      return rateLimitResponse(rlResult) as NextResponse
    }

    // ── Idempotency — same phone+amount within 5 minutes returns cached result
    const idempotencyKey = CacheKeys.mpesaIdempotency(phone, amount)
    const existing = await getIdempotencyKey<IdempotencyRecord>(idempotencyKey)

    if (existing) {
      console.info(
        `[M-Pesa STK] Returning cached response for ${phone} / ${amount}`
      )
      const response = NextResponse.json(
        {
          ...existing,
          cached: true,
          message: "Duplicate request — returning cached STK response",
        },
        { status: 200 }
      )
      applyRateLimitHeaders(response.headers, rlResult)
      return response
    }

    // ── Initiate STK Push ────────────────────────────────────────────────────
    const mpesa = initializeMPesaService(false)
    const stkResponse = await mpesa.initiateSTKPush(
      phone,
      amount,
      accountReference,
      transactionDesc || `Payment for ${accountReference}`
    )

    // Cache successful STK responses to prevent duplicate pushes on retry
    const stkAny = stkResponse as unknown as Record<string, unknown>
    const stkCode = stkAny?.ResponseCode
    if (stkCode === "0") {
      const record: IdempotencyRecord = {
        checkoutRequestID: String(stkAny.CheckoutRequestID ?? ""),
        merchantRequestID: String(stkAny.MerchantRequestID ?? ""),
        responseCode: String(stkCode),
        customerMessage: String(stkAny.CustomerMessage ?? ""),
        cachedAt: Date.now(),
      }
      await setIdempotencyKey(idempotencyKey, record, TTL.PAYMENT_IDEMPOTENCY)
    }

    const response = NextResponse.json(stkResponse, { status: 200 })
    applyRateLimitHeaders(response.headers, rlResult)
    return response
  } catch (error) {
    console.error("[M-Pesa STK] Initiation error:", error)
    const message =
      error instanceof Error ? error.message : "Failed to initiate STK push"
    return NextResponse.json({ message }, { status: 500 })
  }
}
