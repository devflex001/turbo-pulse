"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const CANCEL_WINDOW_MS = 5 * 60 * 1000

interface PieCountdownProps {
  deadline: number
  start?: number
  size?: number
  className?: string
  showLabel?: boolean
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "Closed"

  const totalSeconds = Math.ceil(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export function getCancelDeadline(selections: { matchStartTime?: number }[]) {
  const startTimes = selections
    .map((s) => s.matchStartTime)
    .filter((t): t is number => typeof t === "number" && t > 0)

  if (startTimes.length === 0) return null
  return Math.min(...startTimes) - CANCEL_WINDOW_MS
}

export function canCancelBet(
  selections: { matchStartTime?: number }[],
  placedAt?: number
) {
  const deadline = getCancelDeadline(selections)
  if (!deadline) return false
  if (Date.now() >= deadline) return false
  if (placedAt && deadline <= placedAt) return false
  return true
}

export function PieCountdown({
  deadline,
  start,
  size = 52,
  className,
  showLabel = true,
}: PieCountdownProps) {
  const [now, setNow] = React.useState(Date.now())

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const remaining = Math.max(0, deadline - now)
  const windowStart = start ?? deadline - CANCEL_WINDOW_MS
  const total = Math.max(deadline - windowStart, 1)
  const progress = Math.min(1, Math.max(0, remaining / total))

  const stroke = 4
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)
  const closed = remaining <= 0

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--muted-foreground)"
            strokeOpacity={0.2}
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={closed ? "var(--muted-foreground)" : "var(--primary)"}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "text-[9px] font-bold font-mono leading-none text-center px-0.5",
              closed ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {formatRemaining(remaining)}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="text-[9px] text-muted-foreground uppercase tracking-wide text-center">
          {closed ? "Cancel closed" : "Cancel window"}
        </span>
      )}
    </div>
  )
}

export { CANCEL_WINDOW_MS }
