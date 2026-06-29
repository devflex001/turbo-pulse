/**
 * Paystack Transaction Verification
 * POST /api/paystack/verify
 *
 * Redis integration:
 *  1. Rate limiting — max 20 verify requests per IP per minute
 *     (clients retry this on payment confirmation screens)
 */

import { NextRequest, NextResponse } from "next/server"
import { initializePaystackService } from "@/lib/paystack-service"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"
import {
  rateLimit,
  RATE_LIMITS,
  applyRateLimitHeaders,
  rateLimitResponse,
  getClientIp,
} from "@/lib/rate-limit"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference } = body

    if (!reference) {
      return NextResponse.json(
        { message: "Reference is required" },
        { status: 400 }
      )
    }

    // ── Rate limiting — keyed by IP ──────────────────────────────────────────
    const ip = getClientIp(request)
    const rlResult = await rateLimit(
      "paystack-verify",
      ip,
      RATE_LIMITS.PAYSTACK_VERIFY
    )
    if (!rlResult.allowed) {
      return rateLimitResponse(rlResult) as NextResponse
    }

    // ── Verify with Paystack ─────────────────────────────────────────────────
    console.log(`[Paystack API] Verifying transaction: ${reference}`)
    const paystack = await initializePaystackService()
    const verification = await paystack.verifyTransaction(reference)

    if (!verification.status) {
      console.error(`[Paystack API] Verification failed: ${verification.message}`)
      const response = NextResponse.json(
        { message: "Failed to verify transaction", status: "failed" },
        { status: 400 }
      )
      applyRateLimitHeaders(response.headers, rlResult)
      return response
    }

    const paymentStatus = verification.data.status
    console.log(`[Paystack API] Verification result: ${paymentStatus}`)

    const transactionStatus =
      paymentStatus === "success"
        ? "success"
        : paymentStatus === "failed"
          ? "failed"
          : "pending"

    const amountInKES = verification.data.amount / 100

    // Update Convex — failure here is non-fatal (webhook may have already done it)
    try {
      await convex.mutation(api.paystack.updateTransactionStatus, {
        reference,
        status: transactionStatus,
        amount: amountInKES,
        authorizationCode: verification.data.authorization?.authorization_code,
        cardType: verification.data.authorization?.card_type,
      })
      console.log(`[Paystack API] Transaction status updated in database`)
    } catch (dbError) {
      console.warn(
        `[Paystack API] Could not update transaction (webhook may have done it):`,
        dbError
      )
    }

    const response = NextResponse.json(
      {
        success: true,
        status: transactionStatus,
        reference,
        amount: amountInKES,
        message:
          transactionStatus === "success"
            ? "Payment verified successfully"
            : transactionStatus === "failed"
              ? "Payment verification failed"
              : "Payment is being processed",
      },
      { status: 200 }
    )
    applyRateLimitHeaders(response.headers, rlResult)
    return response
  } catch (error) {
    console.error("[Paystack API] Verify error:", error)
    return NextResponse.json(
      { message: `Error: ${String(error)}`, status: "failed" },
      { status: 500 }
    )
  }
}
