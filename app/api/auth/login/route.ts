import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { signJwt, SESSION_COOKIE } from "@/lib/auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const THIRTY_DAYS = 60 * 60 * 24 * 30;

function normalizePhone(phone: string): string {
  const cleaned = phone.trim().replace(/\s+/g, "");
  const match = cleaned.match(/^(?:\+254|254|0)?([71]\d{8})$/);
  if (match) return `+254${match[1]}`;
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { message: "Phone number and password are required" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);

    // Fetch user with passwordHash
    const user = await convex.query(api.users.getUserForLogin, {
      phone: normalizedPhone,
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid phone number or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid phone number or password" },
        { status: 401 }
      );
    }

    // Sign JWT
    const token = await signJwt({
      sub: user._id,
      phone: user.phone,
    });

    // Set httpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: { id: user._id, phone: user.phone, role: user.role },
      token,
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: THIRTY_DAYS,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[login] Error:", error);
    return NextResponse.json(
      { message: "An error occurred during login" },
      { status: 500 }
    );
  }
}
