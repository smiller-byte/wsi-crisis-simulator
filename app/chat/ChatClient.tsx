"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Persona } from "@/lib/personas/renee";
import { END_SESSION_MARKER, SILENCE_MARKER } from "@/lib/personas/renee";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Debrief {
  strengths: string;
  growth_edge: string;
  try_this_phrase: string;
  note: string;
}

type Phase = "chatting" | "sending" | "ending" | "debrief";

export default function ChatClient({ staffName, persona }: { staffName: string; persona: Persona }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<Phase>("chatting");
  const [error, setError] = useState<string | null>(null);
  const [debrief, setDebrief] = useState<Debrief | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  const busy = phase === "sending" || phase === "ending";

  async function requestReply(nextMessages: Message[]) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personaId: persona.id, transcript: nextMessages }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "Failed to get a reply");
    }
    return data.reply as string;
  }

  async function sendTurn(userContent: string) {
    setError(null);
    const nextMessages: Message[] = [...messages, { role: "user", content: userContent }];
    setMessages(nextMessages);
    setPhase("sending");
    try {
      const reply = await requestReply(nextMessages);
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPhase("chatting");
    }
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    await sendTurn(text);
  }

  async function handleStaySilent() {
    if (busy) return;
    await sendTurn(SILENCE_MARKER);
  }

  async function handleEndCall() {
    if (busy || messages.length === 0) return;
    setError(null);
    setPhase("ending");
    try {
      const closingMessages: Message[] = [...messages, { role: "user", content: END_SESSION_MARKER }];
      const finalLine = await requestReply(closingMessages);
      const fullTranscript: Message[] = [...closingMessages, { role: "assistant", content: finalLine }];
      setMessages(fullTranscript);

      const res = await fetch("/api/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId: persona.id, transcript: fullTranscript }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate feedback");
      }
      setDebrief(data.debrief);
      setPhase("debrief");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("chatting");
    }
  }

  async function handleSignOut() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "staff" }),
    });
    router.push("/login");
    router.refresh();
  }

  function startNewCall() {
    setMessages([]);
    setDebrief(null);
    setPhase("chatting");
    setError(null);
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Practice call with {persona.displayName}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Signed in as {staffName}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs text-zinc-500 dark:text-zinc-400 underline hover:text-zinc-800 dark:hover:text-zinc-100"
        >
          Sign out
        </button>
      </header>

      {phase === "debrief" && debrief ? (
        <DebriefView debrief={debrief} personaName={persona.displayName} onNewCall={startNewCall} />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-md">
                Start the call whenever you&apos;re ready — type your opening line below. You can also choose
                &quot;Stay silent&quot; to practice sitting with a pause instead of filling it.
              </p>
            )}
            <div className="flex flex-col gap-3 max-w-2xl">
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} personaName={persona.displayName} />
              ))}
              {phase === "sending" && (
                <div className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                  {persona.displayName} is responding...
                </div>
              )}
              {phase === "ending" && (
                <div className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                  Wrapping up the call and preparing feedback...
                </div>
              )}
            </div>
            <div ref={bottomRef} />
          </div>

          {error && <p className="px-4 pb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex max-w-2xl flex-col gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={busy}
                placeholder="Type what you'd say to the caller..."
                rows={2}
                className="resize-none rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSend}
                  disabled={busy || !draft.trim()}
                  className="rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-white disabled:opacity-50"
                >
                  Send
                </button>
                <button
                  onClick={handleStaySilent}
                  disabled={busy || messages.length === 0}
                  className="rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50"
                  title="Send an intentional pause instead of speaking"
                >
                  Stay silent
                </button>
                <button
                  onClick={handleEndCall}
                  disabled={busy || messages.length === 0}
                  className="ml-auto rounded-md border border-red-300 dark:border-red-900 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
                >
                  End call & get feedback
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MessageBubble({ message, personaName }: { message: Message; personaName: string }) {
  const isSilence = message.content === SILENCE_MARKER;
  const isEndMarker = message.content === END_SESSION_MARKER;

  if (isSilence || isEndMarker) {
    return (
      <div className="text-center text-xs italic text-zinc-400 dark:text-zinc-500">
        {isSilence ? "(you stay silent)" : "(call ended)"}
      </div>
    );
  }

  const isUser = message.role === "user";
  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <span className="mb-1 text-[11px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {isUser ? "You" : personaName}
      </span>
      <div
        className={`max-w-md rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function DebriefView({
  debrief,
  personaName,
  onNewCall,
}: {
  debrief: Debrief;
  personaName: string;
  onNewCall: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Call debrief</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Practice call with {personaName}. This session has been saved for supervisor review.
          </p>
        </div>

        <DebriefCard title="Strengths" body={debrief.strengths} />
        <DebriefCard title="One thing to try next time" body={debrief.growth_edge} />
        <DebriefCard title="A phrase to have ready" body={debrief.try_this_phrase} />
        <DebriefCard title="Note" body={debrief.note} />

        <button
          onClick={onNewCall}
          className="self-start rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-white"
        >
          Start a new practice call
        </button>
      </div>
    </div>
  );
}

function DebriefCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <h3 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{body}</p>
    </div>
  );
}
