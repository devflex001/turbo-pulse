"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useAuth } from "@/lib/auth/AuthContext"

interface UseAdminInactivityProps {
  warningTime?: number // Time in ms to show warning (default: 9 minutes)
  logoutTime?: number // Time in ms to logout (default: 10 minutes)
  onWarning?: () => void
  onLogout?: () => void
}

export function useAdminInactivity(props: UseAdminInactivityProps = {}) {
  const {
    warningTime = 9 * 60 * 1000, // 9 minutes
    logoutTime = 10 * 60 * 1000, // 10 minutes
    onWarning,
    onLogout,
  } = props
  const { isAdmin, logout } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(60) // 60 seconds countdown
  const [isActive, setIsActive] = useState(true)

  const warningTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const logoutTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const countdownIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastActivityRef = useRef<number>(Date.now())

  // Reset all timers
  const resetTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current)
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }

    setShowWarning(false)
    setCountdown(60)
    lastActivityRef.current = Date.now()
  }, [])

  // Start warning countdown
  const startWarningCountdown = useCallback(() => {
    setShowWarning(true)
    setCountdown(60)
    onWarning?.()

    // Start countdown interval
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto logout when countdown reaches 0
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
          }
          logout()
          onLogout?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [logout, onWarning, onLogout])

  // Handle user activity
  const handleActivity = useCallback(() => {
    if (!isAdmin) return

    setIsActive(true)
    lastActivityRef.current = Date.now()

    // If warning is showing, hide it and reset
    if (showWarning) {
      resetTimers()
    }

    // Clear existing timers
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current)
    }

    // Set new timers
    warningTimerRef.current = setTimeout(() => {
      startWarningCountdown()
    }, warningTime)

    logoutTimerRef.current = setTimeout(() => {
      logout()
      onLogout?.()
    }, logoutTime)
  }, [isAdmin, showWarning, warningTime, logoutTime, startWarningCountdown, resetTimers, logout, onLogout])

  // Extend session (reset timers without user activity)
  const extendSession = useCallback(() => {
    handleActivity()
  }, [handleActivity])

  // Logout immediately
  const logoutNow = useCallback(() => {
    resetTimers()
    logout()
    onLogout?.()
  }, [resetTimers, logout, onLogout])

  useEffect(() => {
    // Only activate for admins
    if (!isAdmin) {
      resetTimers()
      return
    }

    // List of events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'focus',
    ]

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Start initial timers
    handleActivity()

    // Cleanup on unmount
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      resetTimers()
    }
  }, [isAdmin, handleActivity, resetTimers])

  // Cleanup timers when admin status changes
  useEffect(() => {
    if (!isAdmin) {
      resetTimers()
    }
  }, [isAdmin, resetTimers])

  return {
    showWarning,
    countdown,
    isActive,
    extendSession,
    logoutNow,
    resetTimers,
  }
}