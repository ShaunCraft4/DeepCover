"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MissionBrief } from "@/data/types";

type MissionBriefingProps = {
  brief: MissionBrief;
  /** Gemini is generating session objective + assessment question. */
  loading?: boolean;
  onStart: () => void;
};

export function MissionBriefing({ brief, loading = false, onStart }: MissionBriefingProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      <motion.div
        className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-dossier-border glass-panel"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.99 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="pointer-events-none absolute inset-0 scanlines opacity-40" />
        <div className="pointer-events-none absolute -inset-24 bg-[radial-gradient(circle_at_30%_0%,rgba(0,255,157,0.14),transparent_55%)]" />

        <div className="relative border-b border-dossier-border px-8 py-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-dossier-accent">
                {brief.classifiedLine}
              </p>
              <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-dossier-text md:text-3xl">
                {brief.title}
              </h1>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-dossier-border bg-dossier-bg/60 text-dossier-accent shadow-glow-sm">
              <Shield className="h-5 w-5" aria-hidden />
            </div>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-md border border-dossier-border bg-dossier-bg/40 px-3 py-1.5 font-mono text-[11px] text-dossier-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-dossier-accent shadow-[0_0_12px_rgba(0,255,157,0.8)]" />
            <span className="text-dossier-text">BRIEFING PACKAGE</span>
            <span className="text-dossier-muted">·</span>
            <span>{brief.missionCode}</span>
          </div>
        </div>

        <div className="relative space-y-5 px-8 py-7 text-sm leading-relaxed text-dossier-muted">
          <p className="text-dossier-text/90">{brief.handlerIntro}</p>
          <div className="rounded-lg border border-dossier-border bg-dossier-bg/35 p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-dossier-accent">
              Mission objective
            </p>
            {loading ? (
              <p className="mt-2 animate-pulse text-dossier-muted">Generating objectives…</p>
            ) : (
              <p className="mt-2 text-dossier-text">{brief.objective}</p>
            )}
          </div>
          <p className="text-xs text-dossier-muted">
            Authentication is probabilistic. Document uncertainty when the evidence does not
            justify a hard call.
          </p>
        </div>

        <div className="relative flex items-center justify-between gap-4 border-t border-dossier-border bg-dossier-bg/30 px-8 py-5">
          <p className="font-mono text-[11px] text-dossier-muted">
            CHANNEL: SECURE / TRAINING NODE
          </p>
          <Button
            type="button"
            onClick={onStart}
            disabled={loading}
            className="min-w-[160px] font-semibold"
          >
            {loading ? "Preparing…" : "Enter operations deck"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
