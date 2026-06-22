"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ArrowUpRight, Copy, Check, Loader } from "lucide-react"

// Note: Using Paystack inline.js directly (no npm dependency needed)

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000]
const MIN_AMOUNT = 10
const MAX_AMOUNT = 1000000

function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email.trim())
}

type DepositStage = "idle" | "initiating" | "processing" | "complete" | "error"

interface TransactionResult {
  status: "success" | "failed" | "pending"
  message: string
  reference?: string
  amount?: number
  timestamp?: number
}

// Declare Paystack global
declare global {
  interface Window {
    PaystackPop?: any
  }
}

export function PaystackDepositSheet() {
  const wallet = useQuery(api.mpesa.getWallet)
  const createPaystackTransaction = useMutation(api.paystack.createTransaction)

  const [amount, setAmount] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [stage, setStage] = React.useState<DepositStage>("idle")
  const [transactionResult, setTransactionResult] = React.useState<TransactionResult | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [reference, setReference] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [paystackPublicKey, setPaystackPublicKey] = React.useState("")
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Load Paystack script and get config on mount
  React.useEffect(() => {
    // Load Paystack inline.js
    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    script.async = true
    document.body.appendChild(script)

    // Get public key
    fetch("/api/paystack/config")
      .then((res) => res.json())
      .then((data) => setPaystackPublicKey(data.publicKey))
      .catch((err) => console.error("Failed to load Paystack config:", err))
  }, [])

  // Query latest transaction for real-time updates
  const latestTransaction = useQuery(
    api.paystack.getLatestTransaction,
    reference ? { reference } : "skip"
  )

  // Listen for transaction updates
  React.useEffect(() => {
    if (!reference || !latestTransaction) return

    if (stage !== "processing") return

    // Check if transaction has been verified/confirmed
    if (latestTransaction.status && latestTransaction.status !== "pending") {
      setStage("complete")
      setTransactionResult({
        status: latestTransaction.status as "success" | "failed",
        message: latestTransaction.feedback || `Transaction ${latestTransaction.status}`,
        reference: latestTransaction.checkoutRequestID,
        amount: latestTransaction.amount,
        timestamp: latestTransaction.updatedAt || Date.now(),
      })

      if (latestTransaction.status === "success") {
        toast.success(latestTransaction.feedback || "Payment successful!")
      } else {
        toast.error(latestTransaction.feedback || "Payment failed")
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [latestTransaction, reference, stage])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handlePaystackSuccess = async (response: any) => {
    console.log("[Paystack] Payment successful:", response)
    setStage("processing")

    // Verify transaction
    try {
      const verifyResponse = await fetch("/api/paystack/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: response.reference }),
      })

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json()
        setErrorMessage(error.message || "Failed to verify payment")
        setStage("error")
        return
      }

      const verifyData = await verifyResponse.json()
      console.log("[Paystack] Verification result:", verifyData)

      // Wait for transaction to be updated by webhook or immediate DB update
      // The query will trigger real-time update
    } catch (error) {
      console.error("[Paystack] Verification error:", error)
      setErrorMessage("Failed to verify payment")
      setStage("error")
    }
  }

  const handlePaystackClose = () => {
    console.log("[Paystack] Modal closed")
    if (stage === "initiating") {
      setStage("idle")
    }
  }

  const openPaystackModal = (ref: string, depositEmail: string, depositAmount: number) => {
    if (!window.PaystackPop) {
      setErrorMessage("Paystack payment system not loaded. Please refresh and try again.")
      setStage("error")
      return
    }

    const handler = window.PaystackPop.setup({
      key: paystackPublicKey,
      email: depositEmail,
      amount: Math.floor(depositAmount * 100), // Convert to cents
      ref: ref,
      onClose: handlePaystackClose,
      onSuccess: handlePaystackSuccess,
    })

    handler.openIframe()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setTransactionResult(null)

    const parsedAmount = parseFloat(amount)

    if (!amount.trim() || isNaN(parsedAmount)) {
      setErrorMessage("Please enter a valid amount")
      return
    }

    if (parsedAmount < MIN_AMOUNT || parsedAmount > MAX_AMOUNT) {
      setErrorMessage(`Amount must be KES ${MIN_AMOUNT} - ${MAX_AMOUNT}`)
      return
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Enter a valid email address")
      return
    }

    if (!paystackPublicKey) {
      setErrorMessage("Payment configuration not loaded. Please refresh and try again.")
      return
    }

    setStage("initiating")

    try {
      // Generate unique reference
      const ref = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setReference(ref)

      // Create transaction record in database
      await createPaystackTransaction({
        type: "deposit",
        amount: parsedAmount,
        email: email.trim(),
        reference: ref,
      })

      console.log("[Paystack] Transaction record created:", ref)

      // Open Paystack modal
      openPaystackModal(ref, email.trim(), parsedAmount)
    } catch (error) {
      console.error("Paystack deposit error:", error)
      setErrorMessage("Failed to initiate deposit")
      setStage("error")
    }
  }

  const handleReset = () => {
    setAmount("")
    setEmail("")
    setStage("idle")
    setTransactionResult(null)
    setErrorMessage(null)
    setReference(null)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  if (stage === "idle" || stage === "initiating") {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="animate-in fade-in-50 slide-in-from-top-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-xs font-medium text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Amount Section */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Amount (KES)
          </label>
          <Input
            type="number"
            min={MIN_AMOUNT}
            max={MAX_AMOUNT}
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-sm font-semibold h-10"
            disabled={stage === "initiating"}
            autoFocus
          />
          <div className="grid grid-cols-3 gap-2 pt-2">
            {QUICK_AMOUNTS.map((amt, idx) => (
              <Button
                key={amt}
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8 font-medium animate-in fade-in-50"
                style={{ animationDelay: `${idx * 25}ms` }}
                onClick={() => setAmount(amt.toString())}
                disabled={stage === "initiating"}
              >
                +{amt}
              </Button>
            ))}
          </div>
        </div>

        {/* Email Section */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Email Address
          </label>
          <Input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-sm font-semibold h-10"
            disabled={stage === "initiating"}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full text-sm font-bold gap-2 h-10 animate-in fade-in-50"
          size="default"
          disabled={stage === "initiating" || !paystackPublicKey}
        >
          {stage === "initiating" && <Loader className="h-4 w-4 animate-spin" />}
          Deposit via Paystack
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </form>
    )
  }

  if (stage === "error") {
    return (
      <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-700 mb-1">Payment Failed</p>
          <p className="text-xs text-red-600">{errorMessage}</p>
        </div>
        <Button className="w-full text-sm font-bold h-10" onClick={handleReset} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (stage === "complete" && transactionResult) {
    return (
      <div className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-4">
        <PaystackFeedback
          status={transactionResult.status}
          message={transactionResult.message}
          amount={transactionResult.amount}
          reference={transactionResult.reference}
          timestamp={transactionResult.timestamp}
        />

        <Button
          className="w-full text-sm font-bold h-10"
          onClick={handleReset}
          variant={transactionResult.status === "success" ? "default" : "outline"}
        >
          {transactionResult.status === "success" ? "Deposit Again" : "Try Again"}
        </Button>
      </div>
    )
  }

  if (stage === "processing") {
    return (
      <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader className="h-5 w-5 animate-spin text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-blue-700">Processing Payment</p>
              <p className="text-xs text-blue-600 mt-1">Verifying your payment with Paystack...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

interface PaystackFeedbackProps {
  status: "success" | "failed" | "pending"
  message: string
  amount?: number
  reference?: string
  timestamp?: number
}

export function PaystackFeedback({
  status,
  message,
  amount,
  reference,
  timestamp,
}: PaystackFeedbackProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopyReference = () => {
    if (reference) {
      navigator.clipboard.writeText(reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const bgClass =
    status === "success"
      ? "bg-green-500/10 border-green-500/20"
      : status === "failed"
        ? "bg-red-500/10 border-red-500/20"
        : "bg-yellow-500/10 border-yellow-500/20"

  const textClass =
    status === "success"
      ? "text-green-700"
      : status === "failed"
        ? "text-red-700"
        : "text-yellow-700"

  const iconClass =
    status === "success"
      ? "text-green-600"
      : status === "failed"
        ? "text-red-600"
        : "text-yellow-600"

  return (
    <div className={`border rounded-lg p-4 space-y-3 ${bgClass}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${iconClass}`}>
          {status === "success" && <Check className="size-5" />}
          {status === "failed" && <span className="text-sm font-bold">✕</span>}
          {status === "pending" && <Loader className="size-5 animate-spin" />}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${textClass}`}>
            {status === "success"
              ? "Payment Successful"
              : status === "failed"
                ? "Payment Failed"
                : "Payment Pending"}
          </p>
          <p className={`text-xs mt-1 ${textClass}`}>{message}</p>
        </div>
      </div>

      {amount && (
        <div className="text-xs font-medium text-muted-foreground bg-background/50 rounded px-2 py-1">
          Amount: <span className="font-semibold text-foreground">KES {amount.toLocaleString()}</span>
        </div>
      )}

      {reference && (
        <div className="flex items-center gap-2">
          <div className="text-xs font-mono text-muted-foreground flex-1 bg-background/50 rounded px-2 py-1 truncate">
            {reference}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyReference}
            className="h-7 px-2"
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          </Button>
        </div>
      )}

      {timestamp && (
        <p className="text-xs text-muted-foreground">
          {new Date(timestamp).toLocaleString()}
        </p>
      )}
    </div>
  )
}
