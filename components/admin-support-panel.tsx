import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { Loader2, MessageSquare, Send, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useAuth } from "@/lib/auth/AuthContext"
import { getSessionToken } from "@/lib/auth/session"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type Conversation = {
  _id: Id<"support_conversations">
  userId: Id<"users">
  displayName?: string
  status: "open" | "closed"
  lastMessageAt: number
  lastMessagePreview?: string
  unreadByAdmin: number
  unreadByUser: number
  createdAt: number
  userPhone: string
}

type SupportMessage = {
  _id: Id<"support_messages">
  conversationId: Id<"support_conversations">
  senderId: Id<"users">
  senderRole: "user" | "admin"
  body: string
  createdAt: number
}

function useSupportAuthArgs() {
  const { user } = useAuth()
  const sessionToken = getSessionToken()

  return React.useMemo(() => {
    if (!user || !sessionToken) return null
    return { sessionToken, userId: user._id }
  }, [user, sessionToken])
}

function formatRelativeTime(value: number) {
  const diffSeconds = Math.round((value - Date.now()) / 1000)
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ]

  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return formatter.format(Math.round(diffSeconds / seconds), unit)
    }
  }
  return "just now"
}

function formatMessageTime(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(value)
}

function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading,
}: {
  conversations: Conversation[] | undefined
  selectedId: Id<"support_conversations"> | null
  onSelect: (id: Id<"support_conversations">) => void
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground/50" />
      </div>
    )
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <div className="mb-4 rounded-full bg-muted/50 p-4">
          <MessageSquare className="size-6 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-semibold text-foreground">No conversations yet</p>
        <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">
          When users reach out for support, their messages will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-2">
      <div className="flex flex-col gap-1">
        {conversations.map((conversation) => (
          <button
            key={conversation._id}
            type="button"
            onClick={() => onSelect(conversation._id)}
            className={cn(
              "group relative flex w-full flex-col gap-1 rounded-lg px-3 py-3 text-left text-sm transition-all duration-200",
              selectedId === conversation._id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-foreground hover:bg-muted/80"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold">
                {conversation.displayName ?? conversation.userPhone}
              </span>
              <span
                className={cn(
                  "shrink-0 text-[10px] font-medium",
                  selectedId === conversation._id
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground group-hover:text-foreground/70"
                )}
              >
                {formatRelativeTime(conversation.lastMessageAt)}
              </span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <span
                className={cn(
                  "line-clamp-2 text-xs leading-relaxed",
                  selectedId === conversation._id
                    ? "text-primary-foreground/90"
                    : "text-muted-foreground"
                )}
              >
                {conversation.lastMessagePreview ?? "No messages yet"}
              </span>
              {conversation.unreadByAdmin > 0 && (
                <Badge
                  variant={selectedId === conversation._id ? "secondary" : "default"}
                  className="mt-0.5 h-5 min-w-5 shrink-0 justify-center rounded-full px-1.5 text-[10px]"
                >
                  {conversation.unreadByAdmin > 9 ? "9+" : conversation.unreadByAdmin}
                </Badge>
              )}
            </div>

            {conversation.status === "closed" && (
              <Badge
                variant="outline"
                className={cn(
                  "absolute right-3 top-3 h-4 text-[9px] uppercase tracking-wider",
                  selectedId === conversation._id
                    ? "border-primary-foreground/20 text-primary-foreground/80"
                    : "border-border text-muted-foreground"
                )}
              >
                Closed
              </Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function AdminChatThread({
  authArgs,
  conversation,
  onBack,
}: {
  authArgs: { sessionToken: string; userId: Id<"users"> }
  conversation: Conversation
  onBack: () => void
}) {
  const [draft, setDraft] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const sendMessage = useMutation(api.supportChat.sendMessage)
  const markAsRead = useMutation(api.supportChat.markAsRead)
  const closeConversation = useMutation(api.supportChat.closeConversation)
  const reopenConversation = useMutation(api.supportChat.reopenConversation)

  const messages = useQuery(api.supportChat.getMessages, {
    ...authArgs,
    conversationId: conversation._id,
  }) as SupportMessage[] | undefined

  React.useEffect(() => {
    markAsRead({ ...authArgs, conversationId: conversation._id }).catch(() => { })
  }, [authArgs, conversation._id, markAsRead, messages?.length])

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages?.length, conversation._id])

  async function handleSend() {
    const body = draft.trim()
    if (!body || isSending) return

    try {
      setIsSending(true)
      await sendMessage({
        ...authArgs,
        conversationId: conversation._id,
        body,
      })
      setDraft("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  async function toggleStatus() {
    try {
      if (conversation.status === "open") {
        await closeConversation({ ...authArgs, conversationId: conversation._id })
        toast.success("Conversation closed")
      } else {
        await reopenConversation({ ...authArgs, conversationId: conversation._id })
        toast.success("Conversation reopened")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update conversation")
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background/50">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-ml-2 shrink-0 md:hidden"
            onClick={onBack}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold tracking-tight">
              {conversation.displayName ?? conversation.userPhone}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{conversation.userPhone}</span>
              <span className="size-1 rounded-full bg-border" />
              <span
                className={cn(
                  "font-medium",
                  conversation.status === "open" ? "text-emerald-500" : "text-muted-foreground"
                )}
              >
                {conversation.status === "open" ? "Active" : "Closed"}
              </span>
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant={conversation.status === "open" ? "outline" : "default"}
          size="sm"
          onClick={toggleStatus}
          className="h-8 shadow-sm"
        >
          {conversation.status === "open" ? "Close Chat" : "Reopen Chat"}
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex min-h-full flex-col justify-end space-y-4 py-6">
          {messages === undefined && (
            <div className="flex flex-1 items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground/30" />
            </div>
          )}

          {messages?.map((message) => (
            <div
              key={message._id}
              className={cn(
                "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                message.senderRole === "admin" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "group relative flex max-w-[85%] flex-col gap-1 rounded-2xl px-4 py-2.5 text-sm shadow-sm md:max-w-[75%]",
                  message.senderRole === "admin"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm border border-border/50 bg-card text-card-foreground"
                )}
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                  {message.body}
                </p>
                <span
                  className={cn(
                    "select-none text-[10px] font-medium",
                    message.senderRole === "admin"
                      ? "text-right text-primary-foreground/60"
                      : "text-muted-foreground"
                  )}
                >
                  {formatMessageTime(message.createdAt)}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} className="h-1 shrink-0" />
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-border/50 bg-background/80 p-4 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-4xl items-end gap-3">
          <div className="relative flex-1">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                conversation.status === "closed"
                  ? "This conversation is closed."
                  : "Type your reply..."
              }
              rows={1}
              disabled={isSending || conversation.status === "closed"}
              className="min-h-[48px] w-full resize-none rounded-xl border-border/50 bg-card pr-12 pt-3 shadow-sm focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
            />
          </div>
          <Button
            type="button"
            size="icon"
            className="size-12 shrink-0 rounded-xl shadow-sm transition-transform active:scale-95 disabled:pointer-events-none"
            disabled={!draft.trim() || isSending || conversation.status === "closed"}
            onClick={handleSend}
            aria-label="Send reply"
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

export function AdminSupportPanel() {
  const authArgs = useSupportAuthArgs()
  const [selectedId, setSelectedId] = React.useState<Id<"support_conversations"> | null>(null)
  const [showThreadOnMobile, setShowThreadOnMobile] = React.useState(false)

  const conversations = useQuery(
    api.supportChat.listConversations,
    authArgs ?? "skip"
  ) as Conversation[] | undefined

  const selectedConversation =
    conversations?.find((conversation) => conversation._id === selectedId) ?? null

  React.useEffect(() => {
    if (!selectedId && conversations && conversations.length > 0) {
      setSelectedId(conversations[0]._id)
    }
  }, [conversations, selectedId])

  function handleSelect(id: Id<"support_conversations">) {
    setSelectedId(id)
    setShowThreadOnMobile(true)
  }

  if (!authArgs) {
    return null
  }

  const unreadTotal =
    conversations?.reduce((sum, conversation) => sum + conversation.unreadByAdmin, 0) ?? 0

  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-[500px] flex-col gap-4">
      {/* Page Header */}
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Support Center</h1>
        {unreadTotal > 0 && (
          <Badge variant="destructive" className="animate-in zoom-in shadow-sm">
            {unreadTotal} pending action{unreadTotal !== 1 && "s"}
          </Badge>
        )}
      </div>

      {/* Main Layout Container */}
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">

        {/* Sidebar */}
        <div
          className={cn(
            "flex w-full flex-col border-r border-border/50 bg-muted/20 md:w-[320px] lg:w-[380px] shrink-0",
            showThreadOnMobile && selectedConversation ? "hidden md:flex" : "flex flex-1 md:flex-none"
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 px-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Threads
            </p>
          </div>
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={handleSelect}
            isLoading={conversations === undefined}
          />
        </div>

        {/* Thread Area */}
        <div
          className={cn(
            "flex min-w-0 flex-col bg-background",
            !showThreadOnMobile && !selectedConversation ? "hidden md:flex flex-1" : "flex flex-1"
          )}
        >
          {selectedConversation ? (
            <AdminChatThread
              authArgs={authArgs}
              conversation={selectedConversation}
              onBack={() => setShowThreadOnMobile(false)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 fade-in">
              <div className="mb-6 rounded-full bg-muted/50 p-6">
                <MessageSquare className="size-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Select a conversation
              </h3>
              <p className="mt-2 max-w-[250px] text-sm text-muted-foreground">
                Choose a support thread from the sidebar to view details and reply to the user.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}