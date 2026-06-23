"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  calculateEventTimer,
  formatCountdownToStart,
  formatTimerDisplay,
  getEventBadgeConfig,
  TOTAL_MATCH_DURATION,
} from "@/lib/event-timer"
import { Clock, ChevronRight } from "lucide-react"

interface CustomEventCardProps {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  startTime: number;
  competition: string;
  title: string;
  totalMarkets: number;
  onClick?: () => void;
}

/**
 * Professional custom event card with embedded timer
 * Timer runs client-side, DB only stores startTime
 */
export function CustomEventCard({
  eventId,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  startTime,
  competition,
  title,
  totalMarkets,
  onClick,
}: CustomEventCardProps) {
  const [now, setNow] = React.useState(() => Date.now());

  // Update timer every second (client-side only, no DB queries)
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timer = calculateEventTimer(startTime, now);
  const badgeConfig = getEventBadgeConfig(timer.lifecycle);

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden border-border bg-card transition-all hover:border-primary/50 hover:shadow-md cursor-pointer",
        timer.isLive && "border-primary/40"
      )}
    >
      {/* Background gradient for live events */}
      {timer.isLive && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
      )}

      <div className="relative space-y-3 p-4">
        {/* Header: Competition + Badge + Markets */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium">
              {competition}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant={badgeConfig.variant}
              className={cn(
                "text-[10px] font-semibold whitespace-nowrap",
                badgeConfig.animate &&
                "animate-pulse"
              )}
            >
              {badgeConfig.label}
            </Badge>
          </div>
        </div>

        {/* Teams & Score */}
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            {/* Home Team */}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {homeTeam}
              </p>
            </div>

            {/* Score Display */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {homeScore}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">
                vs
              </p>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {awayScore}
                </p>
              </div>
            </div>

            {/* Away Team */}
            <div className="min-w-0 text-right">
              <p className="text-sm font-semibold text-foreground truncate">
                {awayTeam}
              </p>
            </div>
          </div>

          {/* Match Title */}
          {title && (
            <p className="text-xs text-muted-foreground text-center">
              {title}
            </p>
          )}
        </div>

        {/* Progress Bar & Timer */}
        <div className="space-y-2">
          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress
              value={timer.progressPercent}
              className="h-1.5 bg-muted"
            />
          </div>

          {/* Timer Display */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="size-3.5 shrink-0 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground whitespace-nowrap">
                {timer.lifecycle === "not_started"
                  ? formatCountdownToStart(timer.remainingMs)
                  : formatTimerDisplay(timer.remainingMs)}
              </p>
            </div>

            {/* Market Count */}
            <p className="text-xs text-muted-foreground font-medium">
              {totalMarkets} markets
            </p>
          </div>

          {/* Status Text */}
          <p className="text-xs text-muted-foreground">
            {timer.displayText}
          </p>
        </div>

        {/* Footer: View Button */}
        <div className="pt-2 border-t border-border/50 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Match ID: {eventId.slice(0, 8)}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs px-2 text-primary hover:text-primary hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            View
            <ChevronRight className="size-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
