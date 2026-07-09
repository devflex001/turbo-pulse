import { NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

/**
 * Paystack Verification Endpoint
 * POST /api/paystack/verify
 *
 * Verifies a Paystack transaction and captures detailed error information
 * This is called after the Paystack payment popup closes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference } = body

    if (!reference) {
      return NextResponse.json(
        { success: false, message: "No reference provided" },
        { status: 400 }
      )
    }

    console.log(`[Paystack Verify] Verifying reference: ${reference}`)

    // Get Paystack config
    const dbConfig = await convex.query(api.paystack.getConfig)
    const secretKey = dbConfig?.secretKey || process.env.PAYSTACK_SECRET_KEY

    if (!secretKey) {
      console.error("[Paystack Verify] Secret key not configured")
      return NextResponse.json(
        { success: false, message: "Payment gateway not configured" },
        { status: 500 }
      )
    }

    // Verify transaction with Paystack API
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secretKey}`,
        },
      }
    )

    if (!verifyResponse.ok) {
      console.error(
        `[Paystack Verify] API error: ${verifyResponse.status} ${verifyResponse.statusText}`
      )
      return NextResponse.json(
        {
          success: false,
          message: `Payment verification failed: ${verifyResponse.statusText}`,
        },
        { status: verifyResponse.status }
      )
    }

    const verifyData = await verifyResponse.json()
    console.log(`[Paystack Verify] Response from Paystack:`, verifyData)

    if (!verifyData.status || !verifyData.data) {
      console.error("[Paystack Verify] Invalid response format from Paystack")
      return NextResponse.json(
        { success: false, message: "Invalid response from payment gateway" },
        { status: 500 }
      )
    }

    const { data } = verifyData
    const {
      status: paymentStatus,
      amount,
      customer,
      authorization,
      gateway_response,
      display_text,
    } = data

    console.log(
      `[Paystack Verify] Payment status: ${paymentStatus}, gateway_response: ${gateway_response}, display_text: ${display_text}`
    )

    // Determine transaction status and capture error details
    let transactionStatus: "success" | "failed" | "pending"
    let errorMessage = ""
    let errorCode = ""

    if (paymentStatus === "success") {
      transactionStatus = "success"
    } else {
      transactionStatus = "failed"
      // Capture detailed error information - try all available fields
      errorMessage = gateway_response || display_text || "Payment failed"
      errorCode = data.status || paymentStatus || "unknown"

      // Map common Paystack error codes to user-friendly messages
      const errorMapping: Record<string, string> = {
        // PIN/Timeout errors
        "Failed": "Transaction could not be processed. Please try again.",
        "Timeout": "Transaction timed out. User did not complete the payment.",
        "Cancelled": "Payment was cancelled.",
        "User cancelled": "Payment cancelled by user.",

        // Card errors
        "Declined": "Card declined. Please check your card details.",
        "Approved by default": "Transaction pending. Please check with your bank.",
        "Do not honour": "Bank declined this transaction.",
        "No response from issuer": "No response from bank. Please try again.",
        "Expired card": "Your card has expired.",
        "Possible fraud": "Transaction flagged as possible fraud.",
        "Invalid transaction": "Invalid transaction details.",
        "Insufficient funds": "Insufficient funds in your account.",
        "Restricted card": "Your card is restricted.",
        "Lost card": "Your card has been reported as lost.",
        "Stolen card": "Your card has been reported as stolen.",
        "Not permitted": "This transaction is not permitted on your card account.",
      }

      // Try to find more descriptive error message
      for (const [key, value] of Object.entries(errorMapping)) {
        const lowerGateway = gateway_response?.toLowerCase() || ""
        const lowerDisplay = display_text?.toLowerCase() || ""
        const lowerKey = key.toLowerCase()

        if (lowerGateway.includes(lowerKey) || lowerDisplay.includes(lowerKey)) {
          errorMessage = value
          break
        }
      }
    }

    console.log(
      `[Paystack Verify] Updating transaction: reference=${reference}, status=${transactionStatus}, error="${errorMessage}"`
    )

    try {
      // Update transaction in database with detailed error information
      const result = await convex.mutation(api.paystack.updateTransactionStatus, {
        reference,
        status: transactionStatus,
        amount: amount ? amount / 100 : undefined,
        authorizationCode: authorization?.authorization_code,
        cardType: authorization?.card_type,
        errorDetail: errorMessage, // Detailed error message for display
        errorCode: errorCode, // Gateway response code
        gatewayResponse: gateway_response, // Raw gateway response
      })

      console.log(`[Paystack Verify] Transaction updated successfully:`, result)

      return NextResponse.json({
        success: true,
        message: transactionStatus === "success" ? "Payment verified" : errorMessage,
        status: transactionStatus,
        transactionId: result.transactionId,
      })
    } catch (dbError) {
      console.error("[Paystack Verify] Error updating transaction:", dbError)
      return NextResponse.json(
        {
          success: false,
          message: `Failed to update transaction: ${String(dbError)}`,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[Paystack Verify] Error:", error)
    return NextResponse.json(
      { success: false, message: `Error: ${String(error)}` },
      { status: 500 }
    )
  }
}
