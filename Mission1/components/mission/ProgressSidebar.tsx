"use client";

import { motion } from "framer-motion";

import type { PlayerTag } from "@/data/types";
import { taggedCount } from "@/store/mission-store";

type ProgressSidebarProps = {
  tags: Record<string, PlayerTag | null>;
  artifactTotal: number;
};

export function ProgressSidebar({ tags, artifactTotal }: ProgressSidebarProps) {
  const done = taggedCount(tags);
  const total = artifactTotal;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="rounded-lg border border-dossier-border bg-dossier-bg/35 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-dossier-muted">
          Review progress
        </p>
        <p className="font-mono text-[10px] text-dossier-muted">
          {done}/{total}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full border border-dossier-border bg-dossier-panel">
        <motion.div
          className="h-full bg-gradient-to-r from-dossier-accent/20 via-dossier-accent to-dossier-accent/40"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
        />
      </div>
      <p className="mt-2 text-[11px] leading-snug text-dossier-muted">
        Bar fills as you tag items. Assessment is tracked separately in the checklist above.
      </p>
    </div>
  );
}
