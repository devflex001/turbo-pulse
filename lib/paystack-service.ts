/**
 * Paystack Payment Service
 * Handles Paystack API integration for payments
 * Uses embedded modal/iframe instead of redirects
 */

interface PaystackConfig {
  publicKey: string
  secretKey: string
  production: boolean
}

// Paystack reference for embedded payment modal
declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackSetupOptions) => PaystackPopInstance
    }
  }
}

interface PaystackSetupOptions {
  key: string
  email: string
  amount: number
  ref: string
  onClose?: () => void
  onSuccess?: (response: PaystackSuccessResponse) => void
}

interface PaystackPopInstance {
  openIframe: () => void
}

interface PaystackSuccessResponse {
  reference: string
  status: string
}

interface InitializeTransactionResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

interface VerifyTransactionResponse {
  status: boolean
  message: string
  data: {
    id: number
    reference: string
    amount: number
    paid_at: string
    customer: {
      id: number
      email: string
      phone?: string
    }
    status: "success" | "failed" | "pending"
    paidAt: string
    createdAt: string
    authorization: {
      authorization_code: string
      bin: string
      last4: string
      exp_month: string
      exp_year: string
      card_type: string
      bank: string
      country_code: string
      brand: string
      reusable: boolean
      signature: string
    }
  }
}

const PAYSTACK_BASE_URL = "https://api.paystack.co"

export class PaystackService {
  private config: PaystackConfig

  constructor(config: PaystackConfig) {
    this.config = config
  }

  /**
   * Initialize a transaction
   * Returns authorization URL for customer to complete payment
   */
  async initializeTransaction(
    email: string,
    amount: number,
    reference: string,
    metadata?: Record<string, any>
  ): Promise<InitializeTransactionResponse> {
    try {
      const payload = {
        email,
        amount: Math.floor(amount * 100), // Paystack uses cents
        reference,
        metadata: metadata || {},
      }

      console.log("[Paystack] Initializing transaction:", {
        email,
        amount: amount,
        reference,
      })

      const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.secretKey}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error(`[Paystack] Initialize failed: ${response.status}`)
        console.error(`[Paystack] Error body:`, errorBody)
        throw new Error(
          `Initialize failed: ${response.status} ${response.statusText} - ${errorBody}`
        )
      }

      const data = (await response.json()) as InitializeTransactionResponse

      if (!data.status) {
        throw new Error(`Initialize error: ${data.message}`)
      }

      console.log("[Paystack] Transaction initialized:", data.data.reference)

      return data
    } catch (error) {
      console.error("[Paystack] Initialize error:", error)
      throw error
    }
  }

  /**
   * Verify a transaction
   * Check payment status using reference
   */
  async verifyTransaction(reference: string): Promise<VerifyTransactionResponse> {
    try {
      console.log(`[Paystack] Verifying transaction: ${reference}`)

      const response = await fetch(
        `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.secretKey}`,
          },
        }
      )

      if (!response.ok) {
        const errorBody = await response.text()
        console.error(`[Paystack] Verify failed: ${response.status}`)
        console.error(`[Paystack] Error body:`, errorBody)

        throw new Error(
          `Verify failed: ${response.status} ${response.statusText} - ${errorBody}`
        )
      }

      const data = (await response.json()) as VerifyTransactionResponse

      if (!data.status) {
        throw new Error(`Verify error: ${data.message}`)
      }

      console.log(`[Paystack] Verify result: ${data.data.status}`)

      return data
    } catch (error) {
      console.error("[Paystack] Verify error:", error)
      throw error
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(body: string, signature: string): boolean {
    try {
      const crypto = require("crypto")
      const hash = crypto
        .createHmac("sha512", this.config.secretKey)
        .update(body)
        .digest("hex")

      return hash === signature
    } catch {
      return false
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(
    transactionIdOrReference: string | number
  ): Promise<VerifyTransactionResponse> {
    try {
      const response = await fetch(
        `${PAYSTACK_BASE_URL}/transaction/${transactionIdOrReference}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.secretKey}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to get transaction: ${response.statusText}`)
      }

      return (await response.json()) as VerifyTransactionResponse
    } catch (error) {
      console.error("[Paystack] Get transaction error:", error)
      throw error
    }
  }
}

/**
 * Initialize Paystack service with database configuration or environment variables
 * Fetches configuration from Convex database first, falls back to environment variables
 */
export async function initializePaystackService(
  configOverride?: Partial<PaystackConfig>
): Promise<PaystackService> {
  let publicKey = configOverride?.publicKey
  let secretKey = configOverride?.secretKey

  // If no override provided, try to fetch from database
  if (!publicKey || !secretKey) {
    try {
      const { fetchQuery } = await import("convex/nextjs")
      const { api } = await import("@/convex/_generated/api")

      const config = await fetchQuery(api.paystack.getConfig)

      if (config && config.publicKey && config.secretKey) {
        publicKey = config.publicKey
        secretKey = config.secretKey
        console.log("[Paystack] Using configuration from database:", config.source)
      }
    } catch (error) {
      console.warn("[Paystack] Could not fetch from database, falling back to env:", error)
    }
  }

  // Fall back to environment variables
  if (!publicKey) publicKey = process.env.PAYSTACK_PUBLIC_KEY
  if (!secretKey) secretKey = process.env.PAYSTACK_SECRET_KEY

  if (!publicKey || !secretKey) {
    throw new Error(
      "Paystack credentials not configured. Please set PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY in environment variables or add configuration in admin settings."
    )
  }

  const config: PaystackConfig = {
    publicKey,
    secretKey,
    production: configOverride?.production || process.env.NODE_ENV === "production",
  }

  return new PaystackService(config)
}

/**
 * Validate email format for Paystack
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Format amount for Paystack (KES to cents)
 */
export function formatPaystackAmount(amountInKES: number): number {
  return Math.floor(amountInKES * 100)
}

/**
 * Convert Paystack amount (cents) to KES
 */
export function convertPaystackAmount(amountInCents: number): number {
  return amountInCents / 100
}
