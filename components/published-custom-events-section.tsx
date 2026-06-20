"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { CustomEventDetail } from "@/components/custom-event-detail"
import { SmallLoader } from "@/components/small-loader"
import { Id } from "@/convex/_generated/dataModel"

export function PublishedCustomEventsSection() {
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const publishedEvents = useQuery(api.customEvents.listCustomEvents, {
    status: "published",
    limit: 10,
  })

  if (!publishedEvents || publishedEvents.length === 0) {
    return null
  }

  const sortedByStartTime = [...publishedEvents].sort((a, b) => a.startTime - b.startTime)

  const handleOpenDetail = (event: any) => {
    setSelectedEvent(event)
    setDetailOpen(true)
  }

  const eventTitle = selectedEvent
    ? `${selectedEvent.homeTeam} vs ${selectedEvent.awayTeam}`
    : ""

  const content = selectedEvent && (
    <div className="flex-1 overflow-hidden flex flex-col">
      <CustomEventDetail
        eventId={selectedEvent._id}
        onBack={() => setDetailOpen(false)}
      />
    </div>
  )

  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              ⭐ Featured Events
            </h2>
          </div>

          {/* Golden Styled Event Cards */}
          <div className="grid grid-cols-1 gap-3">
            {sortedByStartTime.map((event) => (
              <button
                key={event._id}
                onClick={() => handleOpenDetail(event)}
                className="group relative overflow-hidden rounded-lg border-2 border-yellow-500/60 bg-yellow-50/5 hover:bg-yellow-50/10 transition-all p-4 text-left"
              >
                {/* Golden accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500" />

                <div className="space-y-2">
                  {/* Event Title and Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-foreground group-hover:text-yellow-600 transition-colors">
                        {event.homeTeam} vs {event.awayTeam}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">{event.title}</p>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 border border-yellow-500/60 text-[9px] font-bold shrink-0">
                      FEATURED
                    </Badge>
                  </div>

                  {/* Event Meta */}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t border-yellow-500/20">
                    <span>{event.competition}</span>
                    <span>•</span>
                    <span>{event.totalMarkets} markets</span>
                  </div>

                  {/* View Button */}
                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 border border-yellow-500/60"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenDetail(event)
                      }}
                    >
                      View Markets
                    </Button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Drawer */}
        <Drawer open={detailOpen} onOpenChange={setDetailOpen}>
          <DrawerContent className="h-[90vh] flex flex-col overflow-hidden p-0 bg-card">
            <DrawerHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
              <DrawerTitle className="truncate text-sm font-semibold">{eventTitle}</DrawerTitle>
              <p className="truncate text-xs text-muted-foreground">{selectedEvent?.competition}</p>
            </DrawerHeader>
            {content}
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            ⭐ Featured Events
          </h2>
        </div>

        {/* Golden Styled Event Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedByStartTime.map((event) => (
            <button
              key={event._id}
              onClick={() => handleOpenDetail(event)}
              className="group relative overflow-hidden rounded-lg border-2 border-yellow-500/60 bg-yellow-50/5 hover:bg-yellow-50/10 transition-all p-4 text-left"
            >
              {/* Golden accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500" />

              <div className="space-y-2">
                {/* Event Title and Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-foreground group-hover:text-yellow-600 transition-colors">
                      {event.homeTeam} vs {event.awayTeam}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{event.title}</p>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 border border-yellow-500/60 text-[9px] font-bold shrink-0">
                    FEATURED
                  </Badge>
                </div>

                {/* Event Meta */}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t border-yellow-500/20">
                  <span>{event.competition}</span>
                  <span>•</span>
                  <span>{event.totalMarkets} markets</span>
                </div>

                {/* View Button */}
                <div className="pt-2 flex justify-end">
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 border border-yellow-500/60"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenDetail(event)
                    }}
                  >
                    View Markets
                  </Button>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent
          side="right"
          className="!w-[min(50vw,720px)] !max-w-none flex h-dvh flex-col overflow-hidden p-0 bg-card"
        >
          <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
            <SheetTitle className="truncate text-sm font-semibold">{eventTitle}</SheetTitle>
            <p className="truncate text-xs text-muted-foreground">{selectedEvent?.competition}</p>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  )
}
