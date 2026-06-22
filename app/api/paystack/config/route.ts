import { NextRequest, NextResponse } from "next/server"

/**
 * Get Paystack configuration (public key only)
 * Safe to expose public key to frontend for embedded payments
 */
export async function GET(request: NextRequest) {
  try {
    const publicKey = process.env.PAYSTACK_PUBLIC_KEY

    if (!publicKey) {
      return NextResponse.json(
        { message: "Paystack is not configured" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      publicKey,
    })
  } catch (error) {
    console.error("[Paystack Config] Error:", error)
    return NextResponse.json(
      { message: `Error: ${String(error)}` },
      { status: 500 }
    )
  }
}
