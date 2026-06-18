/**
 * M-Pesa Daraja API Service Layer
 * Sandbox integration for STK Push, Transaction Queries, and Reversals
 */

import crypto from "crypto";

interface MPesaConfig {
  consumerKey: string;
  consumerSecret: string;
  businessCode: string;
  passkey: string;
  callbackUrl: string;
  timeoutUrl: string;
  shortcode: string;
  initiatorName: string;
  initiatorPassword: string;
}

interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
}

interface STKPushResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  CustomerMessage?: string;
}

interface TransactionQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
  CallbackMetadata?: any;
}

interface ReversalResponse {
  ResponseCode: string;
  ResponseDescription: string;
  ConversationID: string;
  OriginatorConversationID: string;
}

const SANDBOX_BASE_URL = "https://sandbox.safaricom.co.ke";
const PRODUCTION_BASE_URL = "https://api.safaricom.co.ke";

export class MPesaService {
  private config: MPesaConfig;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(config: MPesaConfig, production: boolean = false) {
    this.config = config;
    this.baseUrl = production ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL;
  }

  /**
   * Get access token from M-Pesa API
   * Tokens expire after 3600 seconds
   */
  async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (
      this.accessToken &&
      this.tokenExpiry &&
      Date.now() < this.tokenExpiry - 300000
    ) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(
        `${this.config.consumerKey}:${this.config.consumerSecret}`
      ).toString("base64");

      const response = await fetch(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`M-Pesa auth failed: ${response.status} - ${errorBody}`);
        throw new Error(
          `Failed to get access token: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as AccessTokenResponse;
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;

      return data.access_token;
    } catch (error) {
      console.error("M-Pesa token error:", error);
      throw error;
    }
  }

  /**
   * Initiate STK Push for customer
   * User will receive prompt on their phone to enter M-Pesa PIN
   */
  async initiateSTKPush(
    phoneNumber: string,
    amount: number,
    accountReference: string,
    transactionDesc: string
  ): Promise<STKPushResponse> {
    const token = await this.getAccessToken();

    // Format phone number to 254XXXXXXXXX
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    // Generate timestamp (format: YYYYMMDDHHmmss)
    const timestamp = this.generateTimestamp();

    // Generate password: Base64(BusinessCode + Passkey + Timestamp)
    const password = Buffer.from(
      `${this.config.businessCode}${this.config.passkey}${timestamp}`
    ).toString("base64");

    const payload = {
      BusinessShortCode: this.config.businessCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.floor(amount),
      PartyA: formattedPhone,
      PartyB: this.config.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: this.config.callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    };

    const response = await fetch(
      `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`STK Push failed: ${response.statusText}`);
    }

    const data = (await response.json()) as STKPushResponse;

    if (data.ResponseCode !== "0") {
      throw new Error(
        `STK Push error: ${data.ResponseDescription} (${data.ResponseCode})`
      );
    }

    return data;
  }

  /**
   * Query transaction status
   */
  async queryTransactionStatus(
    merchantRequestID: string,
    checkoutRequestID: string
  ): Promise<TransactionQueryResponse> {
    const token = await this.getAccessToken();

    const timestamp = this.generateTimestamp();
    const password = Buffer.from(
      `${this.config.businessCode}${this.config.passkey}${timestamp}`
    ).toString("base64");

    const payload = {
      BusinessShortCode: this.config.businessCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID,
    };

    const response = await fetch(
      `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`);
    }

    return (await response.json()) as TransactionQueryResponse;
  }

  /**
   * Reverse a transaction
   */
  async reverseTransaction(
    transactionID: string,
    amount: number,
    remarks: string
  ): Promise<ReversalResponse> {
    const token = await this.getAccessToken();

    const payload = {
      Initiator: this.config.initiatorName,
      SecurityCredential: this.encryptSecurityCredential(
        this.config.initiatorPassword
      ),
      CommandID: "TransactionReversal",
      TransactionID: transactionID,
      Amount: Math.floor(amount),
      ReceiverParty: this.config.shortcode,
      RecieverIdentifierType: "4",
      Remarks: remarks,
      QueueTimeOutURL: this.config.timeoutUrl,
      ResultURL: this.config.callbackUrl,
    };

    const response = await fetch(
      `${this.baseUrl}/mpesa/reversal/v1/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Reversal failed: ${response.statusText}`);
    }

    return (await response.json()) as ReversalResponse;
  }

  /**
   * Validate M-Pesa callback signature
   */
  validateCallbackSignature(
    callbackBody: string,
    signature: string
  ): boolean {
    try {
      const hmac = crypto.createHmac("sha256", this.config.passkey);
      const hash = hmac.update(callbackBody).digest("hex");
      return hash === signature;
    } catch {
      return false;
    }
  }

  /**
   * Format phone number to 254XXXXXXXXX format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any spaces, hyphens, or plus signs
    let cleaned = phone.replace(/[\s\-+]/g, "");

    // If starts with 0, replace with 254
    if (cleaned.startsWith("0")) {
      cleaned = "254" + cleaned.slice(1);
    }

    // If doesn't start with 254, add it
    if (!cleaned.startsWith("254")) {
      cleaned = "254" + cleaned;
    }

    // Ensure it's exactly 12 digits
    if (!cleaned.match(/^254\d{9}$/)) {
      throw new Error(`Invalid phone number format: ${phone}`);
    }

    return cleaned;
  }

  /**
   * Generate timestamp for password generation
   */
  private generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Encrypt security credential (for production use)
   * Note: This is a simplified version. Production should use proper RSA encryption.
   */
  private encryptSecurityCredential(credential: string): string {
    // For sandbox, return as-is. In production, encrypt with public key.
    return Buffer.from(credential).toString("base64");
  }
}

