"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomEventCardProps {
  eventId: string
  title: string
  homeTeam: string
  awayTeam: string
  startTime: number
  competition: string
  status: "draft" | "published"
  totalMarkets: number
}

function formatStartTime(startTime: number) {
  if (!startTime) return "TBA"
  return new Date(startTime).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function CustomEventCard({
  eventId,
  title,
  homeTeam,
  awayTeam,
  startTime,
  competition,
  status,
  totalMarkets,
}: CustomEventCardProps) {
  const router = useRouter()

  const handleClick = () => {
    if (status === "published") {
      router.push(`/markets/${eventId}`)
    } else {
      router.push(`/admin/custom-events/${eventId}`)
    }
  }

  const matchTitle = `${homeTeam} vs ${awayTeam}`

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleClick()
    }
  }

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className={cn(
        "flex flex-col rounded-lg border text-left transition-all shadow-sm hover:shadow-md active:scale-95",
        "bg-gradient-to-br from-amber-50/80 to-yellow-50/50 dark:from-amber-950/30 dark:to-yellow-950/20",
        "border-amber-300/60 dark:border-amber-600/40 hover:border-amber-400/80 dark:hover:border-amber-500/60"
      )}
    >
      {/* Header with golden accent */}
      <div className="flex items-center justify-between px-4 py-3 rounded-t-lg bg-gradient-to-r from-amber-100/60 to-yellow-100/40 dark:from-amber-900/40 dark:to-yellow-900/30 border-b border-amber-200/50 dark:border-amber-700/30 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Crown className="size-4 text-amber-600 dark:text-amber-400 shrink-0 fill-amber-400 dark:fill-amber-500" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-amber-900 dark:text-amber-100 truncate">
              Your Custom Event
            </div>
            <div className="text-[10px] font-medium text-amber-700/70 dark:text-amber-300/70">
              {competition}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            className={cn(
              "text-[9px] font-semibold h-5 px-1.5",
              status === "draft"
                ? "bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300 border border-yellow-500/30 dark:border-yellow-500/25"
                : "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-500/20"
            )}
          >
            {status === "draft" ? "Draft" : "Live"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3.5 p-4 flex-1 justify-between">
        <div className="space-y-2">
          <h3 className="font-bold text-base text-foreground line-clamp-2">
            {title}
          </h3>
          <div className="flex justify-between items-center gap-4">
            <div className="flex flex-col gap-1.5 font-semibold text-sm flex-1 min-w-0">
              <div className="truncate text-foreground">{homeTeam}</div>
              <div className="truncate text-foreground">{awayTeam}</div>
            </div>
            <div className="flex flex-col gap-1.5 items-end text-xs text-muted-foreground shrink-0">
              <div>{formatStartTime(startTime)}</div>
              <div className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                {totalMarkets} markets
              </div>
            </div>
          </div>
        </div>

        {/* Golden CTA */}
        <Button
          variant="default"
          className={cn(
            "w-full h-9 text-xs font-semibold",
            "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 dark:from-amber-600 dark:to-yellow-600 dark:hover:from-amber-700 dark:hover:to-yellow-700",
            "text-white dark:text-white shadow-sm hover:shadow-md",
            "transition-all active:scale-95"
          )}
        >
          {status === "draft" ? "Edit Event & Markets" : "View Odds"}
        </Button>
      </div>
    </div>
  )
}
