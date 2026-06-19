import { NextResponse } from "next/server";
import { getJwks } from "@/lib/auth";

/**
 * JWKS (JSON Web Key Set) endpoint
 *
 * Convex uses this to fetch our public key and verify the RS256 JWTs
 * we issue. The key set includes only the public portion of our RSA key.
 */
export async function GET() {
  try {
    const jwks = await getJwks();
    return NextResponse.json(jwks, {
      headers: {
        // Cache for 1 hour — Convex may cache this
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[jwks] Error generating JWKS:", error);
    return NextResponse.json({ keys: [] }, { status: 500 });
  }
}
