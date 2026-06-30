"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminSessionProvider } from "@/components/admin-session-provider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminSessionProvider>
        {children}
      </AdminSessionProvider>
    </ProtectedRoute>
  );
}
