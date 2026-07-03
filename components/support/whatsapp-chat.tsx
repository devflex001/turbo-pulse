"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQuery } from "convex/react"
import { ArrowLeft, Loader2, MessageCircle, Send } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useAuth } from "@/lib/auth/AuthContext"
import { getSessionToken } from "@/lib/auth/session"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type SupportMessage = {
  _id: Id<"support_messages"> | string
  senderRole: "user" | "admin"
  body: string
  createdAt: number
  pending?: boolean
}

function formatMessageTime(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(value)
}

function useSupportAuthArgs() {
  const { user } = useAuth()
  const sessionToken = getSessionToken()

  return React.useMemo(() => {
    if (!user || !sessionToken) return null
    return { sessionToken, userId: user._id }
  }, [user, sessionToken])
}

function WhatsAppHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-2 py-2.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 hover:bg-accent"
        onClick={onBack}
        aria-label="Close chat"
      >
        <ArrowLeft className="size-5" />
      </Button>
      <Avatar className="size-10 border border-border">
        <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
          BF
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium leading-tight text-foreground">BetFlexx Support</p>
        <p className="text-xs text-muted-foreground">online</p>
      </div>
    </header>
  )
}

function GuestPrompt({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <WhatsAppHeader onBack={onBack} />
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/15">
          <MessageCircle className="size-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Chat with support</h3>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Log in to message our support team. We typically reply within a few hours.
        </p>
        <Button
          asChild
          className="mt-6"
        >
          <Link href="/">Log in to continue</Link>
        </Button>
      </div>
    </div>
  )
}

