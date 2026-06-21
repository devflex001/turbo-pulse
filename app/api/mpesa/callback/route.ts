/**
 * M-Pesa Callback Endpoint
 * POST /api/mpesa/callback
 * 
 * This endpoint receives callbacks from M-Pesa after the user completes the STK push
 * Handles both successful and failed transactions
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Initialize Convex client for server-side mutations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

interface MPesaCallbackMetadata {
  item: Array<{
    name: string;
    value: string | number;
  }>;
}

interface MPesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: MPesaCallbackMetadata;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MPesaCallback;

    console.log("[M-Pesa Callback] Received:", JSON.stringify(body, null, 2));

    const { stkCallback } = body.Body;

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    // Extract amount and receipt number from callback metadata
    let mpesaReceiptNumber: string | undefined;
    let amount: number | undefined;

    if (CallbackMetadata?.item) {
      for (const item of CallbackMetadata.item) {
        if (item.name === "MpesaReceiptNumber") {
          mpesaReceiptNumber = item.value as string;
        }
        if (item.name === "Amount") {
          amount = item.value as number;
        }
      }
    }

    console.log("[M-Pesa Callback] Parsed data:", {
      checkoutRequestID: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      mpesaReceiptNumber,
      amount,
    });

    // Update transaction status in Convex
    try {
      const result = await convex.mutation(api.mpesa.updateTransactionStatus, {
        checkoutRequestID: CheckoutRequestID,
        resultCode: ResultCode.toString(),
        resultDesc: ResultDesc,
        mpesaReceiptNumber,
        amount,
      });

      console.log("[M-Pesa Callback] Transaction updated:", result);
    } catch (convexError) {
      console.error("[M-Pesa Callback] Convex update error:", convexError);
      // Don't fail the callback - M-Pesa expects a 200 response
      // We'll return success so M-Pesa knows we received it
    }

    // Always return 200 to acknowledge receipt to M-Pesa
    return NextResponse.json(
      {
        success: true,
        message: "Callback received",
        checkoutRequestID: CheckoutRequestID,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[M-Pesa Callback] Error:", error);

    // Return 200 anyway - M-Pesa needs to know we got the callback
    // Even if there was an error processing it
    return NextResponse.json(
      {
        success: false,
        message: "Callback received but processing failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}

export async function GET(request: NextRequest) {
  // M-Pesa might sometimes use GET for connectivity checks
  return NextResponse.json(
    { message: "M-Pesa callback endpoint is active" },
    { status: 200 }
  );
}
