import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

/**
 * Hook to get current Daraja configuration
 * Automatically checks database first, then falls back to environment variables
 */
export function useDarajaConfig() {
  const config = useQuery(api.daraja.getConfig)
  return config
}
