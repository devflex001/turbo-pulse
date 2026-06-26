"use client"

import { AdminLayout } from "@/components/admin-layout"
import { AdminRedisPanel } from "@/components/admin-redis-panel"

export default function RedisPage() {
  return (
    <AdminLayout>
      <AdminRedisPanel />
    </AdminLayout>
  )
}
