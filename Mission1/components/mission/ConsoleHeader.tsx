"use client";

import { motion } from "framer-motion";

type ConsoleHeaderProps = {
  missionTitle: string;
  missionCode: string;
  statusLine: string;
};

export function ConsoleHeader({ missionTitle, missionCode, statusLine }: ConsoleHeaderProps) {
  return (
    <header className="relative overflow-hidden border-b border-dossier-border bg-dossier-bg/70 backdrop-blur">
      <div className="pointer-events-none absolute inset-0 opacity-30 scanlines" />
      <div className="pointer-events-none absolute -inset-24 bg-[radial-gradient(circle_at_10%_0%,rgba(0,255,157,0.12),transparent_55%)]" />
      <div className="relative mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dossier-border bg-dossier-panel/60 font-mono text-xs text-dossier-accent">
            D
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold tracking-tight text-dossier-text">Dossier</p>
              <span className="hidden font-mono text-[10px] text-dossier-muted sm:inline">
                INTELLIGENCE TRAINING OS
              </span>
            </div>
            <p className="truncate text-xs text-dossier-muted">{missionTitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-md border border-dossier-border bg-dossier-panel/40 px-3 py-2 font-mono text-[10px] text-dossier-muted">
            <span className="text-dossier-text">{missionCode}</span>
            <span className="px-2 text-dossier-muted">/</span>
            <span className="text-dossier-accent">RECRUIT</span>
          </div>
          <motion.div
            className="inline-flex items-center gap-2 rounded-md border border-dossier-border bg-dossier-bg/50 px-3 py-2"
            animate={{ opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-dossier-accent opacity-35" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-dossier-accent" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-dossier-muted">
              {statusLine}
            </span>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
