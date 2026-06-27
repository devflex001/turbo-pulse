"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useQuery } from "convex/react"
import { MessageCircle, X } from "lucide-react"

import { api } from "@/convex/_generated/api"
import { useAuth } from "@/lib/auth/AuthContext"
import { getSessionToken } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { WhatsAppChat } from "@/components/support/whatsapp-chat"

const DISMISSED_KEY = "support-widget-dismissed"

export function SupportChatWidget() {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [dismissed, setDismissed] = React.useState(false)

  // Read dismissed state from localStorage on mount
  React.useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISSED_KEY) === "true")
    } catch {
      // ignore – localStorage may be unavailable in some environments
    }
  }, [])

  const sessionToken = getSessionToken()
  const authArgs =
    user && sessionToken ? { sessionToken, userId: user._id } : null

  const unreadCount = useQuery(
    api.supportChat.getUnreadCount,
    authArgs ?? "skip"
  )

  // Allow other components (sidebar, header menu, footer) to open the chat
  React.useEffect(() => {
    function handleOpen() {
      setOpen(true)
    }
    window.addEventListener("open-support-chat", handleOpen)
    return () => window.removeEventListener("open-support-chat", handleOpen)
  }, [])

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      localStorage.setItem(DISMISSED_KEY, "true")
    } catch {
      // ignore
    }
    setDismissed(true)
  }

  if (pathname?.startsWith("/admin")) {
    return null
  }

  return (
    <>
      {!open && !dismissed && (
        <div className="fixed bottom-20 right-4 z-50 lg:bottom-6">
          {/* Dismiss (X) button — top-left corner of the FAB */}
          <button
            type="button"
            aria-label="Dismiss support chat"
            onClick={handleDismiss}
            className="absolute -left-2 -top-2 z-10 flex size-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-3" />
          </button>

          <Button
            type="button"
            size="icon"
            className="relative size-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
            aria-label="Open support chat"
            onClick={() => setOpen(true)}
          >
            <MessageCircle className="size-6" />
            {!isLoading && user && typeof unreadCount === "number" && unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </div>
      )}

      <WhatsAppChat open={open} onOpenChange={setOpen} />
    </>
  )
}
