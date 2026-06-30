"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Smartphone,
  ArrowRight,
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
  mpesaReceiptNumber?: string
  paystackReference?: string
  onReset?: () => void
  onClose?: () => void
}

const stageConfig = {
  mpesa: {
    initiating: {
      title: "Initiating Payment",
      icon: Loader2,
      iconClass: "text-blue-600 animate-spin",
    },
    pending_user_action: {
      title: "Awaiting PIN Entry",
      icon: Smartphone,
      iconClass: "text-primary animate-pulse",
    },
    processing: {
      title: "Processing Transaction",
      icon: Loader2,
      iconClass: "text-amber-600 animate-spin",
    },
    success: {
      title: "Payment Successful",
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
    },
    failed: {
      title: "Payment Failed",
      icon: XCircle,
      iconClass: "text-red-600",
    },
    cancelled: {
      title: "Payment Cancelled",
      icon: AlertTriangle,
      iconClass: "text-amber-600",
    },
    timeout: {
      title: "Request Timeout",
      icon: Clock,
      iconClass: "text-gray-600",
    },
    error: {
      title: "Error",
      icon: XCircle,
      iconClass: "text-red-600",
    },
  },
  paystack: {
    initiating: {
      title: "Initiating Payment",
      icon: Loader2,
      iconClass: "text-blue-600 animate-spin",
    },
    pending_user_action: {
      title: "Complete your Payment",
      icon: Loader2,
      iconClass: "text-primary animate-spin",
    },
    processing: {
      title: "Verifying Transaction",
      icon: Loader2,
      iconClass: "text-amber-600 animate-spin",
    },
    success: {
      title: "Payment Successful",
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
    },
    failed: {
      title: "Payment Failed",
      icon: XCircle,
      iconClass: "text-red-600",
    },
    cancelled: {
      title: "Payment Cancelled",
      icon: AlertTriangle,
      iconClass: "text-amber-600",
    },
    timeout: {
      title: "Request Timeout",
      icon: Clock,
      iconClass: "text-gray-600",
    },
    error: {
      title: "Error",
      icon: XCircle,
      iconClass: "text-red-600",
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
  const isComplete = ["success", "failed", "cancelled", "timeout", "error"].includes(safeStage)

  React.useEffect(() => {
    if (safeStage === "success" && onClose) {
      const timer = setTimeout(() => {
        onClose()
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [safeStage, onClose])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-6 py-4">
          {/* Main Card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Icon */}
              <Icon className={cn("h-12 w-12", config.iconClass)} />

              {/* Title */}
              <h3 className="font-semibold text-base">{config.title}</h3>

              {/* Amount - Show for all states */}
              {amount && (
                <div className="w-full bg-muted/40 rounded p-2.5 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-bold font-mono">KES {amount.toLocaleString()}</span>
                  </div>
                  {phone && provider === "mpesa" && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-mono">{phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Message */}
              {message && (
                <p className="text-xs text-muted-foreground">{message}</p>
              )}

              {/* Receipt Number */}
              {/* {(mpesaReceiptNumber || paystackReference) && (
                <div className="w-full space-y-1">
                  <div className="text-xs text-muted-foreground">Reference:</div>
                  <code className="block text-xs font-mono bg-muted/50 rounded p-2 break-all">
                    {mpesaReceiptNumber || paystackReference}
                  </code>
                </div>
              )} */}
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
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      if (onClose) onClose()
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      if (onClose) onClose()
                      if (onReset) onReset()
                    }}
                    className="flex-1"
                  >
                    Retry
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
