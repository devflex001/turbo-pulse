"use client"

import * as React from "react"
import { AdminLayout } from "@/components/admin-layout"
import { AdminCustomEventsPanel } from "@/components/admin-custom-events-panel"

export default function CustomEventsPage() {
  return (
    <AdminLayout>
      <AdminCustomEventsPanel />
    </AdminLayout>
  )
}
