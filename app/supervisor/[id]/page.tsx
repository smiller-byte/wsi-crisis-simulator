import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionById } from "@/lib/db";
import { PERSONAS } from "@/lib/personas/renee";
import { SILENCE_MARKER, END_SESSION_MARKER } from "@/lib/personas/renee";

export const dynamic = "force-dynamic";

export default async function SupervisorSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionById(id);
  if (!session) {
    notFound();
  }

  const personaName = PERSONAS[session.persona_id]?.displayName ?? session.persona_id;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {session.staff_name} &middot; {personaName}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {new Date(session.created_at).toLocaleString()}
          </p>
        </div>
        <Link
          href="/supervisor"
          className="text-xs text-zinc-500 dark:text-zinc-400 underline hover:text-zinc-800 dark:hover:text-zinc-100"
        >
          Back to all sessions
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-8 lg:flex-row">
          <div className="flex-1">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Transcript</h2>
            <div className="flex flex-col gap-3">
              {session.transcript.map((m, i) => {
                if (m.content === SILENCE_MARKER || m.content === END_SESSION_MARKER) {
                  return (
                    <div key={i} className="text-center text-xs italic text-zinc-400 dark:text-zinc-500">
                      {m.content === SILENCE_MARKER ? "(advocate stays silent)" : "(call ended)"}
                    </div>
                  );
                }
                const isUser = m.role === "user";
                return (
                  <div key={i} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                    <span className="mb-1 text-[11px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      {isUser ? session.staff_name : personaName}
                    </span>
                    <div
                      className={`max-w-md rounded-lg px-3 py-2 text-sm ${
                        isUser
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-full lg:w-80 lg:shrink-0">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Debrief</h2>
            <div className="flex flex-col gap-3">
              <SupervisorDebriefCard title="Strengths" body={session.debrief.strengths} />
              <SupervisorDebriefCard title="One thing to try next time" body={session.debrief.growth_edge} />
              <SupervisorDebriefCard title="A phrase to have ready" body={session.debrief.try_this_phrase} />
              <SupervisorDebriefCard title="Note" body={session.debrief.note} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupervisorDebriefCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
      <h3 className="mb-1 text-xs font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{body}</p>
    </div>
  );
}