function NameEntryScreen({
  onBack,
  onComplete,
}: {
  onBack: () => void
  onComplete: (conversationId: Id<"support_conversations">) => void
}) {
  const authArgs = useSupportAuthArgs()
  const [name, setName] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const initSupportChat = useMutation(api.supportChat.initSupportChat)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!authArgs) return

    const trimmed = name.trim()
    if (trimmed.length < 2) {
      toast.error("Please enter your name (at least 2 characters)")
      return
    }

    try {
      setIsSubmitting(true)
      const result = await initSupportChat({
        ...authArgs,
        displayName: trimmed,
      })
      onComplete(result.conversationId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save name")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <WhatsAppHeader onBack={onBack} />
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-normal text-foreground">Enter your name</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This name will be shown to our support team.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              disabled={isSubmitting}
              autoFocus
              maxLength={50}
              className="h-12 rounded-lg border-border bg-card text-base focus-visible:ring-primary"
            />
            <Button
              type="submit"
              disabled={isSubmitting || name.trim().length < 2}
              className="h-12 w-full rounded-lg text-base font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: SupportMessage }) {
  const isOwn = message.senderRole === "user"

  return (
    <div className={cn("flex px-3", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[78%] px-2.5 py-1.5 pb-1 shadow-sm",
          isOwn
            ? "rounded-lg rounded-tr-none bg-primary text-primary-foreground"
            : "rounded-lg rounded-tl-none bg-muted text-foreground",
          message.pending && "opacity-70"
        )}
      >
        <p className="whitespace-pre-wrap break-words pr-12 text-[15px] leading-snug">
          {message.body}
        </p>
        <span className={cn(
          "absolute bottom-1 right-2 text-[11px]",
          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {formatMessageTime(message.createdAt)}
        </span>
      </div>
    </div>
  )
}

function ChatThread({
  conversationId,
  onBack,
}: {
  conversationId: Id<"support_conversations">
  onBack: () => void
}) {
  const authArgs = useSupportAuthArgs()
  const [draft, setDraft] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const [pendingMessages, setPendingMessages] = React.useState<SupportMessage[]>([])
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const sendMessage = useMutation(api.supportChat.sendMessage)
  const markAsRead = useMutation(api.supportChat.markAsRead)

  const serverMessages = useQuery(
    api.supportChat.getMessages,
    authArgs ? { ...authArgs, conversationId } : "skip"
  ) as SupportMessage[] | undefined

  const allMessages = React.useMemo(() => {
    const server = serverMessages ?? []
    const serverBodies = new Set(server.map((message) => `${message.body}:${message.createdAt}`))
    const pending = pendingMessages.filter(
      (message) => !serverBodies.has(`${message.body}:${message.createdAt}`)
    )
    return [...server, ...pending].sort((a, b) => a.createdAt - b.createdAt)
  }, [serverMessages, pendingMessages])

  React.useEffect(() => {
    if (!authArgs) return
    markAsRead({ ...authArgs, conversationId }).catch(() => { })
  }, [authArgs, conversationId, markAsRead, serverMessages?.length])

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [allMessages.length])

  React.useEffect(() => {
    if (!serverMessages) return
    setPendingMessages((current) =>
      current.filter(
        (pending) =>
          !serverMessages.some(
            (server) =>
              server.body === pending.body &&
              server.senderRole === "user" &&
              Math.abs(server.createdAt - pending.createdAt) < 15000
          )
      )
    )
  }, [serverMessages])

  async function handleSend() {
    if (!authArgs) return
    const body = draft.trim()
    if (!body || isSending) return

    const optimistic: SupportMessage = {
      _id: `pending-${Date.now()}`,
      senderRole: "user",
      body,
      createdAt: Date.now(),
      pending: true,
    }

    setDraft("")
    setPendingMessages((current) => [...current, optimistic])

    try {
      setIsSending(true)
      await sendMessage({
        ...authArgs,
        conversationId,
        body,
      })
    } catch (error) {
      setPendingMessages((current) => current.filter((message) => message._id !== optimistic._id))
      setDraft(body)
      toast.error(error instanceof Error ? error.message : "Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <WhatsAppHeader onBack={onBack} />

      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 py-3">
        {serverMessages === undefined && pendingMessages.length === 0 && (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        <div className="space-y-1">
          {allMessages.map((message) => (
            <MessageBubble key={message._id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-card px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            disabled={isSending}
            className="h-11 flex-1 rounded-full border-0 bg-background px-4 text-[15px] shadow-sm focus-visible:ring-primary"
          />
          <Button
            type="button"
            size="icon"
            disabled={!draft.trim() || isSending}
            onClick={handleSend}
            aria-label="Send message"
            className="size-11 shrink-0 rounded-full disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function WhatsAppChat({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { user, isLoading } = useAuth()
  const authArgs = useSupportAuthArgs()
  const [conversationId, setConversationId] =
    React.useState<Id<"support_conversations"> | null>(null)

  const conversation = useQuery(
    api.supportChat.getMyConversation,
    authArgs ?? "skip"
  )

  React.useEffect(() => {
    if (conversation?._id) {
      setConversationId(conversation._id)
    } else if (conversation === null) {
      setConversationId(null)
    }
  }, [conversation])

  React.useEffect(() => {
    if (!open) return
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  function handleBack() {
    onOpenChange(false)
  }

  const needsName =
    user &&
    conversation !== undefined &&
    (!conversation || !conversation.displayName)

  let content: React.ReactNode

  if (isLoading) {
    content = (
      <div className="flex flex-1 items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  } else if (!user) {
    content = <GuestPrompt onBack={handleBack} />
  } else if (needsName) {
    content = (
      <NameEntryScreen
        onBack={handleBack}
        onComplete={(id) => setConversationId(id)}
      />
    )
  } else if (conversationId) {
    content = <ChatThread conversationId={conversationId} onBack={handleBack} />
  } else {
    content = (
      <NameEntryScreen
        onBack={handleBack}
        onComplete={(id) => setConversationId(id)}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/40 md:items-center">
      <div className="flex h-[100dvh] w-full flex-col bg-background shadow-xl md:h-[calc(100dvh-2rem)] md:max-w-md md:max-h-[820px] md:rounded-lg md:overflow-hidden">
        {content}
      </div>
    </div>
  )
}
