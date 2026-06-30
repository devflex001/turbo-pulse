"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck, Trash2, ArrowUpFromLine } from "lucide-react"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useAuth } from "@/lib/auth/AuthContext"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { WithdrawModal } from "@/components/modals"

type Notification = {
  _id: Id<"notifications">
  type: "payment" | "bet" | "match" | "withdrawal" | "system"
  title: string
  message: string
  href?: string
  readAt: number | null
  createdAt: number
  metadata?: {
    betId?: Id<"bets">
    transactionId?: Id<"transactions">
    withdrawalId?: Id<"withdrawal_requests">
    sourceMatchId?: string
    amount?: number
  }
}

interface NotificationsCenterProps {
  className?: string
}

function formatRelativeTime(value: number) {
  const diffSeconds = Math.round((value - Date.now()) / 1000)
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
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

function NotificationTypeBadge({ type }: { type: Notification["type"] }) {
  const config = {
    payment: {
      label: "Payment",
      className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
    },
    bet: {
      label: "Bet",
      className: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
    },
    match: {
      label: "Match",
      className: "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400",
    },
    withdrawal: {
      label: "Withdrawal",
      className: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
    },
    system: {
      label: "System",
      className: "bg-gray-500/10 text-gray-700 border-gray-500/20 dark:text-gray-400",
    },
  }

  const { label, className } = config[type]

  return (
    <Badge
      variant="outline"
      className={cn("h-5 rounded px-1.5 text-[10px] font-medium", className)}
    >
      {label}
    </Badge>
  )
}

function NotificationsList({
  notifications,
  isLoading,
  userId,
  onNavigate,
}: {
  notifications: Notification[] | undefined
  isLoading: boolean
  userId: Id<"users">
  onNavigate: () => void
}) {
  const router = useRouter()
  const markRead = useMutation(api.notifications.markRead)
  const markAllRead = useMutation(api.notifications.markAllRead)
  const removeNotification = useMutation(api.notifications.remove)
  const [withdrawOpen, setWithdrawOpen] = React.useState(false)

  const unreadCount = notifications?.filter((item) => item.readAt === null).length ?? 0

  async function openNotification(notification: Notification) {
    if (notification.readAt === null) {
      await markRead({ userId, notificationId: notification._id })
    }

    if (notification.href) {
      router.push(notification.href)
      onNavigate()
    }
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-11 items-center justify-between border-y border-border px-4">
          <span className="text-xs text-muted-foreground">
            {unreadCount === 0 ? "No unread notifications" : `${unreadCount} unread`}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-xs"
            disabled={unreadCount === 0}
            onClick={() => markAllRead({ userId })}
          >
            <CheckCheck className="size-3.5" />
            Mark all read
          </Button>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-16 w-full rounded" />
                <Skeleton className="h-16 w-full rounded" />
                <Skeleton className="h-16 w-full rounded" />
              </div>
            ) : notifications && notifications.length > 0 ? (
              notifications.map((notification) => {
                const isWinningBet =
                  notification.type === "bet" && notification.title === "Bet won"

                return (
                  <div
                    key={notification._id}
                    className={cn(
                      "group grid grid-cols-[1fr_auto] gap-2 px-4 py-3 transition-colors",
                      notification.readAt === null ? "bg-primary/5" : "bg-background",
                      !isWinningBet && notification.href && "cursor-pointer hover:bg-muted/60"
                    )}
                    onClick={() => !isWinningBet && openNotification(notification)}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        {notification.readAt === null && (
                          <span
                            className="size-2 rounded-full bg-primary"
                            aria-hidden="true"
                          />
                        )}
                        <p className="truncate text-sm font-semibold">
                          {notification.title}
                        </p>
                      </div>
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <NotificationTypeBadge type={notification.type} />
                        {isWinningBet && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-5 px-2 gap-1 text-[10px] font-medium text-[#4b9f71] hover:bg-[#4b9f71]/10 hover:text-[#4b9f71]"
                            onClick={(e) => {
                              e.stopPropagation()
                              setWithdrawOpen(true)
                            }}
                          >
                            <ArrowUpFromLine className="size-3" />
                            <span>Withdraw</span>
                          </Button>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Delete notification"
                      onClick={(event) => {
                        event.stopPropagation()
                        removeNotification({ userId, notificationId: notification._id })
                      }}
                    >
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                )
              })
            ) : (
              <div className="px-4 py-12 text-center">
                <Bell className="mx-auto mb-3 size-6 text-muted-foreground" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Important account activity will appear here.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </>
  )
}

export function NotificationsCenter({ className }: NotificationsCenterProps) {
  const { user } = useAuth()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [open, setOpen] = React.useState(false)

  const notifications = useQuery(
    api.notifications.listMine,
    user ? { userId: user._id, limit: 30 } : "skip"
  ) as Notification[] | undefined
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user ? { userId: user._id } : "skip"
  )

  if (!user) {
    return null
  }

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative size-8 rounded-full border border-border hover:bg-muted/50", className)}
      aria-label="Notifications"
    >
      <Bell className="size-4 text-muted-foreground" />
      {typeof unreadCount === "number" && unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-destructive-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Button>
  )

  const body = (
    <NotificationsList
      notifications={notifications}
      isLoading={notifications === undefined}
      userId={user._id}
      onNavigate={() => setOpen(false)}
    />
  )

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="right" className="w-[420px] p-0 sm:max-w-[420px]">
          <SheetHeader className="p-4 pr-12">
            <SheetTitle>Notifications</SheetTitle>
            {/* <SheetDescription>Account activity and betting updates.</SheetDescription> */}
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="h-[82vh]">
        <DrawerHeader className="px-4 pb-4 pt-5 text-left">
          <DrawerTitle>Notifications</DrawerTitle>
          {/* <DrawerDescription>Account activity and betting updates.</DrawerDescription> */}
        </DrawerHeader>
        {body}
      </DrawerContent>
    </Drawer>
  )
}

