import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

/**
 * Paystack webhook handler
 * Receives payment notifications from Paystack
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    if (!signature) {
      console.error("[Paystack Webhook] No signature provided")
      return NextResponse.json(
        { message: "No signature provided" },
        { status: 403 }
      )
    }

    // Verify webhook signature
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      console.error("[Paystack Webhook] Secret key not configured")
      return NextResponse.json(
        { message: "Secret key not configured" },
        { status: 500 }
      )
    }

    const hash = crypto.createHmac("sha512", secretKey).update(body).digest("hex")

    if (hash !== signature) {
      console.error("[Paystack Webhook] Invalid signature")
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 403 }
      )
    }

    const event = JSON.parse(body)
    console.log("[Paystack Webhook] Event received:", event.event)

    // Handle charge.success event
    if (event.event === "charge.success") {
      const { data } = event
      const { reference, amount, customer, authorization } = data

      console.log(`[Paystack Webhook] Processing successful charge: ${reference}`)
      console.log(`[Paystack Webhook] Amount: ${amount / 100} (in cents: ${amount})`)

      // Convert amount from cents to KES
      const amountInKES = amount / 100

      try {
        // Update transaction status in database
        const result = await convex.mutation(api.paystack.updateTransactionStatus, {
          reference,
          status: "success",
          amount: amountInKES,
          authorizationCode: authorization?.authorization_code,
          cardType: authorization?.card_type,
        })

        console.log(`[Paystack Webhook] Transaction updated:`, result)

        return NextResponse.json({
          success: true,
          message: "Webhook processed successfully",
          transactionId: result.transactionId,
        })
      } catch (error) {
        console.error("[Paystack Webhook] Error updating transaction:", error)
        return NextResponse.json(
          { success: false, message: `Error updating transaction: ${String(error)}` },
          { status: 500 }
        )
      }
    }

    // Handle charge.failed event
    if (event.event === "charge.failed") {
      const { data } = event
      const { reference, amount, reason } = data

      console.log(`[Paystack Webhook] Processing failed charge: ${reference}`)
      console.log(`[Paystack Webhook] Reason: ${reason}`)

      try {
        const result = await convex.mutation(api.paystack.updateTransactionStatus, {
          reference,
          status: "failed",
          amount: amount / 100,
        })

        console.log(`[Paystack Webhook] Failed transaction recorded:`, result)

        return NextResponse.json({
          success: true,
          message: "Failed charge recorded",
          transactionId: result.transactionId,
        })
      } catch (error) {
        console.error("[Paystack Webhook] Error recording failed charge:", error)
        return NextResponse.json(
          { success: false, message: `Error recording failed charge: ${String(error)}` },
          { status: 500 }
        )
      }
    }

    // Log unhandled events
    console.log(`[Paystack Webhook] Unhandled event: ${event.event}`)

    return NextResponse.json({
      success: true,
      message: "Event received but not processed",
    })
  } catch (error) {
    console.error("[Paystack Webhook] Error:", error)
    return NextResponse.json(
      { message: `Error: ${String(error)}` },
      { status: 500 }
    )
  }
}
