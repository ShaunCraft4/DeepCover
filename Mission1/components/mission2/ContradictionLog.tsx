"use client";

import { useState } from "react";

import type { ContradictionEntry } from "@/lib/mission2/types";

type Props = {
  items: ContradictionEntry[];
  onAnnotate: (id: string, note: string) => void;
};

export function ContradictionLog({ items, onAnnotate }: Props) {
  const [open, setOpen] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <aside
      className={`rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-glow transition-[width] duration-300 ${
        open ? "w-full max-w-[280px]" : "w-12"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between border-b border-[var(--border)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)] transition hover:border-[rgba(0,255,157,0.3)] hover:bg-[rgba(0,255,157,0.04)]"
      >
        <span>{open ? "Mismatches" : "•"}</span>
        <span className="text-[var(--accent)]">{open ? "⟨" : "⟩"}</span>
      </button>

      {open && (
        <div className="max-h-[min(60vh,520px)] space-y-3 overflow-y-auto p-3">
          {items.length === 0 ? (
            <p className="text-xs leading-relaxed text-[var(--text-muted)]">
              Nothing yet. Contradictions show up here when detected.
            </p>
          ) : (
            items.map((c) => (
              <div
                key={c.id}
                className="animate-fade-slide-up rounded-lg border border-[var(--border)] bg-black/35 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {new Date(c.createdAt).toLocaleTimeString()}
                  </p>
                  {c.autoDetected && (
                    <span className="rounded border border-[rgba(0,255,157,0.35)] bg-[rgba(0,255,157,0.08)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent)]">
                      Auto-detected
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-primary)]">
                  <span className="text-[var(--accent)]">A:</span> {c.statementA}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-primary)]">
                  <span className="text-[var(--accent)]">B:</span> {c.statementB}
                </p>
                <label className="mt-2 block">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Annotation
                  </span>
                  <textarea
                    value={drafts[c.id] ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [c.id]: e.target.value }))
                    }
                    onBlur={() => onAnnotate(c.id, drafts[c.id] ?? "")}
                    rows={2}
                    className="mt-1 w-full resize-none rounded-md border border-[var(--border)] bg-black/40 px-2 py-1 text-xs text-[var(--text-primary)] outline-none transition focus:border-[rgba(0,255,157,0.35)]"
                  />
                </label>
              </div>
            ))
          )}
        </div>
      )}
    </aside>
  );
}
