import { NextRequest, NextResponse } from "next/server"
import { initializePaystackService } from "@/lib/paystack-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, amount, metadata } = body

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

    // Generate unique reference
    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Initialize Paystack service
    const paystack = initializePaystackService()

    // Generate a placeholder email based on phone number
    // Paystack requires an email, so we'll generate one using phone as unique identifier
    const placeholderEmail = `phone-${phone}@bet-flow.local`

    // Initialize transaction
    const response = await paystack.initializeTransaction(
      placeholderEmail,
      amount,
      reference,
      metadata || {}
    )

    if (!response.status) {
      return NextResponse.json(
        { message: "Failed to initialize Paystack transaction" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      reference,
      authorization_url: response.data.authorization_url,
      access_code: response.data.access_code,
    })
  } catch (error) {
    console.error("[Paystack API] Initialize error:", error)
    return NextResponse.json(
      { message: `Error: ${String(error)}` },
      { status: 500 }
    )
  }
}
