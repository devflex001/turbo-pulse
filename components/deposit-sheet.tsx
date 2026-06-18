"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ArrowUpRight } from "lucide-react"
import { MPesaLiveStatus, MPesaFeedback } from "@/components/mpesa-feedback"
import { getMPesaFeedback } from "@/lib/mpesa-status-codes"

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
  const wallet = useQuery(api.mpesa.getWallet)
  const currentUser = useQuery(api.users.currentUser)
  const createTransaction = useMutation(api.mpesa.createTransaction)

  const [amount, setAmount] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [stage, setStage] = React.useState<DepositStage>("idle")
  const [pollInterval, setPollInterval] = React.useState<NodeJS.Timeout | null>(null)
  const [transactionResult, setTransactionResult] = React.useState<TransactionResult | null>(
    null
  )
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (currentUser?.phone) {
      let rawPhone = currentUser.phone
      if (rawPhone.startsWith("+254")) {
        rawPhone = "0" + rawPhone.slice(4)
      } else if (rawPhone.startsWith("254")) {
        rawPhone = "0" + rawPhone.slice(3)
      }
      setPhone(rawPhone)
    }
  }, [currentUser])

  React.useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [pollInterval])

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

    if (!isValidKenyanPhone(phone)) {
      setErrorMessage("Enter valid phone (e.g. 0712345678)")
      return
    }

    if (!currentUser) {
      setErrorMessage("Please log in to deposit")
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
          accountReference: `USER-${currentUser._id}`,
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

      // Step 2: Create transaction record
      await createTransaction({
        type: "deposit",
        amount: parsedAmount,
        phone: phone.trim(),
        checkoutRequestID: data.CheckoutRequestID,
        merchantRequestID: data.MerchantRequestID,
      })

      // Step 3: Transition to pending user action
      setStage("pending_user_action")

      // Step 4: Poll for transaction status
      let attempts = 0
      const maxAttempts = 30

      const interval = setInterval(async () => {
        attempts++

        try {
          const statusResponse = await fetch(
            `/api/mpesa/query-status?checkoutRequestID=${data.CheckoutRequestID}&merchantRequestID=${data.MerchantRequestID}`
          )

          if (!statusResponse.ok) {
            return // Retry
          }

          const statusData = await statusResponse.json()
          const resultCode = String(statusData.ResultCode)
          const feedback = getMPesaFeedback(resultCode)

          // Update UI based on result
          if (resultCode === "0") {
            // Success
            setStage("complete")
            setTransactionResult({
              resultCode: "0",
              resultDesc: "Payment completed successfully",
              mpesaReceiptNumber: statusData.MpesaReceiptNumber,
              amount: parsedAmount,
              timestamp: Date.now(),
            })
            clearInterval(interval)
            setPollInterval(null)
            toast.success(`Deposit of KES ${parsedAmount} completed!`)
            return
          } else if (resultCode === "1") {
            // User cancelled
            setStage("complete")
            setTransactionResult({
              resultCode: "1",
              resultDesc: statusData.ResultDesc || "Transaction cancelled by user",
              timestamp: Date.now(),
            })
            clearInterval(interval)
            setPollInterval(null)
            toast.info("Deposit cancelled")
            return
          } else if (resultCode === "2" || feedback.status === "timeout") {
            // Timeout waiting for user
            if (attempts >= maxAttempts) {
              setStage("complete")
              setTransactionResult({
                resultCode: "2",
                resultDesc: "Request timed out. No response received.",
                timestamp: Date.now(),
              })
              clearInterval(interval)
              setPollInterval(null)
              toast.error("Transaction timed out")
              return
            }
          }
        } catch (error) {
          console.error("Status poll error:", error)
        }
      }, 2000)

      setPollInterval(interval)
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
    if (pollInterval) clearInterval(pollInterval)
    setPollInterval(null)
  }

  // Render based on stage
  if (stage === "idle") {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
            <p className="text-xs text-red-700">{errorMessage}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Amount (KES)
          </label>
          <Input
            type="number"
            min={MIN_AMOUNT}
            max={MAX_AMOUNT}
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-sm"
          />
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {QUICK_AMOUNTS.map((amt) => (
              <Button
                key={amt}
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => setAmount(amt.toString())}
              >
                +{amt}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Phone
          </label>
          <Input
            type="tel"
            placeholder="0712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="text-sm"
          />
        </div>

        <Button type="submit" className="w-full text-sm font-bold gap-1.5 h-9">
          <ArrowUpRight className="h-4 w-4" />
          Deposit
        </Button>
      </form>
    )
  }

  if (stage === "error") {
    return (
      <div className="space-y-3">
        <MPesaLiveStatus
          stage="error"
          errorMessage={errorMessage || "An error occurred"}
        />
        <Button className="w-full text-sm font-bold h-9" onClick={handleReset}>
          Try Again
        </Button>
      </div>
    )
  }

  if (stage === "complete" && transactionResult) {
    return (
      <div className="space-y-3">
        <MPesaFeedback
          resultCode={transactionResult.resultCode}
          resultDesc={transactionResult.resultDesc}
          amount={transactionResult.amount}
          transactionId={transactionResult.mpesaReceiptNumber}
          timestamp={transactionResult.timestamp}
        />
        <Button className="w-full text-sm font-bold h-9" onClick={handleReset}>
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

