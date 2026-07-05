declare module "convex/server" {
  export const defineSchema: any
  export const defineTable: any
  export const defineApp: any
  export const cronJobs: any
  export const httpRouter: any
  export const anyApi: any
  export default any
}

declare module "convex/values" {
  export const v: any
  export default any
}

declare module "convex/react" {
  export function useQuery(...args: any[]): any
  export function useMutation(...args: any[]): any
  export function usePaginatedQuery(...args: any[]): any
  export function useAction(...args: any[]): any
  export const ConvexProvider: any
  export const ConvexReactClient: any
  export default any
}
