"use client";

import { Check, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

type MissionChecklistProps = {
  artifactTotal: number;
  taggedCount: number;
  assessmentChars: number;
  phase: "operations" | "debrief" | "briefing";
};

function Row({
  done,
  label,
  detail,
}: {
  done: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-mono",
          done
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            : "border-dossier-border bg-dossier-panel/40 text-dossier-muted",
        )}
        aria-hidden
      >
        {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Circle className="h-3 w-3" />}
      </div>
      <div className="min-w-0">
        <p className={cn("text-sm font-medium", done ? "text-dossier-text" : "text-dossier-text/90")}>
          {label}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-dossier-muted">{detail}</p>
      </div>
    </div>
  );
}

export function MissionChecklist({
  artifactTotal,
  taggedCount,
  assessmentChars,
  phase,
}: MissionChecklistProps) {
  if (phase !== "operations") return null;

  const allTagged = taggedCount >= artifactTotal && artifactTotal > 0;
  const assessmentDone = assessmentChars > 0;

  return (
    <div className="rounded-xl border border-dossier-accent/25 bg-dossier-accent/[0.06] px-4 py-4 md:px-5 md:py-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-dossier-accent">
            What to do
          </p>
          <p className="mt-1 text-sm text-dossier-text">
            Work left to right: pick an item, inspect it, tag it, then answer the assessment
            question. Submit only when the checklist below is complete.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 border-t border-dossier-border/80 pt-4 sm:grid-cols-2">
        <Row
          done={allTagged}
          label="Classify every artifact"
          detail={`Choose REAL, SYNTHETIC, or UNCERTAIN for each row in the evidence list (${taggedCount}/${artifactTotal}).`}
        />
        <Row
          done={assessmentDone}
          label="Threat assessment"
          detail="Answer the handler question in your own words (required to submit)."
        />
      </div>
    </div>
  );
}
