import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies, signJwt } from "@/lib/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Fetch user details from Convex to get the current role
    const user = await convex.query(api.users.getUserForLogin, {
      phone: session.phone,
    });

    const role = user?.role || "user";

    // Re-sign a fresh token (same sub/phone) so client always has a valid one
    const token = await signJwt({ sub: session.sub, phone: session.phone });

    return NextResponse.json({
      user: { id: session.sub, phone: session.phone, role },
      token,
    });
  } catch (error) {
    console.error("[me] Error:", error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
