"use client"

import * as React from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Loader2,
  ArrowLeft,
  ArrowUpRight,
  Wallet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000]
const MIN_AMOUNT = 10
const MAX_AMOUNT = 150000

function isValidKenyanPhone(phone: string): boolean {
  const regex = /^(?:\+254|254|0)?([71]\d{8})$/
  return regex.test(phone.trim())
}

type DepositState = "idle" | "loading" | "pending_stk" | "success" | "failed"

export default function DepositPage() {
  const wallet = useQuery(api.mpesa.getWallet)
  const currentUser = useQuery(api.users.currentUser)

  const createTransaction = useMutation(api.mpesa.createTransaction)

  const [amount, setAmount] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [state, setState] = React.useState<DepositState>("idle")
  const [pollInterval, setPollInterval] = React.useState<NodeJS.Timeout | null>(null)

  // Pre-fill phone from user profile
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

  // Cleanup interval on unmount
  React.useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [pollInterval])

  const handleQuickAmount = (amt: number) => {
    setAmount(amt.toString())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(amount)

    // Validation
    if (!amount.trim()) {
      toast.error("Please enter an amount")
      return
    }

    if (isNaN(parsedAmount)) {
      toast.error("Please enter a valid amount")
      return
    }

    if (parsedAmount < MIN_AMOUNT) {
      toast.error(`Minimum deposit amount is KES ${MIN_AMOUNT}`)
      return
    }

    if (parsedAmount > MAX_AMOUNT) {
      toast.error(`Maximum deposit amount is KES ${MAX_AMOUNT}`)
      return
    }

    if (!phone.trim()) {
      toast.error("Please enter a phone number")
      return
    }

    if (!isValidKenyanPhone(phone)) {
      toast.error("Please enter a valid Kenyan phone number (e.g. 0712345678)")
      return
    }

    if (!currentUser) {
      toast.error("Please log in to deposit funds")
      return
    }

    setState("loading")

    try {
      // Call backend API to initiate STK Push
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
        toast.error(error.message || "Failed to initiate deposit")
        setState("idle")
        return
      }

      const data = await response.json()

      // Create transaction record in Convex
      await createTransaction({
        type: "deposit",
        amount: parsedAmount,
        phone: phone.trim(),
        checkoutRequestID: data.CheckoutRequestID,
        merchantRequestID: data.MerchantRequestID,
      })

      setState("pending_stk")
      toast.success("STK prompt sent to your phone")

      // Poll for transaction status (every 2 seconds for 60 seconds max)
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
              // Success
              setState("success")
              clearInterval(interval)
              setPollInterval(null)
              toast.success(`Deposit of KES ${parsedAmount} successful!`)
              return
            } else if (statusData.ResultCode === "1") {
              // User cancelled
              setState("failed")
              clearInterval(interval)
              setPollInterval(null)
              toast.error("Deposit request was cancelled")
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
          toast.error("Transaction timed out. Please try again.")
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

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header />

      <div className="flex-1 flex max-w-[1400px] w-full mx-auto overflow-hidden">
        <Sidebar className="hidden lg:flex w-60 shrink-0 h-full" />

        <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto h-full flex flex-col gap-6 scrollbar-thin">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Deposit Funds</h1>
              <p className="text-xs text-muted-foreground">
                Add funds to your wallet using M-Pesa
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-md w-full mx-auto space-y-4">
            {/* Wallet Balance Card */}
            <div className="border border-border bg-card p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-primary/10 text-primary">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Current Balance
                    </p>
                    <p className="text-sm font-bold mt-0.5">
                      KES{" "}
                      {wallet?.balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      }) || "0.00"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-emerald-600 border-emerald-500/20 bg-emerald-500/5"
                >
                  Active
                </Badge>
              </div>
            </div>

            {/* Deposit Form / States */}
            {state === "idle" && (
              <form
                onSubmit={handleSubmit}
                className="border border-border bg-card rounded-lg p-5 space-y-4"
              >
                {/* Amount */}
                <div className="space-y-2">
                  <label
                    className="text-xs font-semibold text-muted-foreground block"
                    htmlFor="amount"
                  >
                    Amount (KES)
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    min={MIN_AMOUNT}
                    max={MAX_AMOUNT}
                    placeholder={`Enter amount (${MIN_AMOUNT} - ${MAX_AMOUNT})`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-base font-semibold"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    {QUICK_AMOUNTS.map((amt) => (
                      <Button
                        key={amt}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold h-8"
                        onClick={() => handleQuickAmount(amt)}
                      >
                        +{amt}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label
                    className="text-xs font-semibold text-muted-foreground block"
                    htmlFor="phone"
                  >
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. 0712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Enter your registered Kenyan phone number. An M-Pesa PIN
                    prompt will appear on your device.
                  </p>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded p-3">
                  <div className="flex gap-2 items-start">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                      Sandbox environment. Use Safaricom test credentials.
                    </p>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full font-bold gap-2 h-10"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Deposit Now
                </Button>
              </form>
            )}

            {state === "loading" && (
              <div className="border border-border bg-card rounded-lg p-8 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div className="text-center space-y-1">
                  <h3 className="font-semibold text-sm">
                    Initiating Payment
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Sending STK prompt to your phone...
                  </p>
                </div>
              </div>
            )}

            {state === "pending_stk" && (
              <div className="border border-border bg-card rounded-lg p-6 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <span className="flex h-3 w-3 absolute top-0 right-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-sm">
                    Check Your Phone
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    An M-Pesa prompt has been sent to{" "}
                    <strong className="text-foreground">{phone}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Enter your PIN to confirm the payment
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold mt-2"
                  onClick={handleReset}
                >
                  Cancel
                </Button>
              </div>
            )}

            {state === "success" && (
              <div className="border border-border bg-card rounded-lg p-6 flex flex-col items-center justify-center gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-full">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-semibold text-sm">
                    Deposit Successful!
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    KES {parseFloat(amount).toLocaleString()} has been added to
                    your wallet
                  </p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    className="flex-1 text-xs font-bold"
                    onClick={handleReset}
                  >
                    Deposit Again
                  </Button>
                  <Link href="/" className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full text-xs font-bold"
                    >
                      Go Betting
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {state === "failed" && (
              <div className="border border-border bg-card rounded-lg p-6 flex flex-col items-center justify-center gap-4">
                <div className="p-3 bg-destructive/10 text-destructive rounded-full">
                  <AlertCircle className="h-10 w-10" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-semibold text-sm">Deposit Failed</h3>
                  <p className="text-xs text-muted-foreground">
                    The transaction was not completed. Please check your PIN or
                    try again.
                  </p>
                </div>
                <Button
                  className="w-full text-xs font-bold"
                  onClick={handleReset}
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>

          <footer className="mt-auto pt-8 border-t border-border text-xs text-muted-foreground">
            <p>
              M-Pesa integration powered by Safaricom Daraja API (Sandbox)
            </p>
          </footer>
        </main>
      </div>

      <BottomNav liveCount={0} />
    </div>
  )
}
