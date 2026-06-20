"use client"

import { AdminLayout } from "@/components/admin-layout"
import { AdminEventsPanel } from "@/components/admin-events-panel"

export default function EventsPage() {
  return (
    <AdminLayout>
      <AdminEventsPanel />
    </AdminLayout>
  )
}
