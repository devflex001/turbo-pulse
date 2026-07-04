"use client"

import React, { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useMediaQuery } from "@/hooks/use-media-query"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { ShareModal } from "@/components/modals"
import { CustomEventDetail } from "@/components/custom-event-detail"

export default function CustomEventPage() {
  const params = useParams<{ eventId: string }>()
  const router = useRouter()
  const eventId = params.eventId
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [shareOpen, setShareOpen] = React.useState(false)

  // Validate eventId format before querying
  let validEventId: Id<"customEvents"> | null = null
  try {
    if (eventId) {
      validEventId = eventId as Id<"customEvents">
    }
  } catch {
    validEventId = null
  }

  const event = useQuery(
    api.customEvents.getCustomEvent,
    validEventId ? { eventId: validEventId } : "skip"
  )

  useEffect(() => {
    if (event) {
      document.title = `${event.homeTeam} vs ${event.awayTeam} - BetFlexx`
    } else {
      document.title = "Event Markets | BetFlexx"
    }
  }, [event])

  if (!eventId || !validEventId) {
    return <div className="p-6 text-center text-sm text-muted-foreground">Invalid event ID</div>
  }

  const eventName = event ? `${event.homeTeam} vs ${event.awayTeam}` : "Event"
  const competition = event?.competition || ""

  const content = event && validEventId && (
    <CustomEventDetail eventId={validEventId} onBack={() => router.back()} />
  )

  const shareButton = event && (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-muted-foreground hover:text-foreground shrink-0"
      onClick={() => setShareOpen(true)}
      aria-label="Share event"
    >
      <Share2 className="size-3.5" />
    </Button>
  )

  if (isMobile) {
    return (
      <>
        <Drawer open={!!event} onOpenChange={(open) => !open && router.back()}>
          <DrawerContent className="h-[90vh] flex flex-col overflow-hidden p-0 bg-card">
            {!event ? (
              <DrawerHeader className="shrink-0 border-b border-border px-4 py-3">
                <Skeleton className="h-6 w-40" />
              </DrawerHeader>
            ) : (
              <>
                <DrawerHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <DrawerTitle className="truncate text-sm font-semibold">{eventName}</DrawerTitle>
                      <p className="truncate text-xs text-muted-foreground">{competition}</p>
                    </div>
                    {shareButton}
                  </div>
                </DrawerHeader>
                {content}
              </>
            )}
          </DrawerContent>
        </Drawer>
        <ShareModal open={shareOpen} onOpenChange={setShareOpen} matchName={eventName} />
      </>
    )
  }

  return (
    <>
      <Sheet open={!!event} onOpenChange={(open) => !open && router.back()}>
        <SheetContent
          side="right"
          className="!w-[min(50vw,720px)] !max-w-none flex h-dvh flex-col overflow-hidden p-0 bg-card"
        >
          {!event ? (
            <SheetHeader className="shrink-0 border-b border-border px-4 py-3">
              <Skeleton className="h-6 w-40" />
            </SheetHeader>
          ) : (
            <>
              <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <SheetTitle className="truncate text-sm font-semibold">{eventName}</SheetTitle>
                    <p className="truncate text-xs text-muted-foreground">{competition}</p>
                  </div>
                  {shareButton}
                </div>
              </SheetHeader>
              {content}
            </>
          )}
        </SheetContent>
      </Sheet>
      <ShareModal open={shareOpen} onOpenChange={setShareOpen} matchName={eventName} />
    </>
  )
}
