import { NextResponse } from "next/server";

/**
 * OIDC Discovery Document
 *
 * Convex fetches {domain}/.well-known/openid-configuration to discover
 * the JWKS endpoint so it can verify our JWTs.
 *
 * The `domain` in convex/auth.config.ts must match NEXT_PUBLIC_APP_URL.
 */
export async function GET() {
  const issuer =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  return NextResponse.json({
    issuer,
    jwks_uri: `${issuer}/api/auth/.well-known/jwks.json`,
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
  });
}
