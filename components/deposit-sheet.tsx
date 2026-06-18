"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Loader2,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000]
const MIN_AMOUNT = 10
const MAX_AMOUNT = 150000

function isValidKenyanPhone(phone: string): boolean {
  const regex = /^(?:\+254|254|0)?([71]\d{8})$/
  return regex.test(phone.trim())
}

type DepositState = "idle" | "loading" | "pending_stk" | "success" | "failed"

export function DepositSheet() {
  const wallet = useQuery(api.mpesa.getWallet)
  const currentUser = useQuery(api.users.currentUser)
  const createTransaction = useMutation(api.mpesa.createTransaction)

  const [amount, setAmount] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [state, setState] = React.useState<DepositState>("idle")
  const [pollInterval, setPollInterval] = React.useState<NodeJS.Timeout | null>(null)

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

    const parsedAmount = parseFloat(amount)

    if (!amount.trim() || isNaN(parsedAmount)) {
      toast.error("Enter a valid amount")
      return
    }

    if (parsedAmount < MIN_AMOUNT || parsedAmount > MAX_AMOUNT) {
      toast.error(`Amount must be KES ${MIN_AMOUNT} - ${MAX_AMOUNT}`)
      return
    }

    if (!isValidKenyanPhone(phone)) {
      toast.error("Enter valid phone (e.g. 0712345678)")
      return
    }

    if (!currentUser) {
      toast.error("Please log in")
      return
    }

    setState("loading")

    try {
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
        toast.error(error.message || "Failed to initiate")
        setState("idle")
        return
      }

      const data = await response.json()

      await createTransaction({
        type: "deposit",
        amount: parsedAmount,
        phone: phone.trim(),
        checkoutRequestID: data.CheckoutRequestID,
        merchantRequestID: data.MerchantRequestID,
      })

      setState("pending_stk")
      toast.success("STK prompt sent")

      let attempts = 0
      const maxAttempts = 30

      const interval = setInterval(async () => {
        attempts++

        try {
          const statusResponse = await fetch(
            `/api/mpesa/query-status?checkoutRequestID=${data.CheckoutRequestID}&merchantRequestID=${data.MerchantRequestID}`
          )

          if (statusResponse.ok) {
            const statusData = await statusResponse.json()

            if (statusData.ResultCode === "0") {
              setState("success")
              clearInterval(interval)
              setPollInterval(null)
              toast.success(`Deposit of KES ${parsedAmount} successful!`)
              setAmount("")
              return
            } else if (statusData.ResultCode === "1") {
              setState("failed")
              clearInterval(interval)
              setPollInterval(null)
              toast.error("Deposit cancelled")
              return
            }
          }
        } catch (error) {
          console.error("Status poll error:", error)
        }

        if (attempts >= maxAttempts) {
          setState("failed")
          clearInterval(interval)
          setPollInterval(null)
          toast.error("Transaction timed out")
        }
      }, 2000)

      setPollInterval(interval)
    } catch (error) {
      console.error("Deposit error:", error)
      toast.error("Failed to initiate deposit")
      setState("idle")
    }
  }

  const handleReset = () => {
    setAmount("")
    if (pollInterval) clearInterval(pollInterval)
    setPollInterval(null)
    setState("idle")
  }

  if (state === "idle") {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
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

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Initiating payment...</p>
      </div>
    )
  }

  if (state === "pending_stk") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-4">
        <div className="relative">
          <span className="flex h-2.5 w-2.5 absolute top-0 right-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
          </span>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold">Check your phone</p>
          <p className="text-xs text-muted-foreground">
            Sent to {phone}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-xs mt-2 h-8"
          onClick={handleReset}
        >
          Cancel
        </Button>
      </div>
    )
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-4">
        <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-full">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="text-center space-y-0.5">
          <p className="text-xs font-semibold">Deposit Successful!</p>
          <p className="text-xs text-muted-foreground">
            KES {parseFloat(amount).toLocaleString()}
          </p>
        </div>
        <Button
          className="w-full text-xs font-bold h-8 mt-2"
          onClick={handleReset}
        >
          Deposit Again
        </Button>
      </div>
    )
  }

  if (state === "failed") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-4">
        <div className="p-2 bg-destructive/10 text-destructive rounded-full">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="text-center space-y-0.5">
          <p className="text-xs font-semibold">Transaction Failed</p>
          <p className="text-xs text-muted-foreground">Check your PIN or try again</p>
        </div>
        <Button
          className="w-full text-xs font-bold h-8 mt-2"
          onClick={handleReset}
        >
          Retry
        </Button>
      </div>
    )
  }

  return null
}
