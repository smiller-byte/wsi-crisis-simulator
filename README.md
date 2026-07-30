# WSI Crisis Call Practice Simulator

A staff training tool where advocates practice hotline/crisis conversations with a simulated caller ("Renee"), then get structured after-call coaching. Sessions are logged for supervisor review after the call — not live-monitored.

Built with Next.js (App Router), calling the Anthropic API from server-side routes only, with a Postgres-backed session log gated behind two shared passcodes (staff and supervisor).

## How it's gated

- **Staff**: enters their name + a shared staff passcode at `/login`. This sets a signed, httpOnly cookie and unlocks `/chat`.
- **Supervisor** (Sarah, Hugo): enters a separate passcode at `/supervisor/login` to unlock `/supervisor`, which lists every staff session with full transcripts and debriefs.

This is intentionally not a full accounts system — see the build spec for why (pilot-scale tool, move to real accounts like Clerk/NextAuth only if it scales past a handful of staff).

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in:
   - `ANTHROPIC_API_KEY` — from the Anthropic Console. Billed per use to whoever owns the key (see cost note below).
   - `DATABASE_URL` — a Postgres connection string (Vercel Postgres or Supabase both work as-is).
   - `STAFF_PASSCODE` / `SUPERVISOR_PASSCODE` — pick two different passcodes for the pilot.
   - `SESSION_SECRET` — generate with `openssl rand -base64 32`.
3. Create the `sessions` table:
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   ```
   (Or paste `db/schema.sql` into the Supabase SQL editor.)
4. Run the dev server:
   ```bash
   npm run dev
   ```

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel (or `vercel deploy` from this directory).
2. Add the same environment variables from `.env.example` in the Vercel project settings (Production **and** Preview).
3. Provision a database — either a Vercel Postgres store or a Supabase project — and set `DATABASE_URL` accordingly, then run `db/schema.sql` against it once.
4. Deploy. `/` redirects to `/login` for staff or `/chat` if already signed in.

## Project layout

- `lib/personas/renee.ts` — Renee's system prompt (carried over verbatim from the artifact prototype) and the persona registry. Additional personas can be added here after the pilot.
- `lib/anthropic.ts` — server-side Anthropic API calls: one for in-character replies during the call, one for the structured JSON debrief at the end.
- `lib/db.ts` — Postgres access (`sessions` table: staff name, persona, transcript, debrief, timestamp).
- `lib/session.ts` / `lib/passcode.ts` — signed session cookies and constant-time passcode comparison.
- `proxy.ts` — route gating (staff vs. supervisor), Next's replacement for what used to be `middleware.ts`.
- `app/chat/` — the practice-call UI (message list, "Stay silent", "End call & get feedback").
- `app/supervisor/` — the supervisor-only session list and transcript/debrief viewer.

## Cost note

Unlike the free artifact prototype, this bills Anthropic API usage directly to whoever's `ANTHROPIC_API_KEY` is configured. During the pilot (2-3 staff), keep an eye on the Anthropic Console's usage page and note roughly how many tokens/calls a typical practice session uses, so you can estimate a monthly cost before rolling this out past a handful of staff.
