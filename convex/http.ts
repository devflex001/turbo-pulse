import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

/**
 * M-Pesa STK Push Callback Endpoint
 * POST /api/mpesa/callback
 * 
 * Receives notification when user completes or cancels STK prompt
 * This is the primary way to know transaction status (real-time)
 */
http.route({
  path: "/mpesa/callback",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();

      console.log("[M-Pesa Callback] Received:", JSON.stringify(body, null, 2));

      if (!body.Body?.stkCallback) {
        console.warn("[M-Pesa Callback] Invalid callback format");
        return new Response(
          JSON.stringify({
            ResultCode: 1,
            ResultDesc: "Invalid callback format",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const callback = body.Body.stkCallback;
      const {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
        CallbackMetadata,
      } = callback;

      console.log(`[M-Pesa Callback] Result Code: ${ResultCode}, Result Desc: ${ResultDesc}`);

      // Parse metadata if transaction was successful
      let mpesaReceiptNumber = undefined;
      let amount = undefined;
      let transactionDate = undefined;
      let phoneNumber = undefined;

      if (ResultCode === 0 && CallbackMetadata?.Item) {
        const metadata = CallbackMetadata.Item;
        for (const item of metadata) {
          console.log(`[M-Pesa Callback] Metadata: ${item.Name} = ${item.Value}`);
          
          if (item.Name === "MpesaReceiptNumber") {
            mpesaReceiptNumber = item.Value;
          }
          if (item.Name === "Amount") {
            amount = item.Value;
          }
          if (item.Name === "TransactionDate") {
            transactionDate = item.Value;
          }
          if (item.Name === "PhoneNumber") {
            phoneNumber = item.Value;
          }
        }
      }

      // Update transaction status in database
      try {
        await ctx.runMutation(api.mpesa.updateTransactionStatus, {
          checkoutRequestID: CheckoutRequestID,
          resultCode: String(ResultCode),
          resultDesc: ResultDesc,
          mpesaReceiptNumber,
          amount,
        });

        console.log(`[M-Pesa Callback] Transaction updated successfully: ${CheckoutRequestID}`);
      } catch (dbError) {
        console.error("[M-Pesa Callback] Failed to update transaction:", dbError);
        // Still return success to M-Pesa even if DB update fails
      }

      // Return success response to M-Pesa
      return new Response(
        JSON.stringify({
          ResultCode: 0,
          ResultDesc: "Callback processed successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("[M-Pesa Callback] Error:", error);
      return new Response(
        JSON.stringify({
          ResultCode: 1,
          ResultDesc: "Internal server error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * M-Pesa Timeout Endpoint
 * POST /api/mpesa/timeout
 * 
 * Receives timeout notifications (when user doesn't complete action)
 */
http.route({
  path: "/mpesa/timeout",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();

      console.log("[M-Pesa Timeout] Received:", JSON.stringify(body, null, 2));

      // Log timeout for debugging
      // In production, you might want to update transaction status to "timeout"

      return new Response(
        JSON.stringify({
          ResultCode: 0,
          ResultDesc: "Timeout processed",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("[M-Pesa Timeout] Error:", error);
      return new Response(
        JSON.stringify({
          ResultCode: 1,
          ResultDesc: "Internal server error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * Health check endpoint
 */
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    return new Response(
      JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
});

export default http;
