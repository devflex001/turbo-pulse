"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { Loader2, MessageSquare, Send } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useAuth } from "@/lib/auth/AuthContext"
import { getSessionToken } from "@/lib/auth/session"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <MessageSquare className="mb-3 size-8 text-muted-foreground" />
        <p className="text-sm font-medium">No conversations yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          User messages will appear here.
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y divide-border">
        {conversations.map((conversation) => (
          <button
            key={conversation._id}
            type="button"
            onClick={() => onSelect(conversation._id)}
            className={cn(
              "w-full px-4 py-3 text-left transition-colors hover:bg-muted/50",
              selectedId === conversation._id && "bg-primary/5"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">
                    {conversation.displayName ?? conversation.userPhone}
                  </p>
                  {conversation.status === "closed" && (
                    <Badge variant="outline" className="h-5 text-[10px]">
                      Closed
                    </Badge>
                  )}
                </div>
                <p className="truncate text-[11px] text-muted-foreground">
                  {conversation.userPhone}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {conversation.lastMessagePreview ?? "No messages yet"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(conversation.lastMessageAt)}
                </span>
                {conversation.unreadByAdmin > 0 && (
                  <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {conversation.unreadByAdmin > 9 ? "9+" : conversation.unreadByAdmin}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  )
}

function AdminChatThread({
  authArgs,
  conversation,
}: {
  authArgs: { sessionToken: string; userId: Id<"users"> }
  conversation: Conversation
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
    markAsRead({ ...authArgs, conversationId: conversation._id }).catch(() => {})
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold">
            {conversation.displayName ?? conversation.userPhone}
          </p>
          <p className="text-xs text-muted-foreground">{conversation.userPhone}</p>
          <p className="text-xs text-muted-foreground">
            {conversation.status === "open" ? "Active conversation" : "Closed conversation"}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={toggleStatus}>
          {conversation.status === "open" ? "Close" : "Reopen"}
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-4">
        <div className="space-y-3 py-4">
          {messages === undefined && (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {messages?.map((message) => (
            <div
              key={message._id}
              className={cn(
                "flex",
                message.senderRole === "admin" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm",
                  message.senderRole === "admin"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md border border-border bg-muted/60 text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    message.senderRole === "admin"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  )}
                >
                  {formatMessageTime(message.createdAt)}
                </p>
              </div>
            </div>
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
            placeholder="Reply to user..."
            rows={2}
            disabled={isSending || conversation.status === "closed"}
            className="min-h-[44px] resize-none focus-visible:ring-primary"
          />
          <Button
            type="button"
            size="icon"
            className="size-10 shrink-0"
            disabled={!draft.trim() || isSending || conversation.status === "closed"}
            onClick={handleSend}
            aria-label="Send reply"
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

export function AdminSupportPanel() {
  const authArgs = useSupportAuthArgs()
  const [selectedId, setSelectedId] =
    React.useState<Id<"support_conversations"> | null>(null)
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
    <div className="flex h-[calc(100vh-7rem)] min-h-[520px] flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Support Chat</h1>
          <p className="text-xs text-muted-foreground">
            Reply to user messages in real time.
          </p>
        </div>
        {unreadTotal > 0 && (
          <Badge variant="secondary">{unreadTotal} unread</Badge>
        )}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-card">
        <div
          className={cn(
            "flex w-full flex-col border-r border-border md:w-80 lg:w-96",
            showThreadOnMobile && selectedConversation ? "hidden md:flex" : "flex"
          )}
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Conversations
            </p>
          </div>
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={handleSelect}
            isLoading={conversations === undefined}
          />
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            !showThreadOnMobile && !selectedConversation ? "hidden md:flex" : "flex"
          )}
        >
          {selectedConversation ? (
            <>
              <div className="flex items-center border-b border-border px-4 py-2 md:hidden">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowThreadOnMobile(false)}
                >
                  Back
                </Button>
              </div>
              <AdminChatThread authArgs={authArgs} conversation={selectedConversation} />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <MessageSquare className="mb-3 size-8 text-muted-foreground" />
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose a user from the list to view and reply.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
