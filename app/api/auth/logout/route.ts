import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { STAFF_COOKIE, SUPERVISOR_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const role = body?.role === "supervisor" ? "supervisor" : "staff";

  const cookieStore = await cookies();
  cookieStore.delete(role === "supervisor" ? SUPERVISOR_COOKIE : STAFF_COOKIE);

  return NextResponse.json({ ok: true });
}
