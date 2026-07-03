"use client"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LogOut, ShieldAlert, ArrowRight } from "lucide-react"

interface AdminInactivityWarningProps {
  open: boolean
  countdown: number
  onExtendSession: () => void
  onLogoutNow: () => void
}

export function AdminInactivityWarning({
  open,
  countdown,
  onExtendSession,
  onLogoutNow,
}: AdminInactivityWarningProps) {
  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60

  return (
    <Dialog open={open} onOpenChange={() => { }} modal={true}>
      <DialogContent
        className="sm:max-w-sm border-2 border-primary/20 shadow-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Session Timeout Warning</DialogTitle>

        {/* Header */}
        <div className="flex flex-col items-center gap-4 py-6 px-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
            <ShieldAlert className="h-7 w-7 text-primary" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Session Timeout</h2>
            <p className="text-sm text-muted-foreground mt-2">
              You've been inactive. Your session will expire soon.
            </p>
          </div>
        </div>

        {/* Countdown */}
        <div className="px-2 pb-2">
          <div className="flex flex-col items-center justify-center py-5 rounded-lg bg-muted/40 border border-border">
            <span className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
              Auto-logout in
            </span>
            <span className="text-4xl font-mono font-bold tabular-nums text-foreground">
              {minutes.toString().padStart(2, "0")}:
              {seconds.toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 px-2 pb-4">
          <Button
            type="button"
            onClick={onExtendSession}
            className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            <span>Stay Logged In</span>
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onLogoutNow}
            className="w-full h-11 text-base font-semibold text-destructive border-destructive/40 hover:bg-destructive hover:text-destructive-foreground"
            size="lg"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
