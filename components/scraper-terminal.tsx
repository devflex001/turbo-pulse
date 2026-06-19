"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"

interface RunSummaryProps {
  run: {
    _id: string
    status: string
    startedAt: number
    finishedAt: number | null
    durationMs: number | null
    matchesDiscovered: number
    matchesUpserted: number
    marketsUpserted: number
    oddsUpserted: number
    failedMatches: number
    errorSummary: string | null
    selectedSports?: string[]
    triggeredBy: string
  } | null
  isRunning?: boolean
}

export function ScraperTerminal({ run, isRunning = false }: RunSummaryProps) {
  if (!run) {
    return (
      <div className="border rounded-md p-4 text-sm text-muted-foreground text-center">
        No run data available
      </div>
    )
  }

  const duration = run.durationMs
    ? run.durationMs < 60_000
      ? `${(run.durationMs / 1000).toFixed(1)}s`
      : `${(run.durationMs / 60_000).toFixed(1)}m`
    : isRunning
    ? "In progress…"
    : "—"

  const startedAt = new Date(run.startedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Started {startedAt} · {duration}
        </span>
        <Badge
          variant={
            run.status === "success"
              ? "default"
              : run.status === "running"
              ? "secondary"
              : "destructive"
          }
          className="text-[10px] uppercase"
        >
          {run.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="border rounded-md p-2 text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">Discovered</p>
          <p className="text-sm font-semibold font-mono">{run.matchesDiscovered}</p>
        </div>
        <div className="border rounded-md p-2 text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">Saved</p>
          <p className="text-sm font-semibold font-mono">{run.matchesUpserted}</p>
        </div>
        <div className="border rounded-md p-2 text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">Markets</p>
          <p className="text-sm font-semibold font-mono">{run.marketsUpserted}</p>
        </div>
        <div className="border rounded-md p-2 text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">Odds</p>
          <p className="text-sm font-semibold font-mono">{run.oddsUpserted}</p>
        </div>
      </div>

      {run.failedMatches > 0 && (
        <div className="border border-destructive/30 rounded-md p-2 text-xs text-destructive">
          <span className="font-semibold">{run.failedMatches} failed</span>
          {run.errorSummary && (
            <p className="mt-1 text-muted-foreground whitespace-pre-wrap break-words line-clamp-4">
              {run.errorSummary}
            </p>
          )}
        </div>
      )}

      {isRunning && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Processing matches…
        </p>
      )}
    </div>
  )
}
