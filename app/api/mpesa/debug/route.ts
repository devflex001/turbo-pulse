/**
 * M-Pesa Credential Debug Endpoint
 * GET /api/mpesa/debug
 * 
 * Use this to verify your M-Pesa credentials are correctly configured
 */

import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const consumerKey = process.env.MPESA_CONSUMER_KEY || ""
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET || ""
    const businessCode = process.env.MPESA_BUSINESS_CODE || ""

    const debug = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        sandboxUrl: "https://sandbox.safaricom.co.ke",
      },
      credentials: {
        consumerKeyLength: consumerKey.length,
        consumerKeyPresent: !!consumerKey,
        consumerSecretLength: consumerSecret.length,
        consumerSecretPresent: !!consumerSecret,
        businessCodePresent: !!businessCode,
        businessCode: businessCode,
      },
      auth: {
        base64: Buffer.from(`${consumerKey.trim()}:${consumerSecret.trim()}`).toString(
          "base64"
        ),
      },
    }

    // Try to get access token
    const auth = Buffer.from(
      `${consumerKey.trim()}:${consumerSecret.trim()}`
    ).toString("base64")

    const tokenResponse = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    )

    const tokenData = await tokenResponse.json()

    return NextResponse.json(
      {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        success: tokenResponse.ok,
        debug,
        tokenResponse: tokenResponse.ok
          ? {
              access_token: (tokenData as any).access_token?.substring(0, 20) + "...",
              expires_in: (tokenData as any).expires_in,
            }
          : tokenData,
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
