import { NextRequest, NextResponse } from "next/server"
import { initializePaystackService } from "@/lib/paystack-service"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

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

    console.log(`[Paystack API] Verifying transaction: ${reference}`)

    // Initialize Paystack service
    const paystack = initializePaystackService()

    // Verify transaction with Paystack
    const verification = await paystack.verifyTransaction(reference)

    if (!verification.status) {
      console.error(`[Paystack API] Verification failed: ${verification.message}`)
      return NextResponse.json(
        { message: "Failed to verify transaction", status: "failed" },
        { status: 400 }
      )
    }

    const paymentStatus = verification.data.status

    console.log(`[Paystack API] Verification successful. Status: ${paymentStatus}`)
    console.log(`[Paystack API] Amount: ${verification.data.amount / 100} KES`)

    // Map Paystack status to our status
    const transactionStatus =
      paymentStatus === "success"
        ? "success"
        : paymentStatus === "failed"
          ? "failed"
          : "pending"

    const amountInKES = verification.data.amount / 100

    // Try to update transaction in database (might already be done by webhook)
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
      console.warn(`[Paystack API] Could not update transaction (may have been updated by webhook):`, dbError)
      // This is not a fatal error - webhook might have already updated it
    }

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error("[Paystack API] Verify error:", error)
    return NextResponse.json(
      { message: `Error: ${String(error)}`, status: "failed" },
      { status: 500 }
    )
  }
}
