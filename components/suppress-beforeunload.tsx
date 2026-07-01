"use client"

import { useEffect } from "react"

/**
 * Suppresses the browser's native "Leave site? Changes you made may not be saved."
 * dialog across the entire app. All navigation in this project is programmatic
 * (SPA routing, logout redirects) — there is no meaningful unsaved-form state
 * that warrants this prompt.
 */
export function SuppressBeforeUnload() {
  useEffect(() => {
    // Function to suppress beforeunload
    const suppressBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
      return ""
    }

    // Add event listener with capture phase
    window.addEventListener("beforeunload", suppressBeforeUnload, true)

    // Also override window.onbeforeunload
    const originalOnBeforeUnload = window.onbeforeunload
    window.onbeforeunload = null

    return () => {
      window.removeEventListener("beforeunload", suppressBeforeUnload, true)
      window.onbeforeunload = originalOnBeforeUnload
    }
  }, [])

  return null
}
