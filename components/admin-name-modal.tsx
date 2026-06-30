"use client"

import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  AlertCircle,
  Lock,
  ArrowRight,
} from "lucide-react"

const VALID_ADMIN_NAMES = process.env.NEXT_PUBLIC_ADMIN_NAMES?.split(",") || [
  "dikie",
  "hellen",
  "mwalimu",
]

interface AdminNameModalProps {
  open: boolean
  onAdminNameSelected: (adminName: string) => Promise<void>
  isLoading?: boolean
}

export function AdminNameModal({
  open,
  onAdminNameSelected,
  isLoading = false,
}: AdminNameModalProps) {
  const [adminName, setAdminName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = adminName.trim().toLowerCase()

    // Validate
    if (!trimmedName) {
      setError("Please enter your admin identifier")
      return
    }

    if (!VALID_ADMIN_NAMES.includes(trimmedName)) {
      setError("Invalid admin identifier")
      return
    }

    // Clear error on valid submission
    setError(null)
    setIsSubmitting(true)

    try {
      await onAdminNameSelected(trimmedName)
      // Reset form on success
      setAdminName("")
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred"
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (value: string) => {
    setAdminName(value)
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }

  const isValid =
    VALID_ADMIN_NAMES.includes(adminName.trim().toLowerCase()) &&
    adminName.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={() => { }} modal={true}>
      <DialogContent
        className="sm:max-w-sm border-2 border-primary/20 shadow-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Admin Access</DialogTitle>
        {/* Header Section */}
        <div className="flex flex-col items-center gap-4 py-6 px-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
            <Lock className="h-7 w-7 text-primary" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Admin Access</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your admin identifier to continue
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-2">
          {/* Input Field */}
          <div className="space-y-3">
            <label htmlFor="admin-name" className="text-sm font-semibold text-foreground">
              Admin Identifier
            </label>
            <Input
              id="admin-name"
              placeholder="Enter your identifier"
              value={adminName}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={isSubmitting}
              autoComplete="off"
              autoFocus
              className="h-11 text-base border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <span>Enter Dashboard</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          {/* Security Footer */}

        </form>
      </DialogContent>
    </Dialog>
  )
}
