"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useMission2Store } from "@/lib/mission2/store";

export default function Mission2BriefingPage() {
  const router = useRouter();
  const setSuspect = useMission2Store((s) => s.setSuspect);
  const resetMission = useMission2Store((s) => s.resetMission);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    resetMission();
  }, [resetMission]);

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/mission2/generate-suspect", { method: "POST" });
      if (!resp.ok) {
        throw new Error("Unable to generate suspect");
      }
      const data = (await resp.json()) as { suspect: unknown };
      setSuspect(data.suspect as never);
      router.push("/mission2/interrogation");
    } catch {
      setError("Could not start the mission. Check GEMINI_API_KEY in .env and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text-primary)] md:py-14">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.02em] md:text-3xl">
          Before you go in
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          You&apos;ll question one suspect. Your objective:{" "}
          <span className="text-[var(--text-primary)]">get the launch code</span>. They will lie and
          dodge — that&apos;s the point.
        </p>

        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-glow">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
            What to do
          </p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--text-secondary)]">
            <li>Ask questions in the chat (you have <strong className="text-[var(--text-primary)]">15</strong>).</li>
            <li>
              Use the <strong className="text-[var(--text-primary)]">left panel</strong> if it flags
              two statements that don&apos;t match.
            </li>
            <li>
              Optional: quote their slip, then use the word{" "}
              <span className="font-mono text-[var(--accent)]">CONTRADICTION</span> in your message to
              push for the code.
            </li>
          </ol>

          <details className="mt-5 border-t border-[var(--border)] pt-4">
            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] transition hover:text-[var(--text-secondary)]">
              Extra detail
            </summary>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-[var(--text-muted)]">
              <li>Stress rises on the right; profile fields unlock as the session goes on.</li>
              <li>The suspect may speak aloud — audio is optional if the API is configured.</li>
              <li>When the code appears or questions hit zero, you&apos;ll file a short verdict.</li>
            </ul>
          </details>

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              disabled={loading}
              onClick={() => void start()}
              className="rounded-md border border-[rgba(0,255,157,0.35)] bg-[rgba(0,255,157,0.1)] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent)] transition hover:bg-[rgba(0,255,157,0.16)] disabled:opacity-50"
            >
              {loading ? "Starting…" : "Start interrogation"}
            </button>
            <Link
              href="/mission2"
              className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              Back
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
