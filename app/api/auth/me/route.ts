import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies, signJwt } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Re-sign a fresh token (same sub/phone) so client always has a valid one
    const token = await signJwt({ sub: session.sub, phone: session.phone });

    return NextResponse.json({
      user: { id: session.sub, phone: session.phone },
      token,
    });
  } catch (error) {
    console.error("[me] Error:", error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
