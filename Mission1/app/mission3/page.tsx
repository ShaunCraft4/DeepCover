"use client";

import Link from "next/link";
import { useEffect } from "react";

import { markMission3Reached } from "@/lib/campaign-progress";

/** Standalone modules on the dossier origin (not under Next `basePath`). */
const MISSION3_CYBER = "/Mission3/index.html";
const MISSION2_FIREWALL = "/Mission2/index.html";

export default function Mission3Page() {
  useEffect(() => {
    markMission3Reached();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--bg)] px-4 py-12 text-[var(--text-primary)] md:py-16">
      <div className="pointer-events-none absolute inset-0 opacity-30 mission2-radar-sweep" />
      <div className="relative mx-auto max-w-lg text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--text-secondary)]">
          Mission 03
        </p>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">
          Cyber Defense
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[var(--text-secondary)]">
          Full-spectrum cyber exercises (briefing, hub, and modules) run in the standalone Mission 3
          shell. Launch it below — your campaign progress is recorded when you open this page.
        </p>
        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <a
            href={MISSION3_CYBER}
            className="inline-flex items-center justify-center rounded-md border border-[rgba(0,255,157,0.35)] bg-[rgba(0,255,157,0.08)] px-8 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)] transition hover:bg-[rgba(0,255,157,0.14)]"
          >
            Launch Cyber Defense
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-[var(--border)] px-8 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)] transition hover:border-[rgba(0,255,157,0.3)] hover:bg-[rgba(0,255,157,0.04)]"
          >
            Mission home
          </Link>
        </div>
        <p className="mt-8 text-sm text-[var(--text-muted)]">
          <a
            href={MISSION2_FIREWALL}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)] underline-offset-4 transition hover:text-[var(--accent)] hover:underline"
          >
            Mission 02 — Counter-Intel Firewall
          </a>
        </p>
      </div>
    </main>
  );
}
