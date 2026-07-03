/**
 * TypeScript declarations for Paystack Popup v2
 * Official Paystack inline payment modal SDK
 * Updated to match the new constructor-based API
 */

interface PaystackTransaction {
  reference: string
  status: string
  message: string
  trans: string
  transaction: string
  trxref: string
}

interface PaystackTransactionOptions {
  key: string
  email: string
  amount: number
  ref?: string
  currency?: string
  metadata?: Record<string, any>
  channels?: string[]
  onSuccess?: (transaction: PaystackTransaction) => void
  onCancel?: () => void
  onLoad?: (response: any) => void
}

interface PaystackPopInstance {
  newTransaction: (options: PaystackTransactionOptions) => void
  resumeTransaction: (accessCode: string) => void
  cancelTransaction: () => void
}

interface PaystackPopConstructor {
  new(): PaystackPopInstance
  // Legacy methods (deprecated but still available)
  setup?: (options: PaystackTransactionOptions) => {
    openIframe: () => void
    resumeTransaction: (accessCode: string) => void
  }
}

interface Window {
  PaystackPop: PaystackPopConstructor
}
