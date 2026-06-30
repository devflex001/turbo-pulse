"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Clock, Shield } from "lucide-react"

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
    <AlertDialog open={open} onOpenChange={() => {}}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
              <Shield className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold">
                Session Timeout Warning
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground mt-1">
                Your admin session will expire due to inactivity
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-center p-6 bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Auto-logout in:
                </span>
              </div>
              <div className="text-3xl font-mono font-bold tabular-nums">
                {minutes.toString().padStart(2, '0')}:
                {seconds.toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground text-center">
            <p>
              You've been inactive for 9 minutes. Your session will automatically 
              log out in <strong className="text-foreground">{countdown} seconds</strong> for security.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onLogoutNow}
            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            Logout Now
          </Button>
          <AlertDialogAction
            onClick={onExtendSession}
            className="bg-primary hover:bg-primary/90"
          >
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}