import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Phone normalization — Kenyan numbers
function normalizePhone(phone: string): string {
  const cleaned = phone.trim().replace(/\s+/g, "");
  const match = cleaned.match(/^(?:\+254|254|0)?([71]\d{8})$/);
  if (match) return `+254${match[1]}`;
  return cleaned;
}

function isValidPhone(phone: string): boolean {
  return /^(?:\+254|254|0)?([71]\d{8})$/.test(phone.trim());
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

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { message: "Please enter a valid Kenyan phone number (e.g. 0712345678)" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);

    // Check if phone already exists
    const existing = await convex.query(api.users.getUserByPhone, {
      phone: normalizedPhone,
    });

    if (existing) {
      return NextResponse.json(
        { message: "This phone number is already registered" },
        { status: 409 }
      );
    }

    // Hash password with bcrypt (cost factor 12)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user in Convex (also initializes wallet)
    const userId = await convex.mutation(api.users.registerUser, {
      phone: normalizedPhone,
      passwordHash,
    });

    return NextResponse.json({ success: true, userId }, { status: 201 });
  } catch (error) {
    console.error("[register] Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Registration failed" },
      { status: 500 }
    );
  }
}
