"use client";

import { useEffect, useMemo, useState } from "react";

import type { DebriefClientPayload } from "@/lib/mission2/types";

type Props = {
  payload: DebriefClientPayload | null;
  onExit: () => void;
};

function useCountUp(target: number, ms: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setV(Math.round(target * t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function DebriefReveal({ payload, onExit }: Props) {
  const scoreAnim = useCountUp(payload?.score ?? 0, 900);
  const xpAnim = useCountUp(Math.round(payload?.xp ?? 0), 1100);

  const ratingClass = useMemo(() => {
    const r = payload?.rating ?? "COMPROMISED";
    if (r === "ELITE") return "border-emerald-400 text-emerald-300";
    if (r === "PROFICIENT") return "border-[var(--accent)] text-[var(--accent)]";
    if (r === "DEVELOPING") return "border-amber-400 text-amber-300";
    return "border-red-500 text-red-300";
  }, [payload?.rating]);

  if (!payload) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl">
      <div className="relative max-h-[min(92vh,900px)] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 shadow-glow">
        <div className="pointer-events-none absolute inset-0 opacity-40 mission2-radar-sweep" />
        <div className="relative">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--text-secondary)]">
            Mission 02 debrief
          </p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.02em] text-[var(--text-primary)]">
            Assessment
          </h1>

          <div className="mt-8 grid gap-6 md:grid-cols-[1fr_220px]">
            <div className="space-y-4">
              <section className="rounded-xl border border-[var(--border)] bg-black/35 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Hidden truth
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-primary)]">
                  {payload.hidden_truth}
                </p>
              </section>

              <section className="rounded-xl border border-[var(--border)] bg-black/35 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Planted seeds
                </p>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
                  {payload.planted_contradictions.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </section>

              <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-xl border border-[var(--border)] bg-black/35 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                    Caught
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--accent)]">
                    {payload.caught_summary.length ? (
                      payload.caught_summary.map((c) => <li key={c}>{c}</li>)
                    ) : (
                      <li className="text-[var(--text-muted)]">—</li>
                    )}
                  </ul>
                </section>
                <section className="rounded-xl border border-[var(--border)] bg-black/35 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                    Missed
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-300">
                    {payload.missed_summary.length ? (
                      payload.missed_summary.map((c) => <li key={c}>{c}</li>)
                    ) : (
                      <li className="text-[var(--text-muted)]">—</li>
                    )}
                  </ul>
                </section>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-4">
              <div
                className={`rounded-xl border px-4 py-6 text-center ${ratingClass}`}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.3em]">Rating</p>
                <p className="mt-3 font-display text-2xl font-extrabold">{payload.rating}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-black/45 p-4 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Score
                </p>
                <p className="mt-2 font-mono text-3xl text-[var(--text-primary)]">{scoreAnim}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-black/45 p-4 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  XP
                </p>
                <p className="mt-2 font-mono text-3xl text-[var(--accent)]">{xpAnim}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={onExit}
              className="rounded-md border border-[rgba(0,255,157,0.35)] bg-[rgba(0,255,157,0.08)] px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent)] transition hover:bg-[rgba(0,255,157,0.12)]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
