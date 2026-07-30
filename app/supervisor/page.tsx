import Link from "next/link";
import { listSessions } from "@/lib/db";
import { PERSONAS } from "@/lib/personas/renee";
import SignOutButton from "./SignOutButton";

export const dynamic = "force-dynamic";

export default async function SupervisorPage() {
  const sessions = await listSessions();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Supervisor view</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">All staff practice sessions</p>
        </div>
        <SignOutButton />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {sessions.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">No practice sessions logged yet.</p>
        ) : (
          <div className="max-w-3xl overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Staff</th>
                  <th className="px-3 py-2 font-medium">Persona</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">{s.staff_name}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">
                      {PERSONAS[s.persona_id]?.displayName ?? s.persona_id}
                    </td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/supervisor/${s.id}`}
                        className="text-zinc-700 dark:text-zinc-200 underline hover:text-zinc-900 dark:hover:text-white"
                      >
                        View transcript
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
