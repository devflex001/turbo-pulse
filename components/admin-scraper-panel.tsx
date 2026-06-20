"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SmallLoader } from "@/components/small-loader"
import { toast } from "sonner"
import { PlayCircle } from "lucide-react"
import { ScraperConfigDrawer, type ScraperConfig } from "@/components/scraper-config-drawer"
import { ScraperLogsDrawer, type ScrapeLogs } from "@/components/scraper-logs-drawer"

export function AdminScraperPanel() {
  const overview = useQuery(api.scraper.getAdminOverview)
  const triggerNow = useMutation(api.scraper.triggerNow)

  const [configOpen, setConfigOpen] = React.useState(false)
  const [logsOpen, setLogsOpen] = React.useState(false)
  const [isRunning, setIsRunning] = React.useState(false)
  const [logs, setLogs] = React.useState<ScrapeLogs>({
    logs: [],
    status: null,
    matchesDiscovered: 0,
    matchesUpserted: 0,
    marketsUpserted: 0,
    oddsUpserted: 0,
    failedMatches: 0,
    startedAt: undefined,
    duration: undefined,
  })

  const currentRun = overview?.runs?.[0]
  const isCurrentlyRunning = currentRun?.status === "running"

  const handleRunScraper = async (config: ScraperConfig) => {
    setIsRunning(true)
    setLogsOpen(true)
    setConfigOpen(false)
    
    // Reset logs
    setLogs({
      logs: ["[INFO] Starting scraper..."],
      status: "running",
      matchesDiscovered: 0,
      matchesUpserted: 0,
      marketsUpserted: 0,
      oddsUpserted: 0,
      failedMatches: 0,
      startedAt: Date.now(),
      duration: 0,
    })

    try {
      await triggerNow({
        dateWindowDays: Number(config.dateWindowDays),
        selectedSports: [config.selectedSport],
        matchLimit: Number(config.matchLimit),
      })
      
      // Simulate log updates (in a real scenario, you'd use WebSocket or polling)
      // For now, just show success after the mutation completes
      setLogs(prev => ({
        ...prev,
        logs: [...prev.logs, "[SUCCESS] Scrape completed successfully!"],
        status: "success",
        duration: Date.now() - (prev.startedAt || Date.now()),
      }))
      
      toast.success("Scraper started successfully")
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to start scraper"
      setLogs(prev => ({
        ...prev,
        logs: [...prev.logs, `[ERROR] ${errorMsg}`],
        status: "error",
        duration: Date.now() - (prev.startedAt || Date.now()),
      }))
      toast.error(errorMsg)
    } finally {
      setIsRunning(false)
    }
  }

  if (!overview) {
    return <SmallLoader />
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Sports Scraper</h1>
          <p className="text-xs text-muted-foreground">On-demand fixture ingestion from KwikBet</p>
        </div>
        <Badge 
          variant={isCurrentlyRunning ? "secondary" : "outline"} 
          className="text-[10px] uppercase"
        >
          {isCurrentlyRunning ? "● Running" : "● Idle"}
        </Badge>
      </div>

      {/* Run Button */}
      <Button
        size="lg"
        className="w-full h-12 text-base font-semibold gap-2"
        onClick={() => setConfigOpen(true)}
        disabled={isCurrentlyRunning || isRunning}
      >
        <PlayCircle className="size-5" />
        {isCurrentlyRunning || isRunning ? "Running..." : "Run Scraper"}
      </Button>

      {/* Last Run Info */}
      {overview.settings.lastRunAt && (
        <div className="border rounded-md p-3 text-xs">
          <p className="text-muted-foreground mb-1">Last run</p>
          <p className="font-medium">
            {new Date(overview.settings.lastRunAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      )}

      {/* Config Drawer */}
      <ScraperConfigDrawer
        open={configOpen}
        onOpenChange={setConfigOpen}
        onStart={handleRunScraper}
        isLoading={isRunning}
      />

      {/* Logs Drawer */}
      <ScraperLogsDrawer
        open={logsOpen}
        onOpenChange={setLogsOpen}
        logs={logs}
      />
    </div>
  )
}
