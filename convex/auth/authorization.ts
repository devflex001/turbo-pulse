import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id, Doc } from "../_generated/dataModel";

/**
 * Get userId from session token
 * Validates the session is valid and not expired
 * Returns the userId if valid, null otherwise
 */
export async function getUserIdFromSessionToken(
  ctx: QueryCtx | MutationCtx,
  sessionToken?: string
): Promise<Id<"users"> | null> {
  if (!sessionToken) {
    return null;
  }

  try {
    // Find session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_sessionToken", (q) =>
        q.eq("sessionToken", sessionToken)
      )
      .unique();

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      return null;
    }

    return session.userId;
  } catch (error) {
    console.error("Failed to get userId from session token:", error);
    return null;
  }
}

/**
 * Get authenticated user by ID
 * NOTE: In a production system with proper auth (Auth0, Clerk, etc.),
 * you would use ctx.auth.getUserIdentity() to get the server-verified identity.
 * 
 * For now, the client passes the user ID after local authentication.
 * The client-side AuthContext stores the authenticated user in localStorage
 * and passes it in requests.
 * 
 * IMPORTANT: Do NOT trust userId from client args for authorization.
 * Only use this for database lookups after client has proven authentication.
 */
export async function getCurrentAuthenticatedUser(
  ctx: QueryCtx | MutationCtx,
  userId?: string
): Promise<Doc<"users"> | null> {
  if (!userId) {
    return null;
  }

  try {
    // Fetch the user from the database
    const user = await ctx.db.get(userId as Id<"users">);
    return user || null;
  } catch (error) {
    console.error("Failed to get user:", error);
    return null;
  }
}

/**
 * Require authentication - throws if user is not authenticated
 * Returns the authenticated user document
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx, userId?: string): Promise<Doc<"users">> {
  const user = await getCurrentAuthenticatedUser(ctx, userId);

  if (!user) {
    throw new Error("Authentication required. Please log in.");
  }

  return user;
}

/**
 * Require admin role - throws if user is not authenticated or not an admin
 * Returns the authenticated admin user document
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx, userId?: string): Promise<Doc<"users">> {
  const user = await requireAuth(ctx, userId);

  if (user.role !== "admin") {
    throw new Error("Admin access required. You do not have permission to perform this action.");
  }

  return user;
}

/**
 * Check if current user is authenticated
 */
export async function isAuthenticated(ctx: QueryCtx | MutationCtx, userId?: string): Promise<boolean> {
  const user = await getCurrentAuthenticatedUser(ctx, userId);
  return user !== null;
}

/**
 * Check if current user is an admin
 */
export async function isAdmin(ctx: QueryCtx | MutationCtx, userId?: string): Promise<boolean> {
  const user = await getCurrentAuthenticatedUser(ctx, userId);
  return user?.role === "admin";
}

/**
 * Check if current user owns a resource
 * Useful for checking if a user can modify their own data
 */
export async function isOwner(
  ctx: QueryCtx | MutationCtx,
  resourceUserId: Id<"users">,
  userId?: string
): Promise<boolean> {
  const user = await getCurrentAuthenticatedUser(ctx, userId);

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
  resourceUserId: Id<"users">,
  userId?: string
): Promise<Doc<"users">> {
  const user = await requireAuth(ctx, userId);

  const isResourceOwner = user._id === resourceUserId;
  const isAdminUser = user.role === "admin";

  if (!isResourceOwner && !isAdminUser) {
    throw new Error("Permission denied. You can only access your own resources.");
  }

  return user;
}
