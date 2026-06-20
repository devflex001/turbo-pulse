"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { AdminLayout } from "@/components/admin-layout"
import { CustomEventDetail } from "@/components/custom-event-detail"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { SmallLoader } from "@/components/small-loader"

export default function CustomEventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string

  const event = useQuery(api.customEvents.getCustomEvent, {
    eventId: eventId as Id<"customEvents">,
  })

  const handleBack = () => {
    router.push("/admin/custom-events")
  }

  if (!event) {
    return (
      <AdminLayout>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 h-8"
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 h-8"
            onClick={handleBack}
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Button>
        </div>
        <CustomEventDetail
          eventId={eventId as Id<"customEvents">}
          onBack={handleBack}
          onEdit={() => {
            // Edit functionality can be added later
          }}
        />
      </div>
    </AdminLayout>
  )
}
