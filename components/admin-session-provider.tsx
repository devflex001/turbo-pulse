"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { AdminNameModal } from "./admin-name-modal"

/**
 * Admin Session Provider Wrapper
 * 
 * Wraps admin pages and handles the admin name modal display/submission.
 * This component should be placed in the admin layout.
 */
export function AdminSessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const {
    user,
    isAdmin,
    sessionToken,
    adminName,
    showAdminNameModal,
    isLoadingAdminSession,
    handleAdminNameSubmit,
  } = useAuth()

  // Don't render children until admin session is established (if admin)
  const isAdminWithoutSession = isAdmin && !adminName && !showAdminNameModal

  // Show loading state while checking for admin session
  if (isAdminWithoutSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="inline-flex animate-spin">
            <svg
              className="h-8 w-8"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <p className="text-muted-foreground">Loading admin session...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {children}
      <AdminNameModal
        open={showAdminNameModal}
        isLoading={isLoadingAdminSession}
        onAdminNameSelected={async (name: string) => {
          await handleAdminNameSubmit(name)
        }}
      />
    </>
  )
}
