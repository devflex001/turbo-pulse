import { NextRequest, NextResponse } from "next/server"
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"

/**
 * Get Paystack configuration (public key only)
 * Safe to expose public key to frontend for embedded payments
 * Fetches from database or falls back to environment variables
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get config from database via Convex
    const config = await fetchQuery(api.paystack.getConfig)

    if (config && config.publicKey) {
      console.log("[Paystack Config] Loaded from", config.source)
      return NextResponse.json({
        publicKey: config.publicKey,
        source: config.source,
      })
    }

    // Fallback: If no config in database, check environment
    const publicKey = process.env.PAYSTACK_PUBLIC_KEY

    if (!publicKey) {
      console.error("[Paystack Config] No public key found in database or environment")
      return NextResponse.json(
        { message: "Paystack is not configured. Please add configuration in admin settings." },
        { status: 400 }
      )
    }

    return NextResponse.json({
      publicKey,
      source: "environment",
    })
  } catch (error) {
    console.error("[Paystack Config] Error:", error)
    return NextResponse.json(
      { message: `Configuration error: ${String(error)}` },
      { status: 500 }
    )
  }
}
