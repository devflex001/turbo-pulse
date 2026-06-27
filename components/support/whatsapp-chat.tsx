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
    <header className="flex shrink-0 items-center gap-3 bg-[#075e54] px-2 py-2.5 text-white">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 text-white hover:bg-white/10 hover:text-white"
        onClick={onBack}
        aria-label="Close chat"
      >
        <ArrowLeft className="size-5" />
      </Button>
      <Avatar className="size-10 border border-white/20">
        <AvatarFallback className="bg-[#128c7e] text-sm font-semibold text-white">
          BF
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium leading-tight">BetFlexx Support</p>
        <p className="text-xs text-white/80">online</p>
      </div>
    </header>
  )
}

function GuestPrompt({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#e5ddd5]">
      <WhatsAppHeader onBack={onBack} />
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#25d366]/15">
          <MessageCircle className="size-8 text-[#075e54]" />
        </div>
        <h3 className="text-lg font-semibold text-[#111b21]">Chat with support</h3>
        <p className="mt-2 max-w-xs text-sm text-[#667781]">
          Log in to message our support team. We typically reply within a few hours.
        </p>
        <Button
          asChild
          className="mt-6 bg-[#25d366] text-white hover:bg-[#20bd5a]"
        >
          <Link href="/login?redirect=/">Log in to continue</Link>
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
    <div className="flex min-h-0 flex-1 flex-col bg-[#e5ddd5]">
      <WhatsAppHeader onBack={onBack} />
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-normal text-[#111b21]">Enter your name</h3>
            <p className="mt-2 text-sm text-[#667781]">
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
              className="h-12 rounded-lg border-[#d1d7db] bg-white text-base focus-visible:ring-[#25d366]"
            />
            <Button
              type="submit"
              disabled={isSubmitting || name.trim().length < 2}
              className="h-12 w-full rounded-lg bg-[#25d366] text-base font-medium text-white hover:bg-[#20bd5a]"
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
            ? "rounded-lg rounded-tr-none bg-[#d9fdd3] text-[#111b21]"
            : "rounded-lg rounded-tl-none bg-white text-[#111b21]",
          message.pending && "opacity-70"
        )}
      >
        <p className="whitespace-pre-wrap break-words pr-12 text-[15px] leading-snug">
          {message.body}
        </p>
        <span className="absolute bottom-1 right-2 text-[11px] text-[#667781]">
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
    markAsRead({ ...authArgs, conversationId }).catch(() => {})
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
    <div className="flex min-h-0 flex-1 flex-col bg-[#e5ddd5]">
      <WhatsAppHeader onBack={onBack} />

      <div
        className="min-h-0 flex-1 overflow-y-auto py-3"
        style={{
          backgroundColor: "#e5ddd5",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8b8a8' fill-opacity='0.18'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {serverMessages === undefined && pendingMessages.length === 0 && (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-[#667781]" />
          </div>
        )}

        <div className="space-y-1">
          {allMessages.map((message) => (
            <MessageBubble key={message._id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 bg-[#f0f2f5] px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            disabled={isSending}
            className="h-11 flex-1 rounded-full border-0 bg-white px-4 text-[15px] shadow-sm focus-visible:ring-[#25d366]"
          />
          <Button
            type="button"
            size="icon"
            disabled={!draft.trim() || isSending}
            onClick={handleSend}
            aria-label="Send message"
            className="size-11 shrink-0 rounded-full bg-[#25d366] text-white hover:bg-[#20bd5a] disabled:bg-[#8696a0]"
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
      <div className="flex flex-1 items-center justify-center bg-[#e5ddd5]">
        <Loader2 className="size-6 animate-spin text-[#667781]" />
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
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/40">
      <div className="flex h-[100dvh] w-full max-w-md flex-col bg-[#e5ddd5] shadow-xl md:my-4 md:h-[calc(100dvh-2rem)] md:max-h-[820px] md:rounded-lg md:overflow-hidden">
        {content}
      </div>
    </div>
  )
}
