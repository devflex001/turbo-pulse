"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useQuery } from "convex/react"
import { MessageCircle } from "lucide-react"

import { api } from "@/convex/_generated/api"
import { useAuth } from "@/lib/auth/AuthContext"
import { getSessionToken } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { WhatsAppChat } from "@/components/support/whatsapp-chat"

export function SupportChatWidget() {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const [open, setOpen] = React.useState(false)

  const sessionToken = getSessionToken()
  const authArgs =
    user && sessionToken ? { sessionToken, userId: user._id } : null

  const unreadCount = useQuery(
    api.supportChat.getUnreadCount,
    authArgs ?? "skip"
  )

  if (pathname?.startsWith("/admin")) {
    return null
  }

  return (
    <>
      {!open && (
        <div className="fixed bottom-20 right-4 z-50 lg:bottom-6">
          <Button
            type="button"
            size="icon"
            className="relative size-14 rounded-full bg-[#25d366] shadow-lg hover:bg-[#20bd5a]"
            aria-label="Open support chat"
            onClick={() => setOpen(true)}
          >
            <MessageCircle className="size-6 text-white" />
            {!isLoading && user && typeof unreadCount === "number" && unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-[#ea0038] px-1.5 text-[10px] font-bold text-white">
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
