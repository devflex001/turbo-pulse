import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Get the current authenticated user from the session
 * Returns null if not authenticated
 */
export async function getCurrentAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  // Extract userId from tokenIdentifier (format: "convex|<userId>")
  const tokenIdentifier = identity.tokenIdentifier;
  const userId = tokenIdentifier.split("|")[1] as Id<"users">;

  if (!userId) {
    return null;
  }

  // Fetch user from database
  const user = await ctx.db.get(userId);

  return user;
}

/**
 * Require authentication - throws if user is not authenticated
 * Returns the authenticated user
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentAuthenticatedUser(ctx);

  if (!user) {
    throw new Error("Authentication required. Please log in.");
  }

  return user;
}

/**
 * Require admin role - throws if user is not authenticated or not an admin
 * Returns the authenticated admin user
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
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
) {
  const user = await requireAuth(ctx);

  const isResourceOwner = user._id === resourceUserId;
  const isAdminUser = user.role === "admin";

  if (!isResourceOwner && !isAdminUser) {
    throw new Error("Permission denied. You can only access your own resources.");
  }

  return user;
}
