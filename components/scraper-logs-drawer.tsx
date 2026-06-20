"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

export interface ScrapeLogs {
  logs: string[]
  status: "running" | "success" | "error" | null
  matchesDiscovered?: number
  matchesUpserted?: number
  marketsUpserted?: number
  oddsUpserted?: number
  failedMatches?: number
  startedAt?: number
  duration?: number
}

interface ScraperLogsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  logs: ScrapeLogs
}

export function ScraperLogsDrawer({
  open,
  onOpenChange,
  logs,
}: ScraperLogsDrawerProps) {
  const logsEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs.logs])

  const formatDuration = (ms?: number) => {
    if (!ms) return "—"
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60_000).toFixed(1)}m`
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "success":
        return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
      case "error":
        return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
      case "running":
        return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
      default:
        return "bg-muted/50"
    }
  }

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case "success":
        return "default"
      case "error":
        return "destructive"
      case "running":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh] flex flex-col">
        <DrawerHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <DrawerTitle>Scrape Logs</DrawerTitle>
              <DrawerDescription>
                Real-time scraper execution logs
              </DrawerDescription>
            </div>
            <Badge
              variant={getStatusBadgeVariant(logs.status)}
              className="text-[10px] uppercase"
            >
              {logs.status || "idle"}
            </Badge>
          </div>
        </DrawerHeader>

        {/* Stats */}
        {logs.status && (
          <div className="flex-shrink-0 px-4 py-3 border-b bg-muted/50">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="text-center">
                <p className="text-muted-foreground mb-0.5">Discovered</p>
                <p className="font-mono font-semibold">{logs.matchesDiscovered || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground mb-0.5">Saved</p>
                <p className="font-mono font-semibold">{logs.matchesUpserted || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground mb-0.5">Markets</p>
                <p className="font-mono font-semibold">{logs.marketsUpserted || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground mb-0.5">Odds</p>
                <p className="font-mono font-semibold">{logs.oddsUpserted || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground mb-0.5">Duration</p>
                <p className="font-mono font-semibold">{formatDuration(logs.duration)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Logs Container */}
        <div className="flex-1 overflow-y-auto bg-black dark:bg-slate-950 p-4 font-mono text-xs">
          <div className="space-y-1">
            {logs.logs.length === 0 ? (
              <p className="text-muted-foreground">
                {logs.status === "running"
                  ? "Waiting for logs..."
                  : "No logs available"}
              </p>
            ) : (
              logs.logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    log.includes("[ERROR]") || log.includes("error")
                      ? "text-red-400"
                      : log.includes("[SUCCESS]") || log.includes("success")
                      ? "text-green-400"
                      : log.includes("[WARN]")
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                >
                  {log}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t bg-muted/50 px-4 py-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            {logs.status === "running" ? "Minimize" : "Close"}
          </Button>
          {logs.status !== "running" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(logs.logs.join("\n"))
              }}
              className="w-full"
            >
              Copy Logs
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
