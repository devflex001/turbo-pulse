"use client"

import { AdminLayout } from "@/components/admin-layout"
import { AdminSupportPanel } from "@/components/admin-support-panel"

export default function AdminSupportPage() {
  return (
    <AdminLayout pageTitle="Support">
      <AdminSupportPanel />
    </AdminLayout>
  )
}
