"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { AdminLayout } from "@/components/admin-layout"
import { CustomEventDetail } from "@/components/custom-event-detail"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ArrowLeft, Search, ChevronDown, Edit2, Save, X } from "lucide-react"
import { SmallLoader } from "@/components/small-loader"
import { toast } from "sonner"

export default function CustomEventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string
  const [search, setSearch] = React.useState("")
  const [filterMarkets, setFilterMarkets] = React.useState("All")
  const [isEditingBasic, setIsEditingBasic] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  const event = useQuery(api.customEvents.getCustomEvent, {
    eventId: eventId as Id<"customEvents">,
  })

  const updateEvent = useMutation(api.customEvents.updateCustomEvent)

  // Form state for editing
  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    homeTeam: "",
    awayTeam: "",
    sport: "",
    competition: "",
    startTime: "",
  })

  // Initialize form when event loads
  React.useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        homeTeam: event.homeTeam || "",
        awayTeam: event.awayTeam || "",
        sport: event.sport || "",
        competition: event.competition || "",
        startTime: new Date(event.startTime).toISOString().slice(0, 16),
      })
    }
  }, [event])

  const handleBack = () => {
    router.push("/admin/custom-events")
  }

  const handleSaveBasicInfo = async () => {
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
        description: formData.description || undefined,
        homeTeam: formData.homeTeam,
        awayTeam: formData.awayTeam,
        sport: formData.sport,
        competition: formData.competition,
        startTime: startTimeMs,
      })

      toast.success("Event updated successfully")
      setIsEditingBasic(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update event"
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (!event) {
    return (
      <AdminLayout>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2"
              onClick={handleBack}
            >
              <ArrowLeft className="size-3.5" />
              Back
            </Button>
          </div>
          <SmallLoader />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2"
            onClick={handleBack}
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Button>

          {/* Edit Basic Info Button */}
          <Sheet open={isEditingBasic} onOpenChange={setIsEditingBasic}>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Edit2 className="size-3.5" />
                Edit Event
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-96 flex-col gap-0 p-0">
              <SheetHeader className="border-b border-border bg-muted/20 px-6 pt-6 pb-3">
                <SheetTitle>Edit Event Details</SheetTitle>
                <SheetDescription>
                  Update basic information about this event
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-4 overflow-y-auto px-6 pt-4 pb-8">
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Event Title *</label>
                  <Input
                    placeholder="e.g., Cup Final 2024"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="h-8 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold">Home Team *</label>
                    <Input
                      placeholder="e.g., Manchester United"
                      value={formData.homeTeam}
                      onChange={(e) =>
                        setFormData({ ...formData, homeTeam: e.target.value })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold">Away Team *</label>
                    <Input
                      placeholder="e.g., Arsenal"
                      value={formData.awayTeam}
                      onChange={(e) =>
                        setFormData({ ...formData, awayTeam: e.target.value })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold">Start Time *</label>
                  <Input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="h-8 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold">Sport</label>
                    <Input
                      placeholder="e.g., football"
                      value={formData.sport}
                      onChange={(e) =>
                        setFormData({ ...formData, sport: e.target.value })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold">Competition</label>
                    <Input
                      placeholder="e.g., Premier League"
                      value={formData.competition}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          competition: e.target.value,
                        })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold">Description</label>
                  <Textarea
                    placeholder="Optional event description..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="h-16 resize-none text-sm"
                  />
                </div>
              </div>

              <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-muted/20 px-6 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingBasic(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveBasicInfo}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Event Info Card */}
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                Title
              </p>
              <p className="text-sm font-semibold text-foreground">
                {event.title}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                Matchup
              </p>
              <p className="text-sm font-semibold text-foreground">
                {event.homeTeam} vs {event.awayTeam}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                Competition
              </p>
              <p className="text-sm font-semibold text-foreground">
                {event.competition}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                Sport
              </p>
              <p className="text-sm font-semibold text-foreground">
                {event.sport}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                Score
              </p>
              <p className="text-sm font-semibold text-foreground">
                {event.homeScore ?? 0} - {event.awayScore ?? 0}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                Start Time
              </p>
              <p className="text-sm font-semibold text-foreground">
                {new Date(event.startTime).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                Status
              </p>
              <p
                className={`text-sm font-semibold ${event.status === "published" ? "text-emerald-600" : "text-yellow-600"}`}
              >
                {event.status}
              </p>
            </div>
          </div>
          {event.description && (
            <div className="border-t border-border pt-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Description
              </p>
              <p className="text-sm text-foreground">{event.description}</p>
            </div>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-0 bg-muted/50 pl-9 text-sm"
            />
          </div>

          {/* Filter Dropdowns */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs"
              >
                All Markets
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setFilterMarkets("All")}>
                All Markets
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterMarkets("Active")}>
                Active Markets
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterMarkets("Inactive")}>
                Inactive Markets
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs"
              >
                All
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>All</DropdownMenuItem>
              <DropdownMenuItem>Main Markets</DropdownMenuItem>
              <DropdownMenuItem>Additional Markets</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs"
              >
                All Leagues
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>All Leagues</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Detail View - Markets and Odds */}
        <div className="h-[calc(100vh-520px)] rounded-lg border border-border bg-card p-4">
          <CustomEventDetail
            eventId={eventId as Id<"customEvents">}
            adminControls
            onBack={handleBack}
            onEdit={() => {
              // Edit functionality can be added later
            }}
          />
        </div>
      </div>
    </AdminLayout>
  )
}
