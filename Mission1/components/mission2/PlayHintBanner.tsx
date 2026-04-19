"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "mission2-play-hint-dismissed";

export function PlayHintBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(sessionStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="mb-4 rounded-lg border border-[rgba(0,255,157,0.25)] bg-[rgba(0,255,157,0.06)] px-4 py-3 text-sm text-[var(--text-primary)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
            Quick start
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-[13px] leading-snug text-[var(--text-secondary)]">
            <li>Type a question below and press Transmit.</li>
            <li>
              If the left panel flags a mismatch, you can quote it and include the word{" "}
              <span className="font-mono text-[var(--accent)]">CONTRADICTION</span> to press harder.
            </li>
          </ol>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.setItem(STORAGE_KEY, "1");
            } catch {
              /* ignore */
            }
            setVisible(false);
          }}
          className="shrink-0 self-end font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] underline-offset-4 transition hover:text-[var(--accent)]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
