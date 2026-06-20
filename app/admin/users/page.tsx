"use client"

import { AdminLayout } from "@/components/admin-layout"
import { AdminUsersPanel } from "@/components/admin-users-panel"

export default function UsersPage() {
  return (
    <AdminLayout>
      <AdminUsersPanel />
    </AdminLayout>
  )
}
