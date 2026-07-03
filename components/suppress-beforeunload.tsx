"use client"

import { useEffect } from "react"

/**
 * Suppresses the browser's native "Leave site? Changes you made may not be saved."
 * dialog across the entire app. Achieved by clearing any beforeunload handler that
 * may have been registered (e.g. by third-party scripts or library code) and
 * ensuring no handler on this component re-triggers it.
 */
export function SuppressBeforeUnload() {
  useEffect(() => {
    // Clear any existing onbeforeunload handler set elsewhere
    window.onbeforeunload = null

    // No-op capture listener that stops propagation so other handlers
    // registered in bubble phase never fire, but crucially does NOT call
    // preventDefault() or set returnValue — those are what trigger the dialog.
    const suppress = (e: BeforeUnloadEvent) => {
      e.stopImmediatePropagation()
    }

    window.addEventListener("beforeunload", suppress, { capture: true })

    return () => {
      window.removeEventListener("beforeunload", suppress, { capture: true })
    }
  }, [])

  return null
}
