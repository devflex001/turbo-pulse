import { useEffect, useRef } from "react"
import { useMutation, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuthClient } from "@/lib/auth-client"

/**
 * Hook to track visitor on homepage
 * Collects IP, location, and device info
 * Uses ref to prevent duplicate tracking in React strict mode
 */
export function useVisitorTracking() {
  const { user } = useAuthClient()
  const trackVisitor = useMutation(api.ipTracking.trackVisitor)
  const getIPLocationAndDevice = useAction(api.ipTracking.getIPLocationAndDevice)
  const updateUserIPTracking = useMutation(api.ipTracking.updateUserIPTracking)
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    // Skip if already tracked in this session
    if (hasTrackedRef.current) {
      return
    }

    // Mark as tracked immediately to prevent duplicate calls
    hasTrackedRef.current = true

    // Track visitor on mount
    const trackPage = async () => {
      try {
        // Get user agent
        const userAgent = navigator.userAgent

        // Get IP address from ipapi.co
        const ipResponse = await fetch("https://ipapi.co/json/")
        const ipData = await ipResponse.json()
        const ip = ipData.ip || "Unknown"

        // Get detailed location and device info
        const locationAndDevice = await getIPLocationAndDevice({
          ip,
          userAgent,
        })

        // Track the visitor
        await trackVisitor({
          ip,
          userAgent,
          userId: user?._id,
          location: locationAndDevice.location,
          device: locationAndDevice.device,
          isBot: locationAndDevice.isBot,
        })

        // If user is logged in, also update their IP tracking
        if (user?._id) {
          await updateUserIPTracking({
            userId: user._id,
            ip,
            location: locationAndDevice.location,
            device: locationAndDevice.device,
          })
        }
      } catch (error) {
        console.error(
          "Error tracking visitor. Note: We only track your visits to enhance your experience:",
          error
        )
        // Silently fail - don't disrupt user experience
      }
    }

    trackPage()
  }, [trackVisitor, getIPLocationAndDevice, updateUserIPTracking, user?._id])
}
