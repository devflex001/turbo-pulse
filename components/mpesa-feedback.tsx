"use client"

import * as React from "react"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  Info,
} from "lucide-react"
import { getMPesaFeedback, type MPesaStatusType } from "@/lib/mpesa-status-codes"

interface MPesaFeedbackProps {
  resultCode: string
  resultDesc: string
  amount?: number
  transactionId?: string
  timestamp?: number
  isLoading?: boolean
}

const statusIcons: Record<MPesaStatusType | "pending", React.ReactNode> = {
  success: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
  cancelled: <X className="h-6 w-6 text-amber-600" />,
  timeout: <Clock className="h-6 w-6 text-gray-600" />,
  error: <AlertCircle className="h-6 w-6 text-red-600" />,
  pending: <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />,
}

const statusColors: Record<
  MPesaStatusType | "pending",
  { bg: string; border: string; text: string }
> = {
  success: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-700",
  },
  cancelled: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-700",
  },
  timeout: {
    bg: "bg-gray-500/10",
    border: "border-gray-500/20",
    text: "text-gray-700",
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-700",
  },
  pending: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-700",
  },
}

export function MPesaFeedback({
  resultCode,
  resultDesc,
  amount,
  transactionId,
  timestamp,
  isLoading = false,
}: MPesaFeedbackProps) {
  const feedback = getMPesaFeedback(resultCode)
  const status = isLoading ? "pending" : (feedback.status as MPesaStatusType | "pending")
  const colors = statusColors[status]

  return (
    <div
      className={`border ${colors.border} ${colors.bg} rounded-lg p-4 space-y-3 animate-in fade-in-50`}
    >
      {/* Header with Icon and Status */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-0.5">{statusIcons[status]}</div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm ${colors.text}`}>
            {feedback.message}
          </h3>
          <p className={`text-xs ${colors.text}/70 mt-1 leading-relaxed`}>
            {resultDesc}
          </p>
        </div>
      </div>

      {/* Additional Info - Only show if we have data */}
      {(amount !== undefined || transactionId || timestamp) && (
        <div className="space-y-2 text-xs pt-3 border-t border-current/10">
          {amount !== undefined && (
            <div className="flex justify-between items-center">
              <span className={`${colors.text}/70`}>Amount:</span>
              <span className={`font-semibold font-mono ${colors.text}`}>
                KES {amount.toLocaleString()}
              </span>
            </div>
          )}

          {transactionId && (
            <div className="flex justify-between items-center gap-2">
              <span className={`${colors.text}/70`}>Receipt:</span>
              <code className={`font-mono text-[10px] font-semibold ${colors.text} truncate`}>
                {transactionId}
              </code>
            </div>
          )}

          {timestamp && (
            <div className="flex justify-between items-center">
              <span className={`${colors.text}/70`}>Time:</span>
              <span className={`text-[10px] ${colors.text}/70`}>
                {new Date(timestamp).toLocaleTimeString('en-KE')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Real-time feedback during transaction
 */
interface MPesaLiveStatusProps {
  resultCode?: string
  resultDesc?: string
  stage: "initiating" | "pending_user_action" | "processing" | "complete" | "error"
  amount?: number
  phone?: string
  errorMessage?: string
}

export function MPesaLiveStatus({
  resultCode,
  resultDesc,
  stage,
  amount,
  phone,
  errorMessage,
}: MPesaLiveStatusProps) {
  let icon: React.ReactNode
  let title: string
  let message: string
  let color: string

  switch (stage) {
    case "initiating":
      icon = <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      title = "Initiating Payment"
      message = "Connecting to M-Pesa..."
      color = "blue"
      break

    case "pending_user_action":
      icon = (
        <div className="relative">
          <span className="flex h-3 w-3 absolute top-0 right-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      )
      title = "Check Your Phone"
      message = phone
        ? `STK prompt sent to ${phone}\nEnter your M-Pesa PIN to confirm`
        : "Waiting for your response on your phone"
      color = "primary"
      break

    case "processing":
      icon = <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
      title = "Processing Payment"
      message = "Your payment is being processed..."
      color = "amber"
      break

    case "complete":
      if (resultCode === "0") {
        icon = <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        title = "Payment Successful!"
        message = amount
          ? `KES ${amount.toLocaleString()} has been charged`
          : "Your payment was completed"
        color = "emerald"
      } else {
        icon = <AlertCircle className="h-8 w-8 text-red-600" />
        title = "Payment Not Completed"
        message = resultDesc || "The payment request was not completed"
        color = "red"
      }
      break

    case "error":
    default:
      icon = <AlertCircle className="h-8 w-8 text-red-600" />
      title = "Transaction Error"
      message = errorMessage || "An error occurred during the transaction"
      color = "red"
      break
  }

  const bgColor = {
    blue: "bg-blue-500/10",
    primary: "bg-primary/10",
    amber: "bg-amber-500/10",
    emerald: "bg-emerald-500/10",
    red: "bg-red-500/10",
  }[color]

  const borderColor = {
    blue: "border-blue-500/20",
    primary: "border-primary/20",
    amber: "border-amber-500/20",
    emerald: "border-emerald-500/20",
    red: "border-red-500/20",
  }[color]

  const textColor = {
    blue: "text-blue-700",
    primary: "text-primary",
    amber: "text-amber-700",
    emerald: "text-emerald-700",
    red: "text-red-700",
  }[color]

  return (
    <div
      className={`border ${borderColor} ${bgColor} rounded-lg p-6 flex flex-col items-center justify-center gap-4 min-h-[280px] animate-in fade-in-50`}
    >
      <div className="flex justify-center">{icon}</div>
      <div className="text-center space-y-3">
        <h3 className={`font-semibold text-base ${textColor}`}>{title}</h3>
        <p className={`text-xs leading-relaxed ${textColor}/70 whitespace-pre-line`}>
          {message}
        </p>
      </div>
    </div>
  )
}

/**
 * Toast-style M-Pesa status notification
 */
interface MPesaToastProps {
  resultCode: string
  resultDesc: string
  duration?: number
  onDismiss?: () => void
}

export function MPesaToast({
  resultCode,
  resultDesc,
  duration = 5000,
  onDismiss,
}: MPesaToastProps) {
  const feedback = getMPesaFeedback(resultCode)

  React.useEffect(() => {
    if (duration && onDismiss) {
      const timer = setTimeout(onDismiss, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onDismiss])

  const toastColors = {
    success: "bg-emerald-600 text-white",
    cancelled: "bg-amber-600 text-white",
    timeout: "bg-gray-600 text-white",
    error: "bg-red-600 text-white",
    pending: "bg-blue-600 text-white",
  }[feedback.status as MPesaStatusType]

  return (
    <div className={`${toastColors} rounded-lg p-3 flex items-center gap-2`}>
      {statusIcons[feedback.status as MPesaStatusType]}
      <div className="text-sm font-medium">{feedback.message}</div>
    </div>
  )
}
