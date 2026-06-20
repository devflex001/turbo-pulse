import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { env } from "@/lib/env";

const adminRoutes = ["/admin"];

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if this is an admin route
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  // Verify session using our custom JWT cookie
  try {
    const session = await getSessionFromCookies();

    if (!session) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Check if the user's phone matches the admin phone from env
    const adminPhone = env.ADMIN_EMAIL || "254712345678";
    const normalizedAdmin = adminPhone.startsWith("+")
      ? adminPhone
      : `+${adminPhone}`;

    if ((session as any).phone !== normalizedAdmin && (session as any).phone !== adminPhone) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Auth proxy error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
