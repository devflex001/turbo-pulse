"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CustomEventEditor } from "@/components/custom-event-editor"
import { CustomEventsList } from "@/components/custom-events-list"
import { CustomEventDetail } from "@/components/custom-event-detail"
import { Plus, ChevronDown } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

type ViewMode = "list" | "detail"

export function AdminCustomEventsPanel() {
  const [status, setStatus] = React.useState<"draft" | "published">("draft")
  const [viewMode, setViewMode] = React.useState<ViewMode>("list")
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null)
  const [editorOpen, setEditorOpen] = React.useState(false)

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId)
    setViewMode("detail")
  }

  const handleBackFromDetail = () => {
    setViewMode("list")
    setSelectedEventId(null)
  }

  const statusLabel = status === "draft" ? "Drafts" : "Published"

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Custom Events</h1>
          <p className="text-xs text-muted-foreground">Create and manage custom betting events</p>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs font-semibold gap-1.5"
          onClick={() => setEditorOpen(true)}
        >
          <Plus className="size-3.5" />
          Create Event
        </Button>
      </div>

      {/* Main Content */}
      {viewMode === "list" ? (
        <>
          {/* Status Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-border"
              >
                {statusLabel}
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem
                onClick={() => setStatus("draft")}
                className={status === "draft" ? "bg-accent" : ""}
              >
                Drafts
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatus("published")}
                className={status === "published" ? "bg-accent" : ""}
              >
                Published
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Events List */}
          <div className="border border-border rounded-lg bg-card p-4">
            <CustomEventsList
              status={status}
              onSelectEvent={handleSelectEvent}
            />
          </div>
        </>
      ) : (
        <>
          {/* Detail View */}
          <div className="border border-border rounded-lg bg-card p-4 h-[calc(100vh-250px)]">
            {selectedEventId && (
              <CustomEventDetail
                eventId={selectedEventId as Id<"customEvents">}
                onBack={handleBackFromDetail}
                onEdit={() => {
                  // Could implement edit mode in detail view if needed
                }}
              />
            )}
          </div>
        </>
      )}

      {/* Editor Modal */}
      <CustomEventEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSuccess={() => {
          setEditorOpen(false)
          setStatus("draft")
          setViewMode("list")
        }}
      />
    </div>
  )
}
