"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Smartphone,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PaymentStage =
  | "initiating"
  | "pending_user_action"
  | "processing"
  | "success"
  | "failed"
  | "cancelled"
  | "timeout"
  | "error"

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stage: PaymentStage
  amount?: number
  phone?: string
  provider: "mpesa" | "paystack"
  message?: string
  resultCode?: string
  mpesaReceiptNumber?: string
  paystackReference?: string
  onReset?: () => void
  onClose?: () => void
}

const stageConfig = {
  mpesa: {
    initiating: {
      title: "Initiating Payment",
      description: "Connecting to M-Pesa...",
      icon: Loader2,
      iconClass: "text-blue-600 animate-spin",
      bgClass: "bg-blue-50 dark:bg-blue-950/20",
    },
    pending_user_action: {
      title: "Check Your Phone",
      description: "Enter your M-Pesa PIN to complete payment",
      icon: Smartphone,
      iconClass: "text-primary",
      bgClass: "bg-primary/5",
    },
    processing: {
      title: "Processing",
      description: "Confirming your transaction...",
      icon: Loader2,
      iconClass: "text-amber-600 animate-spin",
      bgClass: "bg-amber-50 dark:bg-amber-950/20",
    },
    success: {
      title: "Payment Successful!",
      description: "Your wallet has been credited",
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
      bgClass: "bg-emerald-50 dark:bg-emerald-950/20",
    },
    failed: {
      title: "Payment Failed",
      description: "Transaction could not be completed",
      icon: XCircle,
      iconClass: "text-red-600",
      bgClass: "bg-red-50 dark:bg-red-950/20",
    },
    cancelled: {
      title: "Payment Cancelled",
      description: "You cancelled the payment",
      icon: AlertTriangle,
      iconClass: "text-amber-600",
      bgClass: "bg-amber-50 dark:bg-amber-950/20",
    },
    timeout: {
      title: "Request Timeout",
      description: "No response received",
      icon: Clock,
      iconClass: "text-gray-600",
      bgClass: "bg-gray-50 dark:bg-gray-950/20",
    },
    error: {
      title: "Error",
      description: "An error occurred",
      icon: XCircle,
      iconClass: "text-red-600",
      bgClass: "bg-red-50 dark:bg-red-950/20",
    },
  },
  paystack: {
    initiating: {
      title: "Initiating Payment",
      description: "Opening payment gateway...",
      icon: Loader2,
      iconClass: "text-blue-600 animate-spin",
      bgClass: "bg-blue-50 dark:bg-blue-950/20",
    },
    pending_user_action: {
      title: "Complete Payment",
      description: "Enter your card details in the secure window",
      icon: Lock,
      iconClass: "text-primary",
      bgClass: "bg-primary/5",
    },
    processing: {
      title: "Verifying Payment",
      description: "Confirming your transaction...",
      icon: Loader2,
      iconClass: "text-amber-600 animate-spin",
      bgClass: "bg-amber-50 dark:bg-amber-950/20",
    },
    success: {
      title: "Payment Successful!",
      description: "Your wallet has been credited",
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
      bgClass: "bg-emerald-50 dark:bg-emerald-950/20",
    },
    failed: {
      title: "Payment Failed",
      description: "Transaction could not be completed",
      icon: XCircle,
      iconClass: "text-red-600",
      bgClass: "bg-red-50 dark:bg-red-950/20",
    },
    cancelled: {
      title: "Payment Cancelled",
      description: "You closed the payment window",
      icon: AlertTriangle,
      iconClass: "text-amber-600",
      bgClass: "bg-amber-50 dark:bg-amber-950/20",
    },
    timeout: {
      title: "Request Timeout",
      description: "Payment took too long",
      icon: Clock,
      iconClass: "text-gray-600",
      bgClass: "bg-gray-50 dark:bg-gray-950/20",
    },
    error: {
      title: "Error",
      description: "An error occurred",
      icon: XCircle,
      iconClass: "text-red-600",
      bgClass: "bg-red-50 dark:bg-red-950/20",
    },
  },
}

export function PaymentModal({
  open,
  onOpenChange,
  stage,
  amount,
  phone,
  provider,
  message,
  mpesaReceiptNumber,
  paystackReference,
  onReset,
  onClose,
}: PaymentModalProps) {
  const safeStage = stage || "initiating"
  const config = stageConfig[provider]?.[safeStage] || stageConfig[provider]["initiating"]
  const Icon = config.icon
  const isLoading = ["initiating", "pending_user_action", "processing"].includes(safeStage)
  const isComplete = ["success", "failed", "cancelled", "timeout", "error"].includes(safeStage)

  // Auto-close on success after 3 seconds
  React.useEffect(() => {
    if (safeStage === "success" && onClose) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [safeStage, onClose])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-base">
            {provider === "mpesa" ? "M-Pesa" : "Paystack"} Payment
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            Transaction in progress
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Main Status Card */}
          <div className={cn("rounded-lg p-6 transition-all", config.bgClass)}>
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Icon */}
              <div className="relative">
                {safeStage === "pending_user_action" && (
                  <span className="flex h-3 w-3 absolute -top-1 -right-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                )}
                <Icon className={cn("h-12 w-12", config.iconClass)} />
              </div>

              {/* Title and Description */}
              <div className="space-y-1">
                <h3 className="font-semibold text-base">{config.title}</h3>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </div>

              {/* Amount Display */}
              {amount && (
                <div className="w-full bg-background/50 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-bold font-mono">KES {amount.toLocaleString()}</span>
                  </div>
                  {phone && provider === "mpesa" && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-mono text-xs">{phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Message */}
              {message && (
                <div className="w-full">
                  <div className="text-xs rounded-lg p-3 bg-background/50 border">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Receipt Number */}
              {(mpesaReceiptNumber || paystackReference) && (
                <div className="w-full pt-2 space-y-1">
                  <div className="text-xs text-muted-foreground">Transaction Receipt</div>
                  <code className="block text-xs font-mono bg-background/50 border rounded p-2 break-all">
                    {mpesaReceiptNumber || paystackReference}
                  </code>
                </div>
              )}

              {/* Loading Tips */}
              {safeStage === "pending_user_action" && provider === "mpesa" && (
                <div className="w-full pt-2">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <p className="leading-relaxed">
                      Check your phone for an M-Pesa prompt and enter your PIN
                    </p>
                  </div>
                </div>
              )}

              {safeStage === "processing" && (
                <div className="w-full pt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <p>Usually takes a few seconds...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isComplete && (
            <div className="flex gap-2">
              {safeStage === "success" ? (
                <Button
                  onClick={() => {
                    if (onClose) onClose()
                    if (onReset) onReset()
                  }}
                  className="w-full gap-2"
                >
                  Deposit Again
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      if (onClose) onClose()
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      if (onClose) onClose()
                      if (onReset) onReset()
                    }}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Secured & Encrypted</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
