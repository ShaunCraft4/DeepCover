"use client";

import { useLayoutEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";

import { MISSION_BRIEF } from "@/data/mission1-mock";
import { taggedCount, useMissionStore } from "@/store/mission-store";

import { ConsoleHeader } from "./ConsoleHeader";
import { DebriefReveal } from "./DebriefReveal";
import { EvidenceBoard } from "./EvidenceBoard";
import { MediaViewer } from "./MediaViewer";
import { MissionBriefing } from "./MissionBriefing";
import { ArtifactChallenge } from "./ArtifactChallenge";
import { MissionTimer } from "./MissionTimer";
import { ProgressSidebar } from "./ProgressSidebar";
import { TagSelector } from "./TagSelector";
import { ThreatAssessmentInput } from "./ThreatAssessmentInput";

import { Button } from "@/components/ui/button";

/** Avoid double `initSession` in React Strict Mode (dev) while still randomizing once per load. */
let missionSessionSeeded = false;

export function MissionShell() {
  const phase = useMissionStore((s) => s.phase);
  const submitting = useMissionStore((s) => s.submitting);
  const artifacts = useMissionStore((s) => s.artifacts);
  const sessionObjective = useMissionStore((s) => s.sessionObjective);
  const assessmentQuestion = useMissionStore((s) => s.assessmentQuestion);
  const promptsLoading = useMissionStore((s) => s.promptsLoading);
  const sessionBootstrapError = useMissionStore((s) => s.sessionBootstrapError);
  const sessionHints = useMissionStore((s) => s.sessionHints);
  const initSession = useMissionStore((s) => s.initSession);
  const startMission = useMissionStore((s) => s.startMission);
  const selectedId = useMissionStore((s) => s.selectedId);
  const selectArtifact = useMissionStore((s) => s.selectArtifact);
  const tags = useMissionStore((s) => s.tags);
  const setTag = useMissionStore((s) => s.setTag);
  const assessment = useMissionStore((s) => s.assessment);
  const setAssessment = useMissionStore((s) => s.setAssessment);
  const submitMission = useMissionStore((s) => s.submitMission);
  const debrief = useMissionStore((s) => s.debrief);
  const closeDebrief = useMissionStore((s) => s.closeDebrief);

  useLayoutEffect(() => {
    if (missionSessionSeeded) return;
    missionSessionSeeded = true;
    void initSession();
  }, [initSession]);

  const selected = useMemo(
    () => artifacts.find((a) => a.id === selectedId) ?? null,
    [artifacts, selectedId],
  );

  const statusLine =
    sessionBootstrapError && phase === "briefing"
      ? `AI bootstrap issue — using fallback assets: ${sessionBootstrapError}`
      : sessionHints && phase === "briefing"
        ? `Note: ${sessionHints}`
        : phase === "briefing" && promptsLoading
          ? "Generating AI scenario (Gemini + ElevenLabs)…"
          : phase === "briefing"
            ? "Awaiting operator handshake"
            : phase === "debrief"
              ? "Debrief in progress"
              : "Live operations";

  const canSubmit =
    artifacts.every((a) => Boolean(tags[a.id])) && assessment.trim().length > 0;
  const tagsComplete = artifacts.every((a) => Boolean(tags[a.id]));
  const nTagged = taggedCount(tags);

  const briefingBrief = useMemo(
    () => ({ ...MISSION_BRIEF, objective: sessionObjective }),
    [sessionObjective],
  );

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,157,0.08),transparent_55%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.18] scanlines" />

      <ConsoleHeader
        missionTitle={MISSION_BRIEF.title}
        missionCode={MISSION_BRIEF.missionCode}
        statusLine={statusLine}
      />

      <AnimatePresence mode="wait">
        {phase === "briefing" ? (
          <MissionBriefing
            key="mission-briefing"
            brief={briefingBrief}
            loading={promptsLoading}
            onStart={startMission}
          />
        ) : null}
      </AnimatePresence>

      <DebriefReveal open={phase === "debrief"} result={debrief} onClose={closeDebrief} />

      <main className="relative mx-auto max-w-[1600px] px-4 py-6 md:px-6">
        <div className="grid min-h-[calc(100vh-88px)] grid-cols-1 gap-4 xl:grid-cols-[360px_1fr_360px]">
          <section className="glass-panel relative overflow-hidden rounded-xl p-4 md:p-5">
            <div className="pointer-events-none absolute inset-0 opacity-25 scanlines" />
            <div className="relative min-h-0">
              <EvidenceBoard
                artifacts={artifacts}
                selectedId={selectedId}
                tags={tags}
                onSelect={selectArtifact}
              />
            </div>
          </section>

          <section className="min-h-[520px]">
            <MediaViewer artifact={selected} />
          </section>

          <section className="glass-panel relative overflow-hidden rounded-xl p-4 md:p-5">
            <div className="pointer-events-none absolute inset-0 opacity-25 scanlines" />
            <div className="relative flex h-full flex-col gap-5">
              <MissionTimer />
              <ProgressSidebar tags={tags} artifactTotal={artifacts.length} />

              <ArtifactChallenge artifact={selected} disabled={phase !== "operations"} />

              <div className="rounded-lg border border-dossier-border bg-dossier-panel/25 p-4">
                <TagSelector
                  value={selected ? (tags[selected.id] ?? null) : null}
                  onChange={(tag) => {
                    if (!selected) return;
                    setTag(selected.id, tag);
                  }}
                  disabled={!selected || phase !== "operations"}
                />
              </div>

              <ThreatAssessmentInput
                question={assessmentQuestion}
                value={assessment}
                onChange={setAssessment}
                disabled={phase !== "operations"}
              />

              <div className="mt-auto space-y-2 border-t border-dossier-border pt-4">
                <Button
                  type="button"
                  className="w-full font-semibold"
                  disabled={!canSubmit || phase !== "operations" || submitting}
                  onClick={submitMission}
                >
                  {submitting ? "Submitting…" : "Submit mission package"}
                </Button>
                {phase === "operations" && !canSubmit ? (
                  <p className="text-balance text-center text-xs leading-relaxed text-dossier-muted">
                    {!tagsComplete
                      ? `Select each artifact in the evidence rail and choose REAL, SYNTHETIC, or UNCERTAIN (${nTagged}/${artifacts.length} classified). `
                      : null}
                    {assessment.trim().length === 0
                      ? "Add text in the threat assessment box above."
                      : null}
                  </p>
                ) : null}
                <p className="text-center font-mono text-[10px] text-dossier-muted">
                  Submission locks your tags for this pass
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
