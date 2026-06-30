"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuth } from "@/lib/auth/AuthContext"
import { ArrowDownToLine, Loader, Lock } from "lucide-react"
import { PaymentModal } from "@/components/payment-modal"

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000]
const MIN_AMOUNT = 10
const MAX_AMOUNT = 1000000

type DepositStage =
  | "idle"
  | "initiating"
  | "pending_user_action"
  | "processing"
  | "success"
  | "failed"
  | "cancelled"
  | "timeout"
  | "error"

export function PaystackDepositSheet() {
  const { user } = useAuth()
  const wallet = useQuery(
    api.mpesa.getWallet,
    user?._id ? { userId: user._id } : "skip"
  )
  const config = useQuery(api.platformConfig.getUserFacingConfig)
  const createPaystackTransaction = useMutation(api.paystack.createTransaction)

  const minDeposit = config?.minDeposit ?? 10
  const isLoading = config === undefined || wallet === undefined

  const [amount, setAmount] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [isEditingPhone, setIsEditingPhone] = React.useState(false)

  React.useEffect(() => {
    if (user?.phone && !phone) {
      setPhone(user.phone)
    }
  }, [user?.phone])

  React.useEffect(() => {
    if (config?.minDeposit && !amount) {
      setAmount(config.minDeposit.toString())
    }
  }, [config?.minDeposit])

  const [stage, setStage] = React.useState<DepositStage>("idle")
  const [modalOpen, setModalOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [reference, setReference] = React.useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = React.useState<string>("")
  const [paystackReference, setPaystackReference] = React.useState<string | undefined>()
  const [paystackPublicKey, setPaystackPublicKey] = React.useState("")
  const [paystackLoaded, setPaystackLoaded] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Load official Paystack Popup v2 script and get config on mount
  React.useEffect(() => {
    // Check if PaystackPop is already available
    if (window.PaystackPop) {
      console.log("[Paystack] Popup v2 already loaded")
      setPaystackLoaded(true)
    } else {
      // Load official Paystack Popup v2 from CDN
      const script = document.createElement("script")
      script.src = "https://js.paystack.co/v2/inline.js"
      script.async = true

      script.onload = () => {
        console.log("[Paystack] Popup v2 script loaded successfully from CDN")
        setTimeout(() => {
          if (window.PaystackPop) {
            setPaystackLoaded(true)
          }
        }, 100)
      }

      script.onerror = () => {
        console.error("[Paystack] Failed to load Popup v2 script from CDN")
        toast.error("Failed to load Paystack payment system")
      }

      document.body.appendChild(script)
    }

    // Fetch public key from database
    fetch("/api/paystack/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.publicKey) {
          setPaystackPublicKey(data.publicKey)
          console.log("[Paystack] Public key loaded successfully from", data.source || "database")
        } else {
          console.error("[Paystack] No public key in config response:", data)
          toast.error(data.message || "Payment configuration missing. Please configure Paystack in admin settings.")
        }
      })
      .catch((err) => {
        console.error("[Paystack] Failed to load config:", err)
        toast.error("Failed to load payment configuration")
      })

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Force body pointer-events to auto when Paystack modal is active
  React.useEffect(() => {
    if (stage === "pending_user_action") {
      const originalPointerEvents = document.body.style.pointerEvents
      document.body.style.pointerEvents = "auto"

      const styleEl = document.createElement("style")
      styleEl.id = "paystack-deposit-pointer-override"
      styleEl.innerHTML = `body { pointer-events: auto !important; }`
      document.head.appendChild(styleEl)

      return () => {
        document.body.style.pointerEvents = originalPointerEvents
        const el = document.getElementById("paystack-deposit-pointer-override")
        if (el) el.remove()
      }
    }
  }, [stage])

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
      const newStage = latestTransaction.status === "success" ? "success" : "failed"
      const message = latestTransaction.feedback || `Transaction ${latestTransaction.status}`

      setStage(newStage)
      setFeedbackMessage(message)
      setPaystackReference(latestTransaction.checkoutRequestID)

      if (latestTransaction.status === "success") {
        toast.success(message)
      } else {
        toast.error(message)
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

    try {
      // Verify transaction with backend
      const verifyResponse = await fetch("/api/paystack/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: response.reference }),
      })

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json()
        console.error("[Paystack] Verification failed:", error)
        setErrorMessage(error.message || "Failed to verify payment")
        setStage("failed")
        setFeedbackMessage("Payment verification failed")
        toast.error("Payment verification failed")
        return
      }

      const verifyData = await verifyResponse.json()
      console.log("[Paystack] Verification result:", verifyData)

      // The real-time query will update the transaction status
    } catch (error) {
      console.error("[Paystack] Verification error:", error)
      setErrorMessage("Failed to verify payment")
      setStage("failed")
      setFeedbackMessage("Payment verification failed")
      toast.error("Payment verification failed")
    }
  }

  const handlePaystackCancel = () => {
    console.log("[Paystack] Payment cancelled by user")
    setStage("cancelled")
    setFeedbackMessage("You cancelled the payment")
    setModalOpen(true)
  }

  const openPaystackModal = (ref: string, userPhone: string, depositAmount: number) => {
    if (!window.PaystackPop) {
      console.error("[Paystack] Popup v2 not available")
      setErrorMessage("Paystack payment system not initialized. Please refresh and try again.")
      setStage("error")
      toast.error("Payment system error")
      return
    }

    if (!paystackPublicKey) {
      console.error("[Paystack] No public key available")
      setErrorMessage("Payment configuration missing. Please configure Paystack in admin settings.")
      setStage("error")
      toast.error("Payment configuration error")
      return
    }

    console.log("[Paystack] Opening official Popup v2 modal for reference:", ref)

    try {
      const sanitizedPhone = userPhone.replace(/[^a-zA-Z0-9]/g, "")
      const placeholderEmail = `user${sanitizedPhone}@betflexx.com`

      // Use new Paystack API (constructor-based)
      const paystack = new window.PaystackPop()

      paystack.newTransaction({
        key: paystackPublicKey,
        email: placeholderEmail,
        amount: Math.floor(depositAmount * 100), // Amount in cents
        ref: ref,
        onSuccess: (transaction: any) => {
          console.log("[Paystack] Transaction successful:", transaction)
          handlePaystackSuccess(transaction)
        },
        onCancel: () => {
          console.log("[Paystack] Modal closed")
          if (stage === "pending_user_action") {
            handlePaystackCancel()
          }
        },
      })

      setStage("pending_user_action")
    } catch (error) {
      console.error("[Paystack] Failed to open modal:", error)
      setErrorMessage("Failed to open payment modal")
      setStage("error")
      toast.error("Failed to open payment modal")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setFeedbackMessage("")
    setPaystackReference(undefined)

    if (isLoading) {
      setErrorMessage("Loading configuration, please wait...")
      return
    }

    if (!user?.phone) {
      setErrorMessage("You must be logged in to deposit funds")
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

    if (!paystackPublicKey) {
      setErrorMessage("Payment system not configured. Please configure Paystack in admin settings.")
      return
    }

    if (!paystackLoaded) {
      setErrorMessage("Payment system is loading. Please wait a moment and try again.")
      return
    }

    setStage("initiating")
    setModalOpen(true)

    try {
      const ref = `PAYSTACK-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      setReference(ref)

      console.log("[Paystack] Creating transaction record with reference:", ref)

      await createPaystackTransaction({
        userId: user._id,
        type: "deposit",
        amount: parsedAmount,
        email: phone,
        reference: ref,
      })

      console.log("[Paystack] Transaction record created successfully")

      // Small delay to ensure modal is visible before opening Paystack
      setTimeout(() => {
        openPaystackModal(ref, phone, parsedAmount)
      }, 300)
    } catch (error) {
      console.error("[Paystack] Error during deposit initiation:", error)
      setErrorMessage("Failed to initiate payment. Please try again.")
      setStage("error")
      setModalOpen(false)
      toast.error("Failed to initiate payment")
    }
  }

  const handleReset = () => {
    setAmount("")
    setStage("idle")
    setFeedbackMessage("")
    setPaystackReference(undefined)
    setErrorMessage(null)
    setReference(null)
    setModalOpen(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const handleModalClose = () => {
    setModalOpen(false)
    if (stage === "success" || stage === "failed" || stage === "cancelled" || stage === "timeout") {
      handleReset()
    }
  }

  const getPaymentStage = (): "initiating" | "pending_user_action" | "processing" | "success" | "failed" | "cancelled" | "timeout" | "error" => {
    // Map internal stages to payment modal stages
    if (stage === "idle") return "initiating"
    if (stage === "error") return "failed"
    return stage as any
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="animate-in fade-in-50 slide-in-from-top-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-xs font-medium text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* User Info Display */}
        {user && (
          <div className="bg-slate-500/5 border border-slate-500/10 rounded-lg p-3 flex justify-between items-center transition-all hover:border-slate-500/20">
            <div className="space-y-0.5 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Depositing with:
              </p>
              {isEditingPhone ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-7 text-xs w-40 focus-visible:ring-primary py-1 px-2 font-mono"
                    placeholder="e.g. 0712345678"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[10px] font-semibold text-emerald-600 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all"
                    onClick={() => setIsEditingPhone(false)}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <p className="text-sm font-bold text-foreground font-mono">{phone}</p>
              )}
            </div>
            {!isEditingPhone && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground transition-all"
                onClick={() => setIsEditingPhone(true)}
              >
                Change
              </Button>
            )}
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
            {QUICK_AMOUNTS.filter((amt) => amt >= minDeposit)
              .slice(1, 4)
              .map((amt, idx) => (
                <Button
                  key={amt}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 font-medium animate-in fade-in-50 transition-all hover:scale-105"
                  style={{ animationDelay: `${idx * 25}ms` }}
                  onClick={() => setAmount(amt.toString())}
                  disabled={isLoading}
                >
                  +{amt}
                </Button>
              ))}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full text-sm font-bold gap-2 h-10 animate-in fade-in-50 transition-all hover:scale-[1.02]"
          size="default"
          disabled={!paystackPublicKey || !paystackLoaded || !user || isLoading}
        >
          {isLoading ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Loading configuration...
            </>
          ) : (
            <>
              <ArrowDownToLine className="h-4 w-4" />
              Deposit with Paystack
            </>
          )}
        </Button>
       
      </form>

      <PaymentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        stage={getPaymentStage()}
        amount={parseFloat(amount) || undefined}
        phone={phone}
        provider="paystack"
        message={feedbackMessage}
        paystackReference={paystackReference}
        onReset={handleReset}
        onClose={handleModalClose}
      />
    </>
  )
}
