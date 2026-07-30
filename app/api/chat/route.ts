import { NextResponse } from "next/server";
import { getRoleplayReply } from "@/lib/anthropic";
import { PERSONAS } from "@/lib/personas/renee";
import type { TranscriptMessage } from "@/lib/db";

export async function POST(request: Request) {
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
    const reply = await getRoleplayReply(personaId, transcript);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("chat generation failed", err);
    return NextResponse.json({ error: "Failed to generate a reply" }, { status: 502 });
  }
}
