// Convex Environment Variables Type Definitions
declare module "convex/server" {
  interface Env {
    // M-Pesa Credentials
    MPESA_CONSUMER_KEY?: string;
    MPESA_CONSUMER_SECRET?: string;
    MPESA_BUSINESS_CODE?: string;
    MPESA_PASSKEY?: string;
    MPESA_CALLBACK_URL?: string;
    MPESA_TIMEOUT_URL?: string;
    MPESA_SHORTCODE?: string;
    MPESA_INITIATOR_NAME?: string;
    MPESA_INITIATOR_PASSWORD?: string;
  }
}

export {};
