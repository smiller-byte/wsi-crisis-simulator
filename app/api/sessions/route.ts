import { NextResponse } from "next/server";
import { listSessions } from "@/lib/db";

export async function GET() {
  try {
    const sessions = await listSessions();
    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("failed to list sessions", err);
    return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 });
  }
}
