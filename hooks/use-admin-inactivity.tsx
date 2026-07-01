"use client"

import { api } from "@/convex/_generated/api"
import { useAuth } from "@/lib/auth/AuthContext"
import { useMutation } from "convex/react"
import { useCallback, useEffect, useRef, useState } from "react"

interface UseAdminInactivityProps {
  warningTime?: number // ms of inactivity before showing warning (default: 9 min)
  logoutTime?: number  // ms after warning appears before auto-logout (default: 60 s)
  onWarning?: () => void
  onLogout?: () => void
}

export function useAdminInactivity(props: UseAdminInactivityProps = {}) {
  const {
    warningTime = 19 * 60 * 1000,
    logoutTime = 60 * 1000,
    onWarning,
    onLogout,
  } = props

  const { isAdmin, logout } = useAuth()
  const logInactivityLogoutMutation = useMutation(api.admin.sessions.logInactivityLogout)

  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(60)

  // Keep latest values accessible inside stable callbacks without recreating them
  const isAdminRef = useRef(isAdmin)
  const logoutRef = useRef(logout)
  const onWarningRef = useRef(onWarning)
  const onLogoutRef = useRef(onLogout)
  const warningTimeRef = useRef(warningTime)
  const logoutTimeRef = useRef(logoutTime)

  useEffect(() => { isAdminRef.current = isAdmin }, [isAdmin])
  useEffect(() => { logoutRef.current = logout }, [logout])
  useEffect(() => { onWarningRef.current = onWarning }, [onWarning])
  useEffect(() => { onLogoutRef.current = onLogout }, [onLogout])
  useEffect(() => { warningTimeRef.current = warningTime }, [warningTime])
  useEffect(() => { logoutTimeRef.current = logoutTime }, [logoutTime])

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const showWarningRef = useRef(false)

  // Keep showWarningRef in sync with state so stable callbacks can read it
  useEffect(() => {
    showWarningRef.current = showWarning
  }, [showWarning])

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current !== undefined) {
      clearTimeout(warningTimerRef.current)
      warningTimerRef.current = undefined
    }
    if (countdownIntervalRef.current !== undefined) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = undefined
    }
  }, [])

  const doLogout = useCallback(async (reason: "manual" | "inactivity_timeout" = "manual") => {
    clearAllTimers()
    setShowWarning(false)
    showWarningRef.current = false

    // Log inactivity logout if applicable
    if (reason === "inactivity_timeout" && logInactivityLogoutMutation) {
      try {
        // Get the session token from localStorage
        const sessionToken = localStorage.getItem("session_token")
        if (sessionToken) {
          await logInactivityLogoutMutation({ sessionToken })
        }
      } catch (err) {
        console.error("Error logging inactivity logout:", err)
      }
    }

    logoutRef.current()
    onLogoutRef.current?.()
  }, [clearAllTimers, logInactivityLogoutMutation])

  const startWarningCountdown = useCallback(() => {
    setShowWarning(true)
    showWarningRef.current = true
    setCountdown(Math.round(logoutTimeRef.current / 1000))
    onWarningRef.current?.()

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          doLogout("inactivity_timeout")
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [doLogout])

  // Stable activity handler — never recreated, so event listeners never need
  // to be re-added and the useEffect below only runs once.
  const handleActivity = useCallback(() => {
    if (!isAdminRef.current) return

    // If the warning is visible, just dismiss it and reset
    if (showWarningRef.current) {
      clearAllTimers()
      setShowWarning(false)
      showWarningRef.current = false
      setCountdown(Math.round(logoutTimeRef.current / 1000))
    } else {
      // Clear any pending warning timer
      if (warningTimerRef.current !== undefined) {
        clearTimeout(warningTimerRef.current)
        warningTimerRef.current = undefined
      }
    }

    // Schedule the next warning
    warningTimerRef.current = setTimeout(() => {
      startWarningCountdown()
    }, warningTimeRef.current)
  }, [clearAllTimers, startWarningCountdown])

  // Extend session from the UI button
  const extendSession = useCallback(() => {
    handleActivity()
  }, [handleActivity])

  // Immediate logout from the UI button
  const logoutNow = useCallback(() => {
    doLogout()
  }, [doLogout])

  // Register event listeners exactly once
  useEffect(() => {
    if (!isAdmin) return

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ] as const

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Start the first warning timer
    handleActivity()

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      clearAllTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]) // intentionally only re-run when admin status changes

  // Clean up if admin logs out externally
  useEffect(() => {
    if (!isAdmin) {
      clearAllTimers()
      setShowWarning(false)
      showWarningRef.current = false
    }
  }, [isAdmin, clearAllTimers])

  return {
    showWarning,
    countdown,
    extendSession,
    logoutNow,
  }
}
