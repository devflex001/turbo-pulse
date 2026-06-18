"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

interface ScraperTerminalProps {
  runId: Id<"scrapeRuns"> | null
  isRunning?: boolean
}

export function ScraperTerminal({ runId, isRunning = false }: ScraperTerminalProps) {
  const logs = useQuery(
    runId ? (api.scraper.getLogs as any) : null, 
    runId ? { runId } : "skip"
  )
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [logs])

  if (!runId) {
    return (
      <div className="bg-black rounded-lg p-3 font-mono text-xs text-green-400 h-80 flex items-center justify-center border border-green-900/30">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No active run</p>
        </div>
      </div>
    )
  }

  if (logs === undefined) {
    return (
      <div className="bg-black rounded-lg p-3 font-mono text-xs text-green-400 h-80 space-y-2 border border-green-900/30">
        <Skeleton className="h-3 w-full bg-green-900/20" />
        <Skeleton className="h-3 w-4/5 bg-green-900/20" />
        <Skeleton className="h-3 w-3/4 bg-green-900/20" />
      </div>
    )
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-400"
      case "warn":
        return "text-yellow-400"
      case "success":
        return "text-green-400"
      case "info":
      default:
        return "text-cyan-400"
    }
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "error":
        return <Badge variant="destructive" className="text-[10px] uppercase">ERR</Badge>
      case "warn":
        return <Badge variant="secondary" className="text-[10px] uppercase">WARN</Badge>
      case "success":
        return <Badge className="text-[10px] uppercase bg-green-700 hover:bg-green-600">OK</Badge>
      case "info":
      default:
        return <Badge variant="outline" className="text-[10px] uppercase">INFO</Badge>
    }
  }

  return (
    <ScrollArea ref={scrollAreaRef} className="h-80 rounded-lg border border-green-900/30 bg-black">
      <div className="p-3 font-mono text-xs space-y-1">
        <div className="flex items-center gap-2 pb-3 border-b border-green-900/20 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400">bet-flow-scraper</span>
          <span className="text-green-700 text-[10px]">
            {isRunning ? "● running" : "● idle"}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="text-green-700 text-[10px] py-4">
            $ Waiting for logs...
          </div>
        ) : (
          logs.map((log: any) => {
            const time = new Date(log.timestamp).toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })

            return (
              <div
                key={log._id}
                className={`flex gap-2 items-start ${getLevelColor(log.level)}`}
              >
                <span className="text-green-700 flex-shrink-0 w-8">[{time}]</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getLevelBadge(log.level)}
                </div>
                <span className="break-words flex-1">{log.message}</span>
              </div>
            )
          })
        )}

        {isRunning && (
          <div className="flex gap-2 items-center text-green-400 mt-2">
            <span className="text-green-700">$</span>
            <span className="animate-pulse">_</span>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
