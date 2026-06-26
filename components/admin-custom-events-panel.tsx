"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { CustomEventEditor } from "@/components/custom-event-editor"
import { CustomEventsList } from "@/components/custom-events-list"
import { CustomEventDetail } from "@/components/custom-event-detail"
import { Plus } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

type ViewMode = "list" | "detail"

export function AdminCustomEventsPanel() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("list")
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(
    null
  )
  const [editorOpen, setEditorOpen] = React.useState(false)

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId)
    setViewMode("detail")
  }

  const handleBackFromDetail = () => {
    setViewMode("list")
    setSelectedEventId(null)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Custom Events</h1>
          <p className="text-xs text-muted-foreground">
            Create and manage custom betting events
          </p>
        </div>
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs font-semibold"
          onClick={() => setEditorOpen(true)}
        >
          <Plus className="size-3.5" />
          Create Event
        </Button>
      </div>

      {/* Main Content */}
      {viewMode === "list" ? (
        <>
          {/* Events List */}
          <CustomEventsList status="all" onSelectEvent={handleSelectEvent} />
        </>
      ) : (
        <>
          {/* Detail View */}
          <div className="h-[calc(100vh-250px)] rounded-lg border border-border bg-card p-4">
            {selectedEventId && (
              <CustomEventDetail
                eventId={selectedEventId as Id<"customEvents">}
                adminControls
                onBack={handleBackFromDetail}
              />
            )}
          </div>
        </>
      )}

      {/* Editor Modal */}
      <CustomEventEditor open={editorOpen} onOpenChange={setEditorOpen} />
    </div>
  )
}
