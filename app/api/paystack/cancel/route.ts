import { NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

/**
 * Paystack Cancellation Endpoint
 * POST /api/paystack/cancel
 *
 * Marks a transaction as cancelled when user closes the payment popup
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

    console.log(`[Paystack Cancel] Marking transaction as cancelled: ${reference}`)

    try {
      const result = await convex.mutation(api.paystack.markTransactionCancelled, {
        reference,
      })

      console.log(`[Paystack Cancel] Transaction cancelled:`, result)

      return NextResponse.json({
        success: true,
        message: "Transaction marked as cancelled",
        transactionId: result.transactionId,
      })
    } catch (dbError) {
      console.error("[Paystack Cancel] Error updating transaction:", dbError)
      // Don't fail the request - the cancellation is recorded client-side
      return NextResponse.json(
        {
          success: true,
          message: "Cancellation recorded",
        }
      )
    }
  } catch (error) {
    console.error("[Paystack Cancel] Error:", error)
    return NextResponse.json(
      { success: false, message: `Error: ${String(error)}` },
      { status: 500 }
    )
  }
}
