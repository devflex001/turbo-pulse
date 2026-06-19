import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";

const adminRoutes = ["/admin"];

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if this is an admin route
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  // Get session from cookie
  const sessionToken = request.cookies.get("better-auth.session_token")?.value;

  if (!sessionToken) {
    // Redirect to home if not authenticated
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    // Verify session is valid
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Check if user email matches admin email from env
    const adminEmail = env.ADMIN_EMAIL;
    if (session.user.email !== adminEmail) {
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
