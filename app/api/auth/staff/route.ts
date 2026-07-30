import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createStaffToken, STAFF_COOKIE } from "@/lib/session";
import { safeCompare } from "@/lib/passcode";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const staffName = typeof body?.staffName === "string" ? body.staffName.trim() : "";
  const passcode = typeof body?.passcode === "string" ? body.passcode : "";

  const expected = process.env.STAFF_PASSCODE;
  if (!expected) {
    return NextResponse.json({ error: "Server is not configured" }, { status: 500 });
  }

  if (!staffName) {
    return NextResponse.json({ error: "Enter your name" }, { status: 400 });
  }

  if (!passcode || !safeCompare(passcode, expected)) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  const token = await createStaffToken(staffName);
  const cookieStore = await cookies();
  cookieStore.set(STAFF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return NextResponse.json({ ok: true, staffName });
}