/**
 * Validate Kenyan phone number format
 */
export function validateKenyanPhone(phone: string): boolean {
  // Remove spaces, hyphens, plus signs
  const cleaned = phone.replace(/[\s\-+]/g, "");

  // Accept formats: 0XXXXXXXXX, 254XXXXXXXXX, XXXXXXXXX (assumes 254)
  if (cleaned.startsWith("0")) {
    return cleaned.match(/^0\d{9}$/) !== null;
  }
  if (cleaned.startsWith("254")) {
    return cleaned.match(/^254\d{9}$/) !== null;
  }
  return cleaned.match(/^\d{9}$/) !== null;
}

/**
 * Format phone to standardized 254XXXXXXXXX format
 */
export function formatPhoneForMPesa(phone: string): string {
  const cleaned = phone.replace(/[\s\-+]/g, "");

  let formatted = cleaned;
  if (cleaned.startsWith("0")) {
    formatted = "254" + cleaned.slice(1);
  } else if (!cleaned.startsWith("254")) {
    formatted = "254" + cleaned;
  }

  if (!formatted.match(/^254\d{9}$/)) {
    throw new Error(`Invalid Kenyan phone number: ${phone}`);
  }

  return formatted;
}

/**
 * Initialize M-Pesa service with environment variables
 */
export function initializeMPesaService(
  production: boolean = false
): MPesaService {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error(
      "M-Pesa credentials not configured. Please set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in environment variables."
    );
  }

  const config: MPesaConfig = {
    consumerKey,
    consumerSecret,
    businessCode: process.env.MPESA_BUSINESS_CODE || "174379",
    passkey:
      process.env.MPESA_PASSKEY ||
      "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
    callbackUrl:
      process.env.MPESA_CALLBACK_URL || "https://localhost:3000/api/mpesa/callback",
    timeoutUrl:
      process.env.MPESA_TIMEOUT_URL || "https://localhost:3000/api/mpesa/timeout",
    shortcode: process.env.MPESA_SHORTCODE || "174379",
    initiatorName: process.env.MPESA_INITIATOR_NAME || "testapi",
    initiatorPassword: process.env.MPESA_INITIATOR_PASSWORD || "Safaricom1234!",
  };

  return new MPesaService(config, production);
}
