/**
 * Custom auth utilities — JWT signing and verification using RS256.
 *
 * We use the existing JWT_PRIVATE_KEY (RSA private key) from .env.local.
 * Convex verifies our tokens via the JWKS endpoint we expose at:
 *   GET /api/auth/.well-known/jwks.json
 */

import { SignJWT, jwtVerify, importPKCS8, importJWK, exportJWK } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "betflow_session";
const ALGORITHM = "RS256";
const AUDIENCE = "convex";

function getIssuer() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

import * as fs from "fs";
import * as path from "path";

function getRawPrivateKey(): string {
  let raw = process.env.JWT_PRIVATE_KEY;
  
  // If Next.js hasn't restarted and the key is truncated, or if it's not set,
  // we fallback to reading .env.local directly.
  if (!raw || !raw.includes("END PRIVATE KEY")) {
    try {
      const envPath = path.resolve(process.cwd(), ".env.local");
      const envContent = fs.readFileSync(envPath, "utf8");
      const match = envContent.match(/JWT_PRIVATE_KEY="?([^"\n]*)"?/);
      if (match && match[1]) {
        raw = match[1];
      }
    } catch (e) {
      console.warn("Failed to read .env.local directly", e);
    }
  }

  if (!raw) throw new Error("JWT_PRIVATE_KEY environment variable is not set");
  return raw.replace(/\\n/g, "\n");
}

async function getPrivateKey() {
  return importPKCS8(getRawPrivateKey(), ALGORITHM);
}

/**
 * Returns the public JWK derived from the private key.
 */
async function getPublicKeyJwk() {
  const privateKey = await getPrivateKey();
  const jwk = await exportJWK(privateKey);
  // Strip private key fields, keep public fields only
  const { d, p, q, dp, dq, qi, ...publicJwk } = jwk;
  void d; void p; void q; void dp; void dq; void qi;
  return { ...publicJwk, alg: ALGORITHM, use: "sig", kid: "betflow-1" };
}

// ── JWT sign / verify ─────────────────────────────────────────────────────────

export interface AuthPayload {
  sub: string;   // Convex user document _id
  phone: string; // normalized phone
}

/**
 * Signs a JWT. Expires in 30 days.
 */
export async function signJwt(payload: AuthPayload): Promise<string> {
  const privateKey = await getPrivateKey();

  return new SignJWT({ phone: payload.phone })
    .setProtectedHeader({ alg: ALGORITHM, kid: "betflow-1" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer(getIssuer())
    .setAudience(AUDIENCE)
    .setExpirationTime("30d")
    .sign(privateKey);
}

/**
 * Verifies a JWT and returns its payload, or null if invalid/expired.
 */
export async function verifyJwt(token: string): Promise<AuthPayload | null> {
  try {
    const publicJwkData = await getPublicKeyJwk();
    const publicKey = await importJWK(publicJwkData, ALGORITHM);

    const { payload } = await jwtVerify(token, publicKey, {
      issuer: getIssuer(),
      audience: AUDIENCE,
      algorithms: [ALGORITHM],
    });

    return {
      sub: payload.sub as string,
      phone: payload["phone"] as string,
    };
  } catch {
    return null;
  }
}

// ── Cookie session helpers ────────────────────────────────────────────────────

/**
 * Reads the session cookie and verifies the JWT.
 */
export async function getSessionFromCookies(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyJwt(token);
}

// ── JWKS export (for Convex OIDC discovery) ───────────────────────────────────

/**
 * Returns the JWKS document for Convex to verify our tokens.
 * Exposed at GET /api/auth/.well-known/jwks.json
 */
export async function getJwks() {
  const publicJwk = await getPublicKeyJwk();
  return { keys: [publicJwk] };
}
