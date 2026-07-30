import "server-only";
import { Pool } from "pg";

declare global {
  var _wsiPgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  return new Pool({
    connectionString,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });
}

// Reuse the pool across hot reloads / serverless invocations in the same runtime.
// Created lazily (not at module load) so importing this file doesn't require
// DATABASE_URL to be set until a query actually runs.
function getPool(): Pool {
  if (!global._wsiPgPool) {
    global._wsiPgPool = createPool();
  }
  return global._wsiPgPool;
}

export interface DebriefContent {
  strengths: string;
  growth_edge: string;
  try_this_phrase: string;
  note: string;
}

export interface TranscriptMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SessionRow {
  id: string;
  staff_name: string;
  persona_id: string;
  transcript: TranscriptMessage[];
  debrief: DebriefContent;
  created_at: string;
}

export async function insertSession(params: {
  staffName: string;
  personaId: string;
  transcript: TranscriptMessage[];
  debrief: DebriefContent;
}): Promise<{ id: string; created_at: string }> {
  const result = await getPool().query<{ id: string; created_at: string }>(
    `insert into sessions (staff_name, persona_id, transcript, debrief)
     values ($1, $2, $3, $4)
     returning id, created_at`,
    [params.staffName, params.personaId, JSON.stringify(params.transcript), JSON.stringify(params.debrief)],
  );
  return result.rows[0];
}

export async function listSessions(): Promise<
  Pick<SessionRow, "id" | "staff_name" | "persona_id" | "created_at">[]
> {
  const result = await getPool().query<Pick<SessionRow, "id" | "staff_name" | "persona_id" | "created_at">>(
    `select id, staff_name, persona_id, created_at from sessions order by created_at desc`,
  );
  return result.rows;
}

export async function getSessionById(id: string): Promise<SessionRow | null> {
  const result = await getPool().query<SessionRow>(`select * from sessions where id = $1`, [id]);
  return result.rows[0] ?? null;
}
