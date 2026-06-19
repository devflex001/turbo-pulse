import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { message: "Phone and password are required" },
        { status: 400 }
      );
    }

    // Sign in with phone as email (Better Auth stores phone numbers as email)
    const response = await auth.api.signInWithCredentials(
      {
        email: phone,
        password,
      },
      request
    );

    if (response instanceof Response) {
      return response;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Sign in error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Sign in failed" },
      { status: 401 }
    );
  }
}
