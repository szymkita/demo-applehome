import { NextRequest, NextResponse } from "next/server";

const PASSWORD = "applehome2026!";
const COOKIE_NAME = "applehome_auth";
const COOKIE_VALUE = "authenticated";

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.password === PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, COOKIE_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return response;
  }

  return NextResponse.json({ success: false, error: "Nieprawidłowe hasło" }, { status: 401 });
}
