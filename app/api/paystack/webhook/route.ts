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

    // Verify webhook signature — check DB config first, then env var
    const dbConfig = await convex.query(api.paystack.getConfig)
    const secretKey = dbConfig?.secretKey || process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      console.error("[Paystack Webhook] Secret key not configured")
      return NextResponse.json(
        { message: "Secret key not configured" },
        { status: 500 }
      )
    }

    // Verify webhook signature
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
      const { reference, amount, reason, gateway_response, display_text } = data

      console.log(`[Paystack Webhook] Processing failed charge: ${reference}`)
      console.log(`[Paystack Webhook] Reason: ${reason}`)
      console.log(`[Paystack Webhook] Gateway response: ${gateway_response}`)
      console.log(`[Paystack Webhook] Display text: ${display_text}`)

      try {
        // Determine detailed error message
        let errorDetail = reason || gateway_response || display_text || "Payment failed"

        // Map common errors to user-friendly messages
        const errorMapping: Record<string, string> = {
          Declined: "Card declined. Please check your card details.",
          "Approved by default": "Transaction pending. Please check with your bank.",
          "Do not honour": "Bank declined this transaction.",
          "No response from issuer": "No response from bank. Please try again.",
          "Expired card": "Your card has expired.",
          "Possible fraud": "Transaction flagged as possible fraud.",
          "Invalid transaction": "Invalid transaction details.",
          "Transaction timeout":
            "Transaction timed out. User did not complete the payment.",
          "User cancelled": "Payment cancelled by user.",
          "Insufficient funds": "Insufficient funds in your account.",
          "Restricted card": "Your card is restricted.",
          "Lost card": "Your card has been reported as lost.",
          "Stolen card": "Your card has been reported as stolen.",
          "Not permitted": "This transaction is not permitted on your card account.",
          "No Pin was entered": "No PIN entered. Payment cancelled.",
          timeout: "Payment request timed out. User did not enter PIN.",
        }

        // Find matching error message
        for (const [key, value] of Object.entries(errorMapping)) {
          if (
            (reason && reason.toLowerCase().includes(key.toLowerCase())) ||
            (gateway_response &&
              gateway_response.toLowerCase().includes(key.toLowerCase())) ||
            (display_text && display_text.toLowerCase().includes(key.toLowerCase()))
          ) {
            errorDetail = value
            break
          }
        }

        const result = await convex.mutation(api.paystack.updateTransactionStatus, {
          reference,
          status: "failed",
          amount: amount ? amount / 100 : undefined,
          errorDetail,
          errorCode: reason || "unknown",
          gatewayResponse: gateway_response,
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
