/**
 * M-Pesa Transaction Status Query API Route
 * GET /api/mpesa/query-status
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeMPesaService } from "@/lib/mpesa-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutRequestID = searchParams.get("checkoutRequestID");
    const merchantRequestID = searchParams.get("merchantRequestID");

    if (!checkoutRequestID || !merchantRequestID) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Initialize M-Pesa service (sandbox mode)
    const mpesa = initializeMPesaService(false);

    // Query transaction status
    const response = await mpesa.queryTransactionStatus(
      merchantRequestID,
      checkoutRequestID
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Transaction query error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to query transaction status";

    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
