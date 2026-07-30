"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [staffName, setStaffName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffName, passcode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.push("/chat");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
          WSI Crisis Call Practice
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          Enter your name and the staff passcode to start a practice session.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="staffName" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Your name
            </label>
            <input
              id="staffName"
              type="text"
              autoComplete="name"
              required
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="passcode" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Staff passcode
            </label>
            <input
              id="passcode"
              type="password"
              autoComplete="current-password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-md bg-zinc-900 dark:bg-zinc-100 px-3 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-white disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Start practicing"}
          </button>
        </form>
        <p className="mt-6 text-xs text-zinc-400">
          Supervisor?{" "}
          <Link href="/supervisor/login" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
            Go to the supervisor view
          </Link>
        </p>
      </div>
    </div>
  );
}
