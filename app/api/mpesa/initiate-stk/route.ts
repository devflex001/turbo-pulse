/**
 * M-Pesa STK Push Initiation API Route
 * POST /api/mpesa/initiate-stk
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeMPesaService } from "@/lib/mpesa-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { phone, amount, accountReference, transactionDesc } = body;

    // Validate inputs
    if (!phone || !amount || !accountReference) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { message: "Invalid amount" },
        { status: 400 }
      );
    }

    // Initialize M-Pesa service (sandbox mode)
    const mpesa = initializeMPesaService(false);

    // Initiate STK Push
    const response = await mpesa.initiateSTKPush(
      phone,
      amount,
      accountReference,
      transactionDesc || `Payment for ${accountReference}`
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("STK Push initiation error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to initiate STK push";

    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
