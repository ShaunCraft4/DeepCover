"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ARTIFACTS, MISSION_BRIEF } from "@/data/mission1-mock";
import type { AiDebrief, DebriefResult } from "@/store/mission-store";

type DebriefRevealProps = {
  open: boolean;
  result: DebriefResult | null;
  /** Dismiss debrief and start a new Mission 1 run. */
  onClose: () => void;
  /** When score is perfect, advance to Mission 2 (campaign progress is saved by the parent). */
  onContinueToMission2?: () => void;
};

function gradeLabel(score: number, max: number) {
  const r = score / Math.max(max, 1);
  if (r >= 0.86) return "HIGH CONFIDENCE";
  if (r >= 0.65) return "MODERATE CONFIDENCE";
  if (r >= 0.45) return "RECOVERABLE";
  return "NEEDS REMEDIATION";
}

export function DebriefReveal({
  open,
  result,
  onClose,
  onContinueToMission2,
}: DebriefRevealProps) {
  const confidence = useMemo(() => {
    if (!result) return "";
    return gradeLabel(result.total, result.max);
  }, [result]);

  const perfect = Boolean(result && result.max > 0 && result.total >= result.max);

  const ai = (result?.ai ?? null) as AiDebrief | null;
  const aiError = result?.aiError ?? null;

  return (
    <AnimatePresence>
      {open && result ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <motion.div
            className="relative h-[min(92vh,920px)] w-full max-w-5xl overflow-hidden rounded-2xl border border-dossier-border shadow-glow"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.99 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,255,157,0.18),transparent_55%),radial-gradient(circle_at_90%_30%,rgba(255,255,255,0.06),transparent_45%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-35 scanlines" />
            <motion.div
              className="pointer-events-none absolute -inset-40 opacity-60"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
              style={{
                background:
                  "conic-gradient(from 180deg, rgba(0,255,157,0.0), rgba(0,255,157,0.10), rgba(0,255,157,0.0))",
              }}
            />

            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-6 border-b border-dossier-border px-8 py-7">
                <div>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="inline-flex items-center gap-2 rounded-md border border-dossier-accent/25 bg-dossier-accent/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.26em] text-dossier-accent"
                  >
                    <Sparkles className="h-4 w-4" />
                    Debrief authorized
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="mt-4 text-3xl font-semibold tracking-tight text-dossier-text md:text-4xl"
                  >
                    Mission closure
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16 }}
                    className="mt-2 max-w-2xl text-sm leading-relaxed text-dossier-muted"
                  >
                    Ground truth is released for training calibration. Review each line item and
                    lock the lesson into your mental model—this is how influence packages behave in
                    the wild.
                  </motion.p>
                </div>

                <motion.div
                  className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full border border-dossier-border bg-dossier-bg/40"
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.18, type: "spring", stiffness: 260, damping: 22 }}
                >
                  <div className="absolute inset-2 rounded-full border border-dossier-accent/20" />
                  <div className="text-center">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-dossier-muted">
                      Score
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-dossier-text">
                      {result.total}
                      <span className="text-sm font-medium text-dossier-muted">/{result.max}</span>
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                  <div className="space-y-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-dossier-muted">
                      Artifact outcomes
                    </p>
                    <div className="space-y-3">
                      {result.perArtifact.map((row, idx) => {
                        const artifact = ARTIFACTS.find((a) => a.id === row.id);
                        const truthLabel = artifact?.isSynthetic ? "SYNTHETIC" : "REAL";
                        const player = row.tag ?? "—";
                        const correct =
                          row.correctness === true
                            ? "correct"
                            : row.correctness === false
                              ? "wrong"
                              : "partial";

                        return (
                          <motion.div
                            key={row.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.22 + idx * 0.06 }}
                            className="rounded-xl border border-dossier-border bg-dossier-panel/25 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-dossier-text">
                                  {row.title}
                                </p>
                                <p className="mt-1 font-mono text-[10px] text-dossier-muted">
                                  PLAYER: {player} · TRUTH: {truthLabel} · +{row.points} pts
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {correct === "correct" ? (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-100">
                                    <Check className="h-3.5 w-3.5" />
                                    Confirmed
                                  </span>
                                ) : correct === "partial" ? (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-amber-100">
                                    <Minus className="h-3.5 w-3.5" />
                                    Uncertain
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/25 bg-rose-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-rose-100">
                                    <X className="h-3.5 w-3.5" />
                                    Miss
                                  </span>
                                )}
                              </div>
                            </div>
                            {artifact ? (
                              <p className="mt-3 text-xs leading-relaxed text-dossier-muted">
                                <span className="font-mono text-dossier-accent">DEBRIEF · </span>
                                {artifact.explanation}
                              </p>
                            ) : null}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-dossier-border bg-dossier-bg/35 p-5">
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-dossier-muted">
                        Confidence summary
                      </p>
                      <p className="mt-3 text-lg font-semibold text-dossier-text">{confidence}</p>
                      <p className="mt-2 text-xs leading-relaxed text-dossier-muted">
                        This is a training heuristic, not a psychometric score. It reflects tagging
                        rigor plus assessment completeness.
                      </p>
                    </div>

                    <div className="rounded-xl border border-dossier-border bg-dossier-bg/35 p-5">
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-dossier-muted">
                        Threat assessment (written)
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-dossier-muted">
                        Tags score proof on each artifact; this box scores depth of your written
                        answer (up to +20). They are independent — perfect tags can still leave
                        points on the table here.
                      </p>
                      <p className="mt-3 text-sm text-dossier-text">
                        +{result.assess.points} / 20 pts — {result.assess.note}
                      </p>
                    </div>

                    <div className="rounded-xl border border-dossier-border bg-dossier-bg/35 p-5">
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-dossier-muted">
                        AI debrief
                      </p>
                      {ai ? (
                        <div className="mt-3 space-y-4">
                          <p className="text-sm leading-relaxed text-dossier-text/90">{ai.objective}</p>
                          <div className="grid gap-3">
                            <div>
                              <p className="font-mono text-[10px] uppercase tracking-wider text-dossier-muted">
                                Strengths
                              </p>
                              <ul className="mt-2 space-y-1 text-sm text-dossier-text/90">
                                {ai.strengths.map((s) => (
                                  <li key={s}>— {s}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="font-mono text-[10px] uppercase tracking-wider text-dossier-muted">
                                Risks
                              </p>
                              <ul className="mt-2 space-y-1 text-sm text-dossier-text/90">
                                {ai.risks.map((s) => (
                                  <li key={s}>— {s}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="font-mono text-[10px] uppercase tracking-wider text-dossier-muted">
                                Next actions
                              </p>
                              <ul className="mt-2 space-y-1 text-sm text-dossier-text/90">
                                {ai.next_actions.map((s) => (
                                  <li key={s}>— {s}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ) : aiError ? (
                        <p className="mt-3 text-xs leading-relaxed text-dossier-muted">
                          AI debrief unavailable. {aiError}
                        </p>
                      ) : (
                        <p className="mt-3 text-xs leading-relaxed text-dossier-muted">
                          Generating AI debrief…
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-dossier-accent/20 bg-dossier-accent/5 p-5">
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-dossier-accent">
                        Campaign objective (ground truth)
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-dossier-text/90">
                        {MISSION_BRIEF.campaignObjectiveReveal}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-dossier-border bg-dossier-bg/35 px-8 py-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-mono text-[11px] text-dossier-muted">
                  SESSION LOGGED · TRAINING NODE
                </p>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {perfect && onContinueToMission2 ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="border-dossier-border"
                      >
                        Run again
                      </Button>
                      <Button
                        type="button"
                        onClick={onContinueToMission2}
                        className="bg-dossier-accent text-dossier-bg hover:bg-dossier-accent/90"
                      >
                        Continue to Mission 2
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="border-dossier-accent/30"
                    >
                      Next briefing
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
