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
  const updateTransactionStatus = useMutation(api.mpesa.updateTransactionStatus)

  const [amount, setAmount] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [state, setState] = React.useState<DepositState>("idle")
  const [checkoutRequestID, setCheckoutRequestID] = React.useState("")
  const [merchantRequestID, setMerchantRequestID] = React.useState("")

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

      setCheckoutRequestID(data.CheckoutRequestID)
      setMerchantRequestID(data.MerchantRequestID)
      setState("pending_stk")

      toast.success("STK prompt sent to your phone")

      // Poll for transaction status (every 2 seconds for 60 seconds)
      let attempts = 0
      const maxAttempts = 30

      const pollInterval = setInterval(async () => {
        attempts++

        try {
          const statusResponse = await fetch(
            `/api/mpesa/query-status?checkoutRequestID=${data.CheckoutRequestID}&merchantRequestID=${data.MerchantRequestID}`
          )

          if (statusResponse.ok) {
            const statusData = await statusResponse.json()

            if (statusData.ResultCode === "0") {
              // Success
              await updateTransactionStatus({
                checkoutRequestID: data.CheckoutRequestID,
                resultCode: "0",
                resultDesc: "Transaction completed",
                mpesaReceiptNumber: statusData.MpesaReceiptNumber,
                amount: parsedAmount,
              })

              setState("success")
              clearInterval(pollInterval)
              toast.success(`Deposit of KES ${parsedAmount} successful!`)
              return
            } else if (statusData.ResultCode === "1") {
              // User cancelled
              setState("failed")
              clearInterval(pollInterval)
              toast.error("Deposit request was cancelled")
              return
            }
          }
        } catch (error) {
          console.error("Status poll error:", error)
        }

        if (attempts >= maxAttempts) {
          setState("failed")
          clearInterval(pollInterval)
          toast.error("Transaction timed out. Please try again.")
        }
      }, 2000)

      // Cleanup interval on unmount
      return () => clearInterval(pollInterval)
    } catch (error) {
      console.error("Deposit error:", error)
      toast.error("Failed to initiate deposit")
      setState("idle")
    }
  }

  const handleReset = () => {
    setAmount("")
    setPhone(currentUser?.phone ? (currentUser.phone.startsWith("+254") ? "0" + currentUser.phone.slice(4) : currentUser.phone) : "")
    setState("idle")
    setCheckoutRequestID("")
    setMerchantRequestID("")
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
