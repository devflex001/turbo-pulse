"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { SmallLoader } from "@/components/small-loader"
import { toast } from "sonner"
import { PlayCircle, Save, ChevronDown, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Card, CardContent } from "@/components/ui/card"
import { ScraperTerminal } from "@/components/scraper-terminal"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { Id } from "@/convex/_generated/dataModel"

// 8 Most popular sports with correct IDs from KwikBet
const AVAILABLE_SPORTS = [
  { id: 1, label: "Soccer" },
  { id: 2, label: "Basketball" },
  { id: 5, label: "Tennis" },
  { id: 16, label: "American Football" },
  { id: 21, label: "Cricket" },
  { id: 10, label: "Boxing" },
  { id: 117, label: "MMA" },
  { id: 12, label: "Rugby" },
]

const MATCH_LIMITS = [
  { value: "20", label: "20" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
  { value: "200", label: "200" },
  { value: "300", label: "300" },
  { value: "500", label: "500" },
]

interface RunDetail {
  _id: Id<"scrapeRuns">
  _creationTime: number
  source: string
  status: string
  triggeredBy: string
  startedAt: number
  finishedAt: number | null
  durationMs: number | null
  dateFrom: string
  dateTo: string
  selectedSports?: string[]
  matchesDiscovered: number
  matchesUpserted: number
  marketsUpserted: number
  oddsUpserted: number
  failedMatches: number
  errorSummary: string | null
}

export function AdminScraperPanel() {
  const overview = useQuery(api.scraper.getAdminOverview)
  const updateSettings = useMutation(api.scraper.updateSettings)
  const triggerNow = useMutation(api.scraper.triggerNow)

  const [selectedSport, setSelectedSport] = React.useState<string>("")
  const [cadenceMinutes, setCadenceMinutes] = React.useState<string>("")
  const [dateWindowDays, setDateWindowDays] = React.useState<string>("")
  const [matchLimit, setMatchLimit] = React.useState<string>("")
  const [saving, setSaving] = React.useState(false)
  const [running, setRunning] = React.useState(false)
  const [showTerminal, setShowTerminal] = React.useState(false)
  const [selectedRun, setSelectedRun] = React.useState<RunDetail | null>(null)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const settings = overview?.settings as any
  const currentRun = overview?.runs?.[0]
  const isCurrentlyRunning = currentRun?.status === "running"

  // Initialize form with settings
  React.useEffect(() => {
    if (settings) {
      setSelectedSport(String(settings.selectedSports?.[0] ?? settings.selectedSports?.[0] ?? 1))
      setCadenceMinutes(String(settings.cadenceMinutes ?? 5))
      setDateWindowDays(String(settings.dateWindowDays ?? 2))
      setMatchLimit(String(settings.matchLimit ?? 50))
    }
  }, [settings])

  // Auto-open terminal when scraper starts running
  React.useEffect(() => {
    if (isCurrentlyRunning && !showTerminal) {
      setShowTerminal(true)
    }
  }, [isCurrentlyRunning, showTerminal])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings({
        enabled: true,
        cadenceMinutes: Number(cadenceMinutes),
        dateWindowDays: Number(dateWindowDays),
        selectedSports: [selectedSport],
        matchLimit: Number(matchLimit),
      })
      toast.success("Settings saved")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleRunNow = async () => {
    setRunning(true)
    setShowTerminal(true)
    try {
      await triggerNow({})
      toast.success("Scraper started")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start scraper")
      setShowTerminal(false)
    } finally {
      setRunning(false)
    }
  }

  if (!overview) {
    return <SmallLoader />
  }

  const sportLabel = AVAILABLE_SPORTS.find(s => String(s.id) === selectedSport)?.label || "Soccer"

  const TerminalContent = (
    <ScraperTerminal 
      runId={currentRun?._id ?? null} 
      isRunning={isCurrentlyRunning} 
    />
  )

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="w-full max-w-full space-y-4 py-4 px-4 sm:px-6">
      {/* Header Card */}
      <Card className="border border-border">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-lg font-bold">Sports Scraper</h1>
              <p className="text-xs text-muted-foreground mt-1">Configure and monitor match scraping</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={isCurrentlyRunning ? "secondary" : "outline"}
                className="text-xs uppercase whitespace-nowrap"
              >
                {isCurrentlyRunning ? "● Running" : "● Idle"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls Card */}
      <Card className="border border-border">
        <CardContent className="pt-4 space-y-4">
          {/* Row 1: Sport, Cadence, Window, Match Limit (Mobile friendly) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Sport */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">Sport</label>
              <Select 
                value={selectedSport} 
                onValueChange={setSelectedSport} 
                disabled={isCurrentlyRunning}
              >
                <SelectTrigger className="h-9 text-xs rounded-md">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_SPORTS.map((sport) => (
                    <SelectItem key={sport.id} value={String(sport.id)}>
                      {sport.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cadence */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">Cadence (min)</label>
              <Input
                type="number"
                min="1"
                max="120"
                value={cadenceMinutes}
                onChange={(e) => setCadenceMinutes(e.target.value)}
                disabled={isCurrentlyRunning}
                className="h-9 text-xs rounded-md focus-visible:ring-primary"
              />
            </div>

            {/* Window */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">Window (days)</label>
              <Input
                type="number"
                min="1"
                max="14"
                value={dateWindowDays}
                onChange={(e) => setDateWindowDays(e.target.value)}
                disabled={isCurrentlyRunning}
                className="h-9 text-xs rounded-md focus-visible:ring-primary"
              />
            </div>

            {/* Match Limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">Match Limit</label>
              <Select 
                value={matchLimit} 
                onValueChange={setMatchLimit} 
                disabled={isCurrentlyRunning}
              >
                <SelectTrigger className="h-9 text-xs rounded-md">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {MATCH_LIMITS.map((limit) => (
                    <SelectItem key={limit.value} value={limit.value}>
                      {limit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              size="sm" 
              className="h-9 text-xs font-semibold gap-1.5 flex-1 sm:flex-none"
              onClick={handleSave}
              disabled={saving || isCurrentlyRunning}
            >
              <Save className="size-3.5" />
              Save
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="h-9 text-xs font-semibold gap-1.5 flex-1 sm:flex-none"
              onClick={handleRunNow}
              disabled={running || isCurrentlyRunning}
            >
              <PlayCircle className="size-3.5" />
              Run
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Row - Compact Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border border-border">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Last Run</p>
            <p className="font-mono text-xs font-medium mt-1">
              {overview.settings.lastRunAt 
                ? new Date(overview.settings.lastRunAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Next Run</p>
            <p className="font-mono text-xs font-medium mt-1">
              {new Date(overview.settings.nextRunAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Sport</p>
            <p className="font-semibold text-xs mt-1 truncate">{sportLabel}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Fetch Limit</p>
            <p className="font-mono text-xs font-medium mt-1">{matchLimit}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table - Clickable */}
      {overview.runs.length > 0 && (
        <Card className="border border-border">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold">Recent Activity</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[500px]">
                <thead className="border-b border-border bg-card/50 text-muted-foreground text-[10px] uppercase">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Time</th>
                    <th className="px-4 py-2.5 text-left">Status</th>
                    <th className="px-4 py-2.5 text-left">Sport</th>
                    <th className="px-4 py-2.5 text-right">Matches</th>
                    <th className="px-4 py-2.5 text-right">Markets</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {overview.runs.slice(0, 10).map((run: RunDetail) => (
                    <tr 
                      key={run._id} 
                      onClick={() => setSelectedRun(run)}
                      className="hover:bg-card/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-2.5 font-mono text-[11px]">
                        {formatTime(run.startedAt).split(" ").pop()}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant={
                            run.status === "success"
                              ? "default"
                              : run.status === "running"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-[9px] uppercase"
                        >
                          {run.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-[11px]">
                        {run.selectedSports?.join(", ") || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[11px]">
                        {run.matchesUpserted}/{run.matchesDiscovered}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[11px]">
                        {run.marketsUpserted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Run Details Dialog */}
      {selectedRun && (
        <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Run Details</DialogTitle>
              <DialogDescription className="text-xs">
                {formatTime(selectedRun.startedAt)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card/50 rounded px-3 py-2 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase">Status</p>
                  <Badge 
                    variant={
                      selectedRun.status === "success"
                        ? "default"
                        : selectedRun.status === "running"
                        ? "secondary"
                        : "destructive"
                    }
                    className="text-[10px] uppercase mt-1"
                  >
                    {selectedRun.status}
                  </Badge>
                </div>
                <div className="bg-card/50 rounded px-3 py-2 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
                  <p className="font-mono text-xs mt-1">
                    {selectedRun.durationMs 
                      ? `${(selectedRun.durationMs / 1000).toFixed(1)}s`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card/50 rounded px-3 py-2 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase">Matches</p>
                  <p className="font-mono text-xs font-semibold mt-1">
                    {selectedRun.matchesUpserted}/{selectedRun.matchesDiscovered}
                  </p>
                </div>
                <div className="bg-card/50 rounded px-3 py-2 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase">Markets</p>
                  <p className="font-mono text-xs font-semibold mt-1">
                    {selectedRun.marketsUpserted}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card/50 rounded px-3 py-2 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase">Odds</p>
                  <p className="font-mono text-xs font-semibold mt-1">
                    {selectedRun.oddsUpserted}
                  </p>
                </div>
                <div className="bg-card/50 rounded px-3 py-2 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase">Failed</p>
                  <p className="font-mono text-xs font-semibold mt-1">
                    {selectedRun.failedMatches}
                  </p>
                </div>
              </div>

              <div className="bg-card/50 rounded px-3 py-2 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase">Sport</p>
                <p className="text-xs mt-1">{selectedRun.selectedSports?.join(", ") || "—"}</p>
              </div>

              <div className="bg-card/50 rounded px-3 py-2 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase">Date Range</p>
                <p className="text-xs mt-1">{selectedRun.dateFrom} to {selectedRun.dateTo}</p>
              </div>

              {selectedRun.errorSummary && (
                <div className="bg-destructive/10 rounded px-3 py-2 border border-destructive/30">
                  <p className="text-[10px] text-destructive uppercase font-semibold">Errors</p>
                  <p className="text-xs mt-1 text-destructive/90 font-mono break-words">
                    {selectedRun.errorSummary.slice(0, 200)}
                    {selectedRun.errorSummary.length > 200 ? "..." : ""}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Terminal Modal/Drawer */}
      {isDesktop ? (
        <Dialog open={showTerminal} onOpenChange={setShowTerminal}>
          <DialogContent className="max-w-2xl max-h-[70vh]">
            <DialogHeader>
              <DialogTitle className="text-sm">Live Activity</DialogTitle>
              <DialogDescription className="text-xs">
                Real-time scraper logs
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 overflow-hidden">
              {TerminalContent}
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={showTerminal} onOpenChange={setShowTerminal}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="text-sm">Live Activity</DrawerTitle>
              <DrawerDescription className="text-xs">
                Real-time scraper logs
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4 max-h-[60vh] overflow-hidden">
              {TerminalContent}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
