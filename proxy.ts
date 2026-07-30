import { NextRequest, NextResponse } from "next/server";
import { STAFF_COOKIE, SUPERVISOR_COOKIE, verifyStaffToken, verifySupervisorToken } from "@/lib/session";

const STAFF_PAGE_PREFIXES = ["/chat"];
const STAFF_API_PREFIXES = ["/api/chat", "/api/debrief"];
const SUPERVISOR_PAGE_PREFIXES = ["/supervisor"];
const SUPERVISOR_API_PREFIXES = ["/api/sessions"];

function startsWithAny(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Supervisor login page/API must stay reachable without a supervisor session.
  if (startsWithAny(pathname, SUPERVISOR_PAGE_PREFIXES) && pathname !== "/supervisor/login") {
    const token = request.cookies.get(SUPERVISOR_COOKIE)?.value;
    const session = await verifySupervisorToken(token);
    if (!session) {
      return NextResponse.redirect(new URL("/supervisor/login", request.url));
    }
    return NextResponse.next();
  }

  if (startsWithAny(pathname, SUPERVISOR_API_PREFIXES)) {
    const token = request.cookies.get(SUPERVISOR_COOKIE)?.value;
    const session = await verifySupervisorToken(token);
    if (!session) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (startsWithAny(pathname, STAFF_PAGE_PREFIXES)) {
    const token = request.cookies.get(STAFF_COOKIE)?.value;
    const session = await verifyStaffToken(token);
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (startsWithAny(pathname, STAFF_API_PREFIXES)) {
    const token = request.cookies.get(STAFF_COOKIE)?.value;
    const session = await verifyStaffToken(token);
    if (!session) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/supervisor/:path*", "/api/chat/:path*", "/api/debrief/:path*", "/api/sessions/:path*"],
};
