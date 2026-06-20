"use client"

import * as React from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useMediaQuery } from "@/hooks/use-media-query"

interface ScraperLiveLogsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  logs: string[]
  running: boolean
}

export function ScraperLiveLogs({ open, onOpenChange, logs, running }: ScraperLiveLogsProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [autoScroll, setAutoScroll] = React.useState(true)
  const logsContainer = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (autoScroll && logsContainer.current) {
      logsContainer.current.scrollTop = logsContainer.current.scrollHeight
    }
  }, [logs, autoScroll])

  const content = (
    <div className="flex flex-col h-full gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Live Logs</span>
        {running && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Running</span>
            </span>
          </div>
        )}
      </div>

      {/* Log Container */}
      <div
        ref={logsContainer}
        className="bg-black/5 dark:bg-black/20 font-mono text-[10px] sm:text-[11px] flex-1 overflow-y-auto rounded-md p-3 space-y-1"
      >
        {logs.length === 0 ? (
          <div className="text-muted-foreground text-[10px]">Waiting for logs...</div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="text-muted-foreground whitespace-pre-wrap break-words">
              {log}
            </div>
          ))
        )}
      </div>

      {/* Auto-scroll toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={autoScroll}
          onChange={(e) => setAutoScroll(e.target.checked)}
          className="w-3 h-3"
        />
        <span className="text-xs text-muted-foreground">Auto-scroll</span>
      </label>
    </div>
  )

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-96 flex flex-col">
          <SheetHeader>
            <SheetTitle>Scraper Status</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Scraper Status</DrawerTitle>
        </DrawerHeader>
        <div className="h-96">{content}</div>
      </DrawerContent>
    </Drawer>
  )
}
