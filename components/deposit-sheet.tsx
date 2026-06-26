"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ArrowDownToLine, Copy, Check, Loader, Lock } from "lucide-react"
import { useAuth } from "@/lib/auth/AuthContext"
import { MPesaLiveStatus, MPesaFeedback } from "@/components/mpesa-feedback"

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000]
const MIN_AMOUNT = 10
const MAX_AMOUNT = 150000

function isValidKenyanPhone(phone: string): boolean {
  const regex = /^(?:\+254|254|0)?([71]\d{8})$/
  return regex.test(phone.trim())
}

type DepositStage =
  | "idle"
  | "initiating"
  | "pending_user_action"
  | "processing"
  | "complete"
  | "error"

interface TransactionResult {
  resultCode: string
  resultDesc: string
  mpesaReceiptNumber?: string
  amount?: number
  timestamp?: number
}

export function DepositSheet() {
  const { user } = useAuth()
  const wallet = useQuery(
    api.mpesa.getWallet,
    user?._id ? { userId: user._id } : "skip"
  )
  const config = useQuery(api.platformConfig.getUserFacingConfig)
  const createTransaction = useMutation(api.mpesa.createTransaction)

  const minDeposit = config?.minDeposit ?? 10
  const isLoading = config === undefined || wallet === undefined

  const [amount, setAmount] = React.useState("")
  const [phone, setPhone] = React.useState("")

  React.useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone)
    }
  }, [user?.phone])
  const [stage, setStage] = React.useState<DepositStage>("idle")
  const [transactionResult, setTransactionResult] = React.useState<TransactionResult | null>(
    null
  )
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [checkoutRequestID, setCheckoutRequestID] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Query latest transaction status from database - listens for real-time updates
  const latestTransaction = useQuery(
    api.mpesa.getLatestTransaction,
    checkoutRequestID ? { checkoutRequestID } : "skip"
  )

  // Listen to database updates from M-Pesa callback
  React.useEffect(() => {
    if (!checkoutRequestID || !latestTransaction) return

    // Only process when actively waiting
    if (stage !== "pending_user_action" && stage !== "processing") return

    // Skip if no callback response yet
    if (!latestTransaction.resultCode) return

    console.log("[Real-time] M-Pesa callback received:", latestTransaction)

    const resultCode = latestTransaction.resultCode
    // Use feedback message from server - single source of truth
    const feedbackMessage = latestTransaction.feedback || `Transaction error: ${resultCode}`

    // Mark complete immediately to prevent duplicate processing
    setStage("complete")

    // Set transaction result with server feedback
    setTransactionResult({
      resultCode: resultCode,
      resultDesc: feedbackMessage,
      mpesaReceiptNumber: latestTransaction.mpesaReceiptNumber,
      amount: latestTransaction.amount,
      timestamp: latestTransaction.updatedAt || Date.now(),
    })

    // Show appropriate toast
    if (resultCode === "0") {
      toast.success(feedbackMessage)
    } else {
      toast.error(feedbackMessage)
    }

    // Clear fallback timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [latestTransaction?.resultCode, latestTransaction?.feedback, stage, checkoutRequestID])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setTransactionResult(null)

    if (isLoading) {
      setErrorMessage("Loading configuration, please wait...")
      return
    }

    const parsedAmount = parseFloat(amount)

    if (!amount.trim() || isNaN(parsedAmount)) {
      setErrorMessage("Please enter a valid amount")
      return
    }

    if (parsedAmount < minDeposit || parsedAmount > MAX_AMOUNT) {
      setErrorMessage(`Amount must be KES ${minDeposit.toLocaleString()} - ${MAX_AMOUNT.toLocaleString()}`)
      return
    }

    if (!isValidKenyanPhone(phone)) {
      setErrorMessage("Enter valid phone (e.g. 0712345678)")
      return
    }

    setStage("initiating")

    try {
      // Step 1: Initiate STK Push
      const response = await fetch("/api/mpesa/initiate-stk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          amount: parsedAmount,
          accountReference: `DEPOSIT`,
          transactionDesc: `Betting deposit - KES ${parsedAmount}`,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        setErrorMessage(error.message || "Failed to initiate payment")
        setStage("error")
        return
      }

      const data = await response.json()
      setCheckoutRequestID(data.CheckoutRequestID)

      // Step 2: Create transaction record in database
      await createTransaction({
        userId: user?._id as any,
        type: "deposit",
        amount: parsedAmount,
        phone: phone.trim(),
        checkoutRequestID: data.CheckoutRequestID,
        merchantRequestID: data.MerchantRequestID,
      })

      // Step 3: Transition to pending user action
      setStage("pending_user_action")

      // Step 4: Set 60-second timeout as fallback
      // M-Pesa callback will update the database immediately when user responds
      const timeoutId = setTimeout(() => {
        if (stage === "pending_user_action") {
          setStage("complete")
          setTransactionResult({
            resultCode: "2",
            resultDesc: "Request timed out - No response from M-Pesa",
            timestamp: Date.now(),
          })
          toast.error("Transaction timeout after 60 seconds")
        }
      }, 60000)

      timeoutRef.current = timeoutId
    } catch (error) {
      console.error("Deposit error:", error)
      setErrorMessage("Failed to initiate deposit")
      setStage("error")
    }
  }

  const handleReset = () => {
    setAmount("")
    setStage("idle")
    setTransactionResult(null)
    setErrorMessage(null)
    setCheckoutRequestID(null)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  // Render based on stage
  if (stage === "idle") {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="animate-in fade-in-50 slide-in-from-top-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-xs font-medium text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Amount Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Amount (KES)
            </label>
            {config && (
              <span className="text-[10px] text-muted-foreground">
                Min: KES {minDeposit.toLocaleString()}
              </span>
            )}
          </div>
          <Input
            type="number"
            min={minDeposit}
            max={MAX_AMOUNT}
            placeholder={`Min KES ${minDeposit.toLocaleString()}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-sm font-semibold h-10"
            disabled={isLoading}
            autoFocus
          />
          <div className="grid grid-cols-3 gap-2 pt-2">
            {QUICK_AMOUNTS.filter((amt) => amt >= minDeposit).slice(1, 4).map((amt, idx) => (
              <Button
                key={amt}
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8 font-medium animate-in fade-in-50"
                style={{ animationDelay: `${idx * 25}ms` }}
                onClick={() => setAmount(amt.toString())}
                disabled={isLoading}
              >
                +{amt}
              </Button>
            ))}
          </div>
        </div>

        {/* Phone Section */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Phone Number
          </label>
          <Input
            type="tel"
            placeholder="0712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="text-sm font-semibold h-10"
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full text-sm font-bold gap-2 h-10 animate-in fade-in-50"
          size="default"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Loading configuration...
            </>
          ) : (
            <>
              <ArrowDownToLine className="h-4 w-4" />
              Deposit
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-1.5 pt-2 text-[10px] text-muted-foreground/80 font-medium font-sans">
          <Lock className="h-3 w-3 text-emerald-600" />
          <span>Secured by M-Pesa API. Encrypted end-to-end.</span>
        </div>
      </form>
    )
  }

  if (stage === "error") {
    return (
      <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-4">
        <MPesaLiveStatus
          stage="error"
          errorMessage={errorMessage || "An error occurred"}
        />
        <Button
          className="w-full text-sm font-bold h-10"
          onClick={handleReset}
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (stage === "complete" && transactionResult) {
    const handleCopyReceipt = () => {
      if (transactionResult.mpesaReceiptNumber) {
        navigator.clipboard.writeText(transactionResult.mpesaReceiptNumber)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }

    return (
      <div className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-4">
        <MPesaFeedback
          resultCode={transactionResult.resultCode}
          resultDesc={transactionResult.resultDesc}
          amount={transactionResult.amount}
          transactionId={transactionResult.mpesaReceiptNumber}
          timestamp={transactionResult.timestamp}
        />

        {transactionResult.mpesaReceiptNumber && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full text-xs gap-2"
            onClick={handleCopyReceipt}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy Receipt
              </>
            )}
          </Button>
        )}

        <Button
          className="w-full text-sm font-bold h-10"
          onClick={handleReset}
          variant={transactionResult.resultCode === "0" ? "default" : "outline"}
        >
          {transactionResult.resultCode === "0" ? "Deposit Again" : "Try Again"}
        </Button>
      </div>
    )
  }

  // Rendering: initiating, pending_user_action, processing
  return (
    <MPesaLiveStatus
      stage={stage as "initiating" | "pending_user_action" | "processing"}
      amount={parseFloat(amount) || undefined}
      phone={phone}
    />
  )
}
