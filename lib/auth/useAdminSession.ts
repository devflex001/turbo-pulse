import { useEffect, useState, useCallback } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { getSessionToken } from "./session"

/**
 * Hook for managing admin session identification
 * Handles admin name modal display and session creation
 */
export function useAdminSession(userIsAdmin: boolean, sessionToken: string | null) {
  const [showAdminNameModal, setShowAdminNameModal] = useState(false)
  const [adminName, setAdminName] = useState<string | null>(null)
  const [isLoadingAdminSession, setIsLoadingAdminSession] = useState(false)

  // Query current admin session
  const currentAdminSession = useQuery(
    api.admin.sessions.getCurrentAdminSession,
    sessionToken ? { sessionToken } : "skip"
  )

  // Mutation to start admin session
  const startAdminSessionMutation = useMutation(
    api.admin.sessions.startAdminSession
  )

  // Effect: Check if admin needs to identify themselves
  useEffect(() => {
    if (!userIsAdmin || !sessionToken) {
      setShowAdminNameModal(false)
      return
    }

    // If admin session already exists, use it
    if (currentAdminSession) {
      setAdminName(currentAdminSession.adminName)
      setShowAdminNameModal(false)
      return
    }

    // If no admin session exists yet, show modal
    if (currentAdminSession === null && !isLoadingAdminSession) {
      setShowAdminNameModal(true)
    }
  }, [userIsAdmin, sessionToken, currentAdminSession, isLoadingAdminSession])

  const handleAdminNameSubmit = useCallback(
    async (name: string, userId: string) => {
      if (!sessionToken) {
        throw new Error("Session token not found")
      }

      setIsLoadingAdminSession(true)
      try {
        const result = await startAdminSessionMutation({
          userId: userId as any,
          adminName: name,
          sessionToken,
        })

        setAdminName(result.adminName)
        setShowAdminNameModal(false)

        return result
      } catch (error) {
        throw error
      } finally {
        setIsLoadingAdminSession(false)
      }
    },
    [sessionToken, startAdminSessionMutation]
  )

  return {
    showAdminNameModal,
    adminName,
    isLoadingAdminSession,
    handleAdminNameSubmit,
  }
}
