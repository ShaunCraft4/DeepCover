"use client";

import type { PublicSuspectProfile } from "@/lib/mission2/types";

type Props = {
  suspect: PublicSuspectProfile;
  completedTurns: number;
};

export function PsychProfile({ suspect, completedTurns }: Props) {
  const showType = completedTurns >= 3;
  const showTell = completedTurns >= 6;
  const showVuln = completedTurns >= 10;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-glow">
      <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--text-secondary)]">
        Subject file
      </p>
      <div className="mt-3 space-y-3">
        <div className="animate-fade-slide-up">
          <p className="font-display text-lg font-extrabold tracking-[-0.02em] text-[var(--text-primary)]">
            {suspect.name}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">{suspect.occupation}</p>
        </div>

        <div className="animate-fade-slide-up">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Type
          </p>
          {showType ? (
            <p className="mt-1 rounded-md border border-[var(--border)] bg-black/30 px-2 py-2 font-mono text-xs uppercase tracking-wide text-[var(--accent)]">
              {suspect.psychological_profile.type}
            </p>
          ) : (
            <p className="mt-1 select-none rounded-md border border-[var(--border)] bg-black/40 px-2 py-2 font-mono text-xs text-[var(--text-muted)]">
              █████
            </p>
          )}
        </div>

        <div className="animate-fade-slide-up">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Tell (1)
          </p>
          {showTell ? (
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-primary)]">
              {suspect.psychological_profile.tells[0] ?? "—"}
            </p>
          ) : (
            <p className="mt-1 select-none text-sm text-[var(--text-muted)]">█████</p>
          )}
        </div>

        <div className="animate-fade-slide-up">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Vulnerability
          </p>
          {showVuln ? (
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-primary)]">
              {suspect.psychological_profile.vulnerability_triggers[0] ?? "—"}
            </p>
          ) : (
            <p className="mt-1 select-none text-sm text-[var(--text-muted)]">█████</p>
          )}
        </div>
      </div>
    </div>
  );
}
