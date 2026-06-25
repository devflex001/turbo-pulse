"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Eye, EyeOff, Trash2, CheckCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function CustomEventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string
  const [isSaving, setIsSaving] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [resolutionDialogOpen, setResolutionDialogOpen] = React.useState(false)
  const [selectedMarketId, setSelectedMarketId] = React.useState<string | null>(null)
  const [selectedOutcomeIds, setSelectedOutcomeIds] = React.useState<Set<string>>(new Set())
  const [isSettling, setIsSettling] = React.useState(false)

  const event = useQuery(api.customEvents.getCustomEvent, {
    eventId: eventId as Id<"customEvents">,
  }) as any

  const markets = useQuery(api.customEvents.listCustomMarkets, {
    eventId: eventId as Id<"customEvents">,
  }) as any

  const odds = useQuery(api.customEvents.listCustomOddsByEvent, {
    eventId: eventId as Id<"customEvents">,
  }) as any

  const updateEvent = useMutation(api.customEvents.updateCustomEvent)
  const updateScore = useMutation(api.customEvents.updateCustomEventScore)
  const updateOdds = useMutation(api.customEvents.updateCustomOdds)
  const publishEvent = useMutation(api.customEvents.publishCustomEvent)
  const unpublishEvent = useMutation(api.customEvents.unpublishCustomEvent)
  const deleteEvent = useMutation(api.customEvents.deleteCustomEvent)
  const settleEvent = useMutation(api.customEvents.settleCustomEvent)
  const markAsFinished = useMutation(api.customEvents.markEventAsFinished)

  // Form state
  const [formData, setFormData] = React.useState({
    title: "",
    homeTeam: "",
    awayTeam: "",
    sport: "",
    competition: "",
    startTime: "",
    homeScore: 0,
    awayScore: 0,
  })
  const [oddsEdits, setOddsEdits] = React.useState<Record<string, number>>({})

  // Initialize form when event loads
  React.useEffect(() => {
    if (event) {
      const date = new Date(event.startTime)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const hours = String(date.getHours()).padStart(2, "0")
      const minutes = String(date.getMinutes()).padStart(2, "0")
      const localDatetimeString = `${year}-${month}-${day}T${hours}:${minutes}`

      setFormData({
        title: event.title || "",
        homeTeam: event.homeTeam || "",
        awayTeam: event.awayTeam || "",
        sport: event.sport || "",
        competition: event.competition || "",
        startTime: localDatetimeString,
        homeScore: event.homeScore || 0,
        awayScore: event.awayScore || 0,
      })
    }
  }, [event])

  const handleBack = () => {
    router.push("/admin/custom-events")
  }

  const handleSave = async () => {
    if (
      !formData.title ||
      !formData.homeTeam ||
      !formData.awayTeam ||
      !formData.startTime
    ) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSaving(true)
    try {
      const startTimeMs = new Date(formData.startTime).getTime()
      if (isNaN(startTimeMs)) {
        toast.error("Invalid date/time")
        return
      }

      await updateEvent({
        eventId: eventId as Id<"customEvents">,
        title: formData.title,
        homeTeam: formData.homeTeam,
        awayTeam: formData.awayTeam,
        sport: formData.sport,
        competition: formData.competition,
        startTime: startTimeMs,
      })

      if (
        formData.homeScore !== (event?.homeScore || 0) ||
        formData.awayScore !== (event?.awayScore || 0)
      ) {
        await updateScore({
          eventId: eventId as Id<"customEvents">,
          homeScore: formData.homeScore,
          awayScore: formData.awayScore,
        })
      }

      const oddEdits = Object.entries(oddsEdits)
      for (const [oddId, oddValue] of oddEdits) {
        await updateOdds({
          oddId: oddId as Id<"customOdds">,
          oddValue,
        })
      }
      setOddsEdits({})

      toast.success("Event updated successfully")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update event"
      )
    } finally {
      setIsSaving(false)
    }
  }

  const togglePublish = async () => {
    const isPublished = event?.status === "published"
    try {
      if (isPublished) {
        await unpublishEvent({ eventId: eventId as Id<"customEvents"> })
        toast.success("Event unpublished")
      } else {
        await publishEvent({ eventId: eventId as Id<"customEvents"> })
        toast.success("Event published")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update")
    }
  }

  const handleDelete = async () => {
    try {
      await deleteEvent({ eventId: eventId as Id<"customEvents"> })
      toast.success("Event deleted")
      handleBack()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete")
    }
  }

  const handleResolveEvent = async () => {
    if (!selectedMarketId || selectedOutcomeIds.size === 0) {
      toast.error("Please select a market and at least one winning outcome")
      return
    }

    setIsSettling(true)
    try {
      // Build market outcomes array with all selected outcomes
      const marketOutcomes = [{
        marketId: selectedMarketId as Id<"customMarkets">,
        winningOutcomeIds: Array.from(selectedOutcomeIds),
      }]

      await settleEvent({
        eventId: eventId as Id<"customEvents">,
        marketOutcomes,
      })
      toast.success("Event resolved and bets settled! Users have been notified.")
      setResolutionDialogOpen(false)
      setSelectedMarketId(null)
      setSelectedOutcomeIds(new Set())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resolve event")
    } finally {
      setIsSettling(false)
    }
  }

  if (!event || !markets || !odds) {
    return (
      <AdminLayout>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleBack}
            >
              <ArrowLeft className="size-4" />
            </Button>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </AdminLayout>
    )
  }

  const oddsbyMarket = markets.reduce(
    (acc: any, market: any) => {
      acc[market._id] = odds.filter((o: any) => o.marketId === market._id)
      return acc
    },
    {} as Record<string, any[]>
  )

  // Check if match is finished from database eventStatus field
  const isFinished = event?.eventStatus === "finished"
  const isSettled = event?.winningOutcomeId ? true : false
  const canResolve = isFinished && !isSettled && event?.status === "published"

  return (
    <AdminLayout pageTitle="Edit Event">
      <div className="flex flex-col gap-4 overflow-hidden">
        {/* Compact Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={handleBack}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-base font-semibold truncate">{formData.homeTeam} vs {formData.awayTeam}</h1>
              <p className="text-xs text-muted-foreground">{formData.title}</p>
            </div>
            {isSettled && (
              <Badge className="ml-2 shrink-0 bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle className="size-3 mr-1" />
                Settled
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {canResolve && event.status === "published" && (
              <Button
                size="sm"
                variant="default"
                className="h-8 px-2.5 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700"
                onClick={() => setResolutionDialogOpen(true)}
              >
                <CheckCircle className="size-3" />
                <span className="hidden sm:inline">Resolve</span>
              </Button>
            )}

            {event.status === "published" ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2.5 gap-1.5 text-xs"
                onClick={togglePublish}
              >
                <EyeOff className="size-3" />
                <span className="hidden sm:inline">Unpublish</span>
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 px-2.5 gap-1.5 text-xs"
                onClick={togglePublish}
              >
                <Eye className="size-3" />
                <span className="hidden sm:inline">Publish</span>
              </Button>
            )}

            {event.status === "draft" && (
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 gap-1.5 text-xs text-destructive hover:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="size-3" />
                </Button>
                <AlertDialogContent>
                  <AlertDialogTitle>Delete Event</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The event will be permanently deleted.
                  </AlertDialogDescription>
                  <div className="flex gap-2 justify-end">
                    <AlertDialogCancel className="h-8">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 px-2.5 gap-1.5 text-xs"
            >
              <Save className="size-3" />
              {isSaving ? "..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Resolution Sheet - Side Modal on Desktop */}
        <Sheet open={resolutionDialogOpen} onOpenChange={setResolutionDialogOpen}>
          <SheetContent side="right" className="w-full sm:w-[500px] flex flex-col">
            <SheetHeader>
              <SheetTitle>Resolve Event</SheetTitle>
              <SheetDescription>
                Select the market and winning outcome. All related bets will be automatically settled and users will be notified.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {/* Market Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Market *</label>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                  {markets.map((market: any) => (
                    <button
                      key={market._id}
                      onClick={() => {
                        setSelectedMarketId(market._id as any)
                        setSelectedOutcomeIds(new Set())
                      }}
                      className={cn(
                        "p-3 rounded border text-sm text-left transition-colors",
                        selectedMarketId === market._id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      <p className="font-medium">{market.name}</p>
                      <p className="text-xs text-muted-foreground">{market.marketType}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Outcome Selection */}
              {selectedMarketId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Winning Outcome(s) *</label>
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {(oddsbyMarket[selectedMarketId] || []).map((odd: any) => (
                      <button
                        key={odd._id}
                        onClick={() => {
                          const newSet = new Set(selectedOutcomeIds)
                          if (newSet.has(odd.outcomeId)) {
                            newSet.delete(odd.outcomeId)
                          } else {
                            newSet.add(odd.outcomeId)
                          }
                          setSelectedOutcomeIds(newSet)
                        }}
                        className={cn(
                          "p-3 rounded border text-sm text-left transition-colors",
                          selectedOutcomeIds.has(odd.outcomeId)
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        <p className="font-medium">{odd.outcomeName}</p>
                        <p className="text-xs text-muted-foreground">Odds: {odd.oddValue}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setResolutionDialogOpen(false)}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolveEvent}
                disabled={!selectedMarketId || selectedOutcomeIds.size === 0 || isSettling}
                className="h-9"
              >
                {isSettling ? "Resolving..." : "Resolve Event"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto pr-4 space-y-4">
          {/* Event Basics - 3 Columns */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</p>
            <div className="grid gap-3 grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Title *</label>
                <Input
                  placeholder="Event title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="h-8 text-xs"
                  disabled={isSettled}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Start Time *</label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="h-8 text-xs"
                  disabled={isSettled}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Sport</label>
                <Input
                  placeholder="e.g. football"
                  value={formData.sport}
                  onChange={(e) =>
                    setFormData({ ...formData, sport: e.target.value })
                  }
                  className="h-8 text-xs"
                  disabled={isSettled}
                />
              </div>
            </div>

            {/* Teams - 2 Columns */}
            <div className="grid gap-3 grid-cols-2 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Home Team *</label>
                <Input
                  placeholder="Home team"
                  value={formData.homeTeam}
                  onChange={(e) =>
                    setFormData({ ...formData, homeTeam: e.target.value })
                  }
                  className="h-8 text-xs"
                  disabled={isSettled}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Away Team *</label>
                <Input
                  placeholder="Away team"
                  value={formData.awayTeam}
                  onChange={(e) =>
                    setFormData({ ...formData, awayTeam: e.target.value })
                  }
                  className="h-8 text-xs"
                  disabled={isSettled}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Competition</label>
                <Input
                  placeholder="e.g. Premier League"
                  value={formData.competition}
                  onChange={(e) =>
                    setFormData({ ...formData, competition: e.target.value })
                  }
                  className="h-8 text-xs"
                  disabled={isSettled}
                />
              </div>
            </div>
          </div>

          {/* Score - 2 Compact Columns */}
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score</p>
            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">{formData.homeTeam} Score</label>
                <Input
                  type="number"
                  min={0}
                  value={formData.homeScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      homeScore: parseInt(e.target.value) || 0,
                    })
                  }
                  className="h-8 text-center text-lg font-bold text-primary"
                  disabled={isSettled}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">{formData.awayTeam} Score</label>
                <Input
                  type="number"
                  min={0}
                  value={formData.awayScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      awayScore: parseInt(e.target.value) || 0,
                    })
                  }
                  className="h-8 text-center text-lg font-bold text-primary"
                  disabled={isSettled}
                />
              </div>
            </div>
          </div>

          {/* Settlement Info */}
          {isSettled && event.winningOutcomeId && (
            <div className="space-y-2 border-t pt-3 p-3 bg-green-50 rounded border-green-200">
              <p className="text-xs font-semibold text-green-900">Event Settled</p>
              <div className="space-y-1 text-xs">
                <p><span className="text-green-700 font-medium">Settled at:</span> {new Date(event.settledAt || 0).toLocaleString()}</p>
                <p><span className="text-green-700 font-medium">Winning Outcome:</span> {event.winningOutcomeId}</p>
              </div>
            </div>
          )}

          {/* Markets and Odds - Compact Grid */}
          {markets.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Markets & Odds ({markets.length})
              </p>
              <div className="space-y-2">
                {markets.map((market: any) => {
                  const marketOdds = oddsbyMarket[market._id] || []
                  if (marketOdds.length === 0) return null

                  const isWinningMarket = market._id === event.winningMarketId

                  return (
                    <div
                      key={market._id}
                      className={cn(
                        "space-y-1.5 rounded border p-2.5",
                        isWinningMarket
                          ? "bg-green-50 border-green-200"
                          : "bg-muted/30 border-border"
                      )}
                    >
                      <p className="text-xs font-semibold text-foreground">{market.name}</p>
                      <div className={cn(
                        "grid gap-1.5",
                        marketOdds.length <= 3 ? "grid-cols-3" : "grid-cols-2"
                      )}>
                        {marketOdds.map((odd: any) => {
                          const isWinningOutcome = isWinningMarket && odd.outcomeId === event.winningOutcomeId

                          return (
                            <div
                              key={odd._id}
                              className={cn(
                                "flex items-center gap-1.5 rounded p-1.5 border",
                                isWinningOutcome
                                  ? "bg-green-100 border-green-400"
                                  : "bg-background border-border"
                              )}
                            >
                              <label className="text-xs font-medium flex-1 min-w-0 truncate">
                                {odd.outcomeName}
                                {isWinningOutcome && (
                                  <CheckCircle className="size-3 inline ml-1 text-green-600" />
                                )}
                              </label>
                              <Input
                                type="number"
                                step={0.01}
                                min={1}
                                value={
                                  oddsEdits[odd._id as any] ?? odd.oddValue
                                }
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value)
                                  if (!isNaN(val)) {
                                    setOddsEdits({
                                      ...oddsEdits,
                                      [odd._id]: val,
                                    })
                                  }
                                }}
                                className="h-7 text-xs text-right w-16 font-bold p-1"
                                disabled={isSettled}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
