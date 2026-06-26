import * as jose from "jose";

/**
 * Server-side JWT helpers (imports `jose`) — only import this from server code.
 */

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_ISSUER = process.env.APP_URL || "http://localhost:3000";
const JWT_AUDIENCE = "convex";

export async function createAuthToken(userId: string, role: string): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);

  const token = await new jose.SignJWT({
    sub: userId,
    aud: JWT_AUDIENCE,
    iss: JWT_ISSUER,
    role,
    tokenIdentifier: `convex|${userId}`,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return token;
}

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
