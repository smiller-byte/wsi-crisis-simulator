import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateDebrief } from "@/lib/anthropic";
import { insertSession, type TranscriptMessage } from "@/lib/db";
import { PERSONAS } from "@/lib/personas/renee";
import { STAFF_COOKIE, verifyStaffToken } from "@/lib/session";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = await verifyStaffToken(cookieStore.get(STAFF_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const personaId = typeof body?.personaId === "string" ? body.personaId : "";
  const transcript = Array.isArray(body?.transcript) ? (body.transcript as TranscriptMessage[]) : null;

  if (!personaId || !PERSONAS[personaId]) {
    return NextResponse.json({ error: "Unknown persona" }, { status: 400 });
  }
  if (!transcript || transcript.length === 0) {
    return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
  }

  try {
    const debrief = await generateDebrief(personaId, transcript);
    const saved = await insertSession({
      staffName: session.staffName,
      personaId,
      transcript,
      debrief,
    });
    return NextResponse.json({ debrief, id: saved.id });
  } catch (err) {
    console.error("debrief generation failed", err);
    return NextResponse.json({ error: "Failed to generate feedback" }, { status: 502 });
  }
}
