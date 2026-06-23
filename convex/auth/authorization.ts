import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import * as jose from "jose";

/**
 * Verify and decode JWT token
 * This is used for custom JWT auth (not Convex Auth)
 */
async function verifyJWT(token: string): Promise<{ sub: string; tokenIdentifier: string } | null> {
  try {
    const secret = new TextEncoder().encode(
      process.env.NEXT_PUBLIC_JWT_SECRET || "your-secret-key-change-in-production"
    );

    const verified = await jose.jwtVerify(token, secret, {
      issuer: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      audience: "convex",
    });

    return {
      sub: verified.payload.sub as string,
      tokenIdentifier: verified.payload.tokenIdentifier as string,
    };
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

/**
 * Get the current authenticated user from the session
 * Returns null if not authenticated
 */
export async function getCurrentAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
) {
  // Get the authorization header
  const authHeader = ctx.request?.headers.get("authorization");

  if (!authHeader) {
    return null;
  }

  // Extract token from "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  const token = parts[1];

  // Verify and decode JWT
  const verified = await verifyJWT(token);

  if (!verified) {
    return null;
  }

  // Extract userId from tokenIdentifier (format: "convex|<userId>")
  const userId = verified.tokenIdentifier.split("|")[1] as Id<"users">;

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
