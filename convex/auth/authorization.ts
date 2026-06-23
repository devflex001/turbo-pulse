import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id, Doc } from "../_generated/dataModel";

/**
 * Get the current authenticated user from the Convex Auth session
 * Returns the user document from the database if authenticated
 * Returns null if not authenticated
 * 
 * This uses Convex Auth with JWT tokens configured in auth.config.ts
 */
export async function getCurrentAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  // Get the authenticated identity from Convex Auth
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  // Look up the user in the database by phone (since we're using phone as auth)
  // The tokenIdentifier is "convex|{userId}" as set in lib/auth/jwt.ts
  // We extract the userId from the token identifier
  const userId = identity.tokenIdentifier?.split("|")[1];

  if (!userId) {
    return null;
  }

  try {
    // Get the user document from the database
    const user = await ctx.db.get(userId as Id<"users">);
    return user || null;
  } catch {
    // If the ID is invalid, return null
    return null;
  }
}

/**
 * Require authentication - throws if user is not authenticated
 * Returns the authenticated user document
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const user = await getCurrentAuthenticatedUser(ctx);

  if (!user) {
    throw new Error("Authentication required. Please log in.");
  }

  return user;
}

/**
 * Require admin role - throws if user is not authenticated or not an admin
 * Returns the authenticated admin user document
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const user = await requireAuth(ctx);

  if (user.role !== "admin") {
    throw new Error("Admin access required. You do not have permission to perform this action.");
  }

  return user;
}

/**
 * Check if current user is authenticated
 */
export async function isAuthenticated(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const user = await getCurrentAuthenticatedUser(ctx);
  return user !== null;
}

/**
 * Check if current user is an admin
 */
export async function isAdmin(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const user = await getCurrentAuthenticatedUser(ctx);
  return user?.role === "admin";
}

/**
 * Check if current user owns a resource
 * Useful for checking if a user can modify their own data
 */
export async function isOwner(
  ctx: QueryCtx | MutationCtx,
  resourceUserId: Id<"users">
): Promise<boolean> {
  const user = await getCurrentAuthenticatedUser(ctx);

  if (!user) {
    return false;
  }

  return user._id === resourceUserId;
}

/**
 * Require ownership or admin - throws if user doesn't own the resource and is not admin
 */
export async function requireOwnershipOrAdmin(
  ctx: QueryCtx | MutationCtx,
  resourceUserId: Id<"users">
): Promise<Doc<"users">> {
  const user = await requireAuth(ctx);

  const isResourceOwner = user._id === resourceUserId;
  const isAdminUser = user.role === "admin";

  if (!isResourceOwner && !isAdminUser) {
    throw new Error("Permission denied. You can only access your own resources.");
  }

  return user;
}
