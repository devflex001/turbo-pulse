"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { Loader2, MessageCircle, Send } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useAuth } from "@/lib/auth/AuthContext"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"

type SupportMessage = {
  _id: Id<"support_messages">
  conversationId: Id<"support_conversations">
  senderId: Id<"users">
  senderRole: "user" | "admin"
  body: string
  createdAt: number
}

function formatMessageTime(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(value)
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: SupportMessage
  isOwn: boolean
}) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm",
          isOwn
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-border bg-muted/60 text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p
          className={cn(
            "mt-1 text-[10px]",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  )
}

function LoginPrompt() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
        <MessageCircle className="size-7 text-primary" />
      </div>
      <h3 className="text-base font-semibold">Chat with support</h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Log in to message our support team. We typically reply within a few hours.
      </p>
      <Button asChild className="mt-6">
        <Link href="/login?redirect=/">Log in to continue</Link>
      </Button>
    </div>
  )
}

function SupportChatThread({
  userId,
  conversationId,
  onConversationCreated,
}: {
  userId: Id<"users">
  conversationId: Id<"support_conversations"> | null
  onConversationCreated: (id: Id<"support_conversations">) => void
}) {
  const [draft, setDraft] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const [activeConversationId, setActiveConversationId] = React.useState(conversationId)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const sendMessage = useMutation(api.supportChat.sendMessage)
  const markAsRead = useMutation(api.supportChat.markAsRead)

  const messages = useQuery(
    api.supportChat.getMessages,
    activeConversationId
      ? { userId, conversationId: activeConversationId }
      : "skip"
  ) as SupportMessage[] | undefined

  React.useEffect(() => {
    setActiveConversationId(conversationId)
  }, [conversationId])

  React.useEffect(() => {
    if (activeConversationId) {
      markAsRead({ userId, conversationId: activeConversationId }).catch(() => {})
    }
  }, [activeConversationId, userId, markAsRead, messages?.length])

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages?.length, activeConversationId])

  async function handleSend() {
    const body = draft.trim()
    if (!body || isSending) return

    try {
      setIsSending(true)
      const result = await sendMessage({
        userId,
        conversationId: activeConversationId ?? undefined,
        body,
      })

      if (result.conversationId && !activeConversationId) {
        setActiveConversationId(result.conversationId)
        onConversationCreated(result.conversationId)
      }

      setDraft("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1 px-4">
        <div className="space-y-3 py-4">
          {!activeConversationId && (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
              <p className="text-sm font-medium">Start a conversation</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Send a message and our team will get back to you.
              </p>
            </div>
          )}

          {activeConversationId && messages === undefined && (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {messages?.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isOwn={message.senderRole === "user"}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={2}
            disabled={isSending}
            className="min-h-[44px] resize-none focus-visible:ring-primary"
          />
          <Button
            type="button"
            size="icon"
            className="size-10 shrink-0"
            disabled={!draft.trim() || isSending}
            onClick={handleSend}
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function SupportChatPanel({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { user, isLoading } = useAuth()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [conversationId, setConversationId] =
    React.useState<Id<"support_conversations"> | null>(null)

  const conversation = useQuery(
    api.supportChat.getMyConversation,
    user ? { userId: user._id } : "skip"
  )

  React.useEffect(() => {
    if (conversation?._id) {
      setConversationId(conversation._id)
    }
  }, [conversation?._id])

  const header = (
    <div className="flex items-center gap-3">
      <Avatar className="size-9">
        <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
          BF
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">BetFlexx Support</p>
        <p className="text-xs text-muted-foreground">We usually reply within a few hours</p>
      </div>
    </div>
  )

  const body =
    isLoading ? (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    ) : user ? (
      <SupportChatThread
        userId={user._id}
        conversationId={conversationId}
        onConversationCreated={setConversationId}
      />
    ) : (
      <LoginPrompt />
    )

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-[400px] flex-col p-0 sm:max-w-[400px]">
          <SheetHeader className="border-b border-border p-4 pr-12">
            <SheetTitle className="sr-only">Support chat</SheetTitle>
            <SheetDescription className="sr-only">
              Chat with BetFlexx support team
            </SheetDescription>
            {header}
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex h-[85vh] flex-col">
        <DrawerHeader className="border-b border-border px-4 pb-4 pt-5 text-left">
          <DrawerTitle className="sr-only">Support chat</DrawerTitle>
          <DrawerDescription className="sr-only">
            Chat with BetFlexx support team
          </DrawerDescription>
          {header}
        </DrawerHeader>
        {body}
      </DrawerContent>
    </Drawer>
  )
}

export function SupportChatWidget() {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const [open, setOpen] = React.useState(false)

  const unreadCount = useQuery(
    api.supportChat.getUnreadCount,
    user ? { userId: user._id } : "skip"
  )

  if (pathname?.startsWith("/admin")) {
    return null
  }

  return (
    <>
      <div className="fixed bottom-20 right-4 z-50 lg:bottom-6">
        <Button
          type="button"
          size="icon"
          className="relative size-14 rounded-full shadow-lg"
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

      <SupportChatPanel open={open} onOpenChange={setOpen} />
    </>
  )
}
