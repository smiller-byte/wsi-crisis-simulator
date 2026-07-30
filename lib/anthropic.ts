import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getPersona } from "./personas/renee";
import type { DebriefContent, TranscriptMessage } from "./db";

const MODEL = "claude-opus-5";

let client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

function toApiMessages(transcript: TranscriptMessage[]): Anthropic.MessageParam[] {
  return transcript.map((m) => ({ role: m.role, content: m.content }));
}

export async function getRoleplayReply(
  personaId: string,
  transcript: TranscriptMessage[],
): Promise<string> {
  const persona = getPersona(personaId);

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: persona.systemPrompt,
    output_config: { effort: "medium" },
    messages: toApiMessages(transcript),
  });

  if (response.stop_reason === "refusal") {
    return "...sorry, I need to step away for a second. Can we come back to this?";
  }

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "";
}

const DEBRIEF_SCHEMA = {
  type: "object",
  properties: {
    strengths: {
      type: "string",
      description: "What the advocate did well during the call, specific to what happened in this transcript.",
    },
    growth_edge: {
      type: "string",
      description: "One concrete thing to try next time — the single highest-leverage improvement.",
    },
    try_this_phrase: {
      type: "string",
      description: "A short, ready-to-use phrase the advocate could have said (or could say next time) in a moment like this.",
    },
    note: {
      type: "string",
      description: "A brief closing note of encouragement or context for the advocate.",
    },
  },
  required: ["strengths", "growth_edge", "try_this_phrase", "note"],
  additionalProperties: false,
} as const;

const DEBRIEF_SYSTEM_PROMPT = `You are a supervisor coach reviewing a crisis-line practice call between an advocate-in-training and a simulated caller. Write structured, specific after-call coaching based only on what actually happened in the transcript. Be concrete and reference specific moments from the call. Keep each field to 1-3 sentences. Be encouraging but honest — this is a training tool, not a performance review.`;

export async function generateDebrief(
  personaId: string,
  transcript: TranscriptMessage[],
): Promise<DebriefContent> {
  const persona = getPersona(personaId);

  const transcriptText = transcript
    .map((m) => `${m.role === "user" ? "Advocate" : persona.displayName}: ${m.content}`)
    .join("\n\n");

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: DEBRIEF_SYSTEM_PROMPT,
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: DEBRIEF_SCHEMA },
    },
    messages: [
      {
        role: "user",
        content: `Here is the transcript of a practice call with simulated caller "${persona.displayName}":\n\n${transcriptText}\n\nProvide structured coaching feedback for the advocate.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (textBlock?.type !== "text") {
    throw new Error("Debrief generation returned no text content");
  }
  return JSON.parse(textBlock.text) as DebriefContent;
}
