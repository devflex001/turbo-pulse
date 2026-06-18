import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

/**
 * M-Pesa STK Push Callback Endpoint
 * Receives notification when user completes or cancels STK prompt
 */
http.route({
  path: "/mpesa/callback",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();

      if (!body.Body?.stkCallback) {
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

      // Parse metadata if transaction was successful
      let mpesaReceiptNumber = undefined;
      let amount = undefined;

      if (ResultCode === 0 && CallbackMetadata?.Item) {
        const metadata = CallbackMetadata.Item;
        for (const item of metadata) {
          if (item.Name === "MpesaReceiptNumber") {
            mpesaReceiptNumber = item.Value;
          }
          if (item.Name === "Amount") {
            amount = item.Value;
          }
        }
      }

      // Update transaction status in database
      await ctx.runMutation(api.mpesa.updateTransactionStatus, {
        checkoutRequestID: CheckoutRequestID,
        resultCode: String(ResultCode),
        resultDesc: ResultDesc,
        mpesaReceiptNumber,
        amount,
      });

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
      console.error("Callback error:", error);
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
 * Receives timeout notifications (when user doesn't complete action)
 */
http.route({
  path: "/mpesa/timeout",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();

      console.log("M-Pesa timeout:", body);

      // Log timeout for debugging
      // In production, you might want to update transaction status

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
      console.error("Timeout error:", error);
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
