import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupervisorToken, SUPERVISOR_COOKIE } from "@/lib/session";
import { safeCompare } from "@/lib/passcode";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const passcode = typeof body?.passcode === "string" ? body.passcode : "";

  const expected = process.env.SUPERVISOR_PASSCODE;
  if (!expected) {
    return NextResponse.json({ error: "Server is not configured" }, { status: 500 });
  }

  if (!passcode || !safeCompare(passcode, expected)) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  const token = await createSupervisorToken();
  const cookieStore = await cookies();
  cookieStore.set(SUPERVISOR_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return NextResponse.json({ ok: true });
}
