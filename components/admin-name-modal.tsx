"use client"

import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"

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
      setError("Please enter your admin name")
      return
    }

    if (!VALID_ADMIN_NAMES.includes(trimmedName)) {
      setError("Invalid admin name. Please check and try again.")
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
    <Dialog open={open} onOpenChange={() => {}} modal={true}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>Admin Identification</DialogTitle>
          </div>
          <DialogDescription>
            Welcome to the admin dashboard. Please enter your admin name to continue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Instructions */}
          <div className="bg-muted/40 rounded-lg p-3.5 space-y-2 border border-border/50">
            <p className="text-xs font-medium text-muted-foreground">
              Select your admin identifier:
            </p>
            <div className="flex flex-wrap gap-2">
              {VALID_ADMIN_NAMES.map((name) => (
                <Badge
                  key={name}
                  variant={
                    adminName.trim().toLowerCase() === name
                      ? "default"
                      : "outline"
                  }
                  className="cursor-pointer font-mono transition-colors hover:bg-primary/20"
                  onClick={() => handleInputChange(name)}
                >
                  {name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Input Field */}
          <div className="space-y-2">
            <label htmlFor="admin-name" className="text-sm font-medium">
              Admin Name
            </label>
            <Input
              id="admin-name"
              placeholder="e.g., dikie"
              value={adminName}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={isSubmitting}
              autoComplete="off"
              autoFocus
              className="font-mono"
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Indicator */}
          {isValid && !error && (
            <div className="flex items-center gap-2 text-xs text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Admin name recognized</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full"
            size="sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up session...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Continue to Dashboard
              </>
            )}
          </Button>

          {/* Security Note */}
          <p className="text-xs text-center text-muted-foreground">
            All admin activities are logged and tracked for security.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
