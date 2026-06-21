/**
 * M-Pesa Timeout Endpoint
 * POST /api/mpesa/timeout
 * 
 * This endpoint receives notifications if the STK push times out
 * (user doesn't enter PIN within the timeout window)
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

interface MPesaTimeoutNotification {
  Body: {
    timeoutNotification: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: string;
      ResultDesc: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MPesaTimeoutNotification;

    console.log("[M-Pesa Timeout] Received:", JSON.stringify(body, null, 2));

    const { timeoutNotification } = body.Body;

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
    } = timeoutNotification;

    console.log("[M-Pesa Timeout] Parsed data:", {
      checkoutRequestID: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
    });

    // Update transaction status to timeout
    try {
      const result = await convex.mutation(api.mpesa.updateTransactionStatus, {
        checkoutRequestID: CheckoutRequestID,
        resultCode: ResultCode,
        resultDesc: ResultDesc || "Request timed out. User did not enter PIN.",
      });

      console.log("[M-Pesa Timeout] Transaction updated:", result);
    } catch (convexError) {
      console.error("[M-Pesa Timeout] Convex update error:", convexError);
    }

    // Always return 200 to acknowledge receipt to M-Pesa
    return NextResponse.json(
      {
        success: true,
        message: "Timeout notification received",
        checkoutRequestID: CheckoutRequestID,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[M-Pesa Timeout] Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Timeout notification received but processing failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: "M-Pesa timeout endpoint is active" },
    { status: 200 }
  );
}
