import * as jose from "jose";

/**
 * JWT Configuration
 * IMPORTANT: In production, use a secure secret stored in environment variables
 */
const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || "your-secret-key-change-in-production";
const JWT_ISSUER = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const JWT_AUDIENCE = "convex";

/**
 * Create a JWT token for authenticated user
 * This token will be used by Convex Auth for session management
 */
export async function createAuthToken(userId: string, role: string): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);

  const token = await new jose.SignJWT({
    // Standard claims
    sub: userId, // Subject (user ID)
    aud: JWT_AUDIENCE, // Audience (must match auth.config.ts)
    iss: JWT_ISSUER, // Issuer (must match auth.config.ts domain)
    
    // Custom claims
    role,
    tokenIdentifier: `convex|${userId}`,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Token expires in 7 days
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyAuthToken(token: string): Promise<jose.JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);

    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return payload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

/**
 * Storage keys for auth tokens
 */
export const AUTH_TOKEN_KEY = "convex_auth_token";
export const AUTH_USER_KEY = "convex_auth_user";

/**
 * Store auth token in localStorage
 */
export function storeAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

/**
 * Remove auth token from localStorage
 */
export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

/**
 * Store user data in localStorage
 */
export function storeUserData(userData: {
  userId: string;
  phone: string;
  role: string;
}) {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
  }
}

/**
 * Get user data from localStorage
 */
export function getUserData(): {
  userId: string;
  phone: string;
  role: string;
} | null {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(AUTH_USER_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
  }
  return null;
}
