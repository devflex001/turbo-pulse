"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FootballLoader } from "@/components/football-loader"
import { toast } from "sonner"
import { PlayCircle, Save } from "lucide-react"

function formatTime(value: number | null) {
  if (!value) return "Never"
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AdminScraperPanel() {
  const overview = useQuery(api.scraper.getAdminOverview)
  const updateSettings = useMutation(api.scraper.updateSettings)
  const triggerNow = useMutation(api.scraper.triggerNow)

  const [enabledOverride, setEnabledOverride] = React.useState<boolean | null>(null)
  const [cadenceMinutesOverride, setCadenceMinutesOverride] = React.useState<string | null>(null)
  const [dateWindowDaysOverride, setDateWindowDaysOverride] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [running, setRunning] = React.useState(false)

  const settings = overview?.settings
  const enabled = enabledOverride ?? settings?.enabled ?? true
  const cadenceMinutes =
    cadenceMinutesOverride ?? String(settings?.cadenceMinutes ?? 5)
  const dateWindowDays =
    dateWindowDaysOverride ?? String(settings?.dateWindowDays ?? 2)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings({
        enabled,
        cadenceMinutes: Number(cadenceMinutes),
        dateWindowDays: Number(dateWindowDays),
      })
      setEnabledOverride(null)
      setCadenceMinutesOverride(null)
      setDateWindowDaysOverride(null)
      toast.success("Scraper settings saved")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleRunNow = async () => {
    setRunning(true)
    try {
      await triggerNow({})
      toast.success("Scraper run queued")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to queue scraper")
    } finally {
      setRunning(false)
    }
  }

  if (!overview) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-lg font-bold tracking-tight">Sports Scraper</h1>
        <p className="text-xs text-muted-foreground">
          Manage KwikBet fixture ingestion and full market refresh.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border border-border rounded-lg bg-card p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold">Schedule</h2>
              <p className="text-xs text-muted-foreground">A lightweight cron checks this configuration every minute.</p>
            </div>
            <Badge variant={enabled ? "default" : "secondary"} className="text-[10px] uppercase">
              {enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="scraper-enabled">
                Enabled
              </label>
              <Button
                id="scraper-enabled"
                type="button"
                variant={enabled ? "default" : "outline"}
                className="w-full h-9 text-xs font-semibold"
                onClick={() => setEnabledOverride(!enabled)}
              >
                {enabled ? "On" : "Off"}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="cadence">
                Cadence Minutes
              </label>
              <Input
                id="cadence"
                type="number"
                min="1"
                max="120"
                value={cadenceMinutes}
                onChange={(event) => setCadenceMinutesOverride(event.target.value)}
                className="h-9 text-xs focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="window">
                Date Window Days
              </label>
              <Input
                id="window"
                type="number"
                min="1"
                max="14"
                value={dateWindowDays}
                onChange={(event) => setDateWindowDaysOverride(event.target.value)}
                className="h-9 text-xs focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="h-8 text-xs font-semibold gap-1.5" onClick={handleSave} disabled={saving}>
              <Save className="size-3.5" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs font-semibold gap-1.5" onClick={handleRunNow} disabled={running}>
              <PlayCircle className="size-3.5" />
              {running ? "Queuing..." : "Run Now"}
            </Button>
          </div>
        </div>

        <div className="border border-border rounded-lg bg-card p-4 space-y-3">
          <h2 className="text-sm font-bold">Current State</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Last run</span>
              <span className="font-medium text-right">{formatTime(overview.settings.lastRunAt)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Next run</span>
              <span className="font-medium text-right">{formatTime(overview.settings.nextRunAt)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Source</span>
              <span className="font-mono font-semibold">{overview.settings.source}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-bold">Recent Runs</h2>
        </div>

        {overview.runs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead className="border-b border-border text-muted-foreground text-[10px] uppercase">
                <tr>
                  <th className="px-4 py-2">Started</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Trigger</th>
                  <th className="px-4 py-2">Window</th>
                  <th className="px-4 py-2">Matches</th>
                  <th className="px-4 py-2">Markets</th>
                  <th className="px-4 py-2">Odds</th>
                  <th className="px-4 py-2">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {overview.runs.map((run) => (
                  <tr key={run._id}>
                    <td className="px-4 py-3 font-medium">{formatTime(run.startedAt)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={run.status === "success" ? "default" : run.status === "running" ? "secondary" : "destructive"}
                        className="text-[10px] uppercase"
                      >
                        {run.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{run.triggeredBy}</td>
                    <td className="px-4 py-3 font-mono">{run.dateFrom} - {run.dateTo}</td>
                    <td className="px-4 py-3 font-mono">{run.matchesUpserted}/{run.matchesDiscovered}</td>
                    <td className="px-4 py-3 font-mono">{run.marketsUpserted}</td>
                    <td className="px-4 py-3 font-mono">{run.oddsUpserted}</td>
                    <td className="px-4 py-3 max-w-[220px] truncate text-muted-foreground">
                      {run.errorSummary || (run.failedMatches ? `${run.failedMatches} failed` : "None")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No scrape runs recorded yet.
          </div>
        )}
      </div>
    </div>
  )
}
