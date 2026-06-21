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
  const startTime = Date.now();

  try {
    const body = (await request.json()) as MPesaCallback;

    console.log("[M-Pesa Callback] ✓ Received callback");
    console.log("[M-Pesa Callback] Body:", JSON.stringify(body, null, 2));

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

    console.log("[M-Pesa Callback] ✓ Parsed:", {
      checkoutRequestID: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      mpesaReceiptNumber: mpesaReceiptNumber || "none",
      amount: amount || "none",
    });

    // Update transaction status in Convex
    let convexResult: any;
    try {
      console.log("[M-Pesa Callback] → Calling updateTransactionStatus mutation...");

      convexResult = await convex.mutation(api.mpesa.updateTransactionStatus, {
        checkoutRequestID: CheckoutRequestID,
        resultCode: ResultCode.toString(),
        resultDesc: ResultDesc,
        mpesaReceiptNumber,
        amount,
      });

      console.log("[M-Pesa Callback] ✓ Mutation successful:", convexResult);
    } catch (convexError) {
      console.error("[M-Pesa Callback] ✗ Convex mutation error:", convexError);
      // Don't fail the callback - M-Pesa expects a 200 response
    }

    const duration = Date.now() - startTime;
    console.log(`[M-Pesa Callback] ✓ Complete in ${duration}ms`);

    // Always return 200 to acknowledge receipt to M-Pesa
    return NextResponse.json(
      {
        success: true,
        message: "Callback received and processed",
        checkoutRequestID: CheckoutRequestID,
        resultCode: ResultCode,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[M-Pesa Callback] ✗ Fatal error:", error);
    const duration = Date.now() - startTime;
    console.error(`[M-Pesa Callback] Failed after ${duration}ms`);

    // Return 200 anyway - M-Pesa needs to know we got the callback
    return NextResponse.json(
      {
        success: false,
        message: "Callback received",
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
