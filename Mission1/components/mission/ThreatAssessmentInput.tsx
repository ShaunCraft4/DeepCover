"use client";

import { ASSESSMENT_FULL_CREDIT_CHARS } from "@/lib/scoring";
import { Textarea } from "@/components/ui/textarea";

type ThreatAssessmentInputProps = {
  question?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function ThreatAssessmentInput({
  question = "What is the likely objective of this disinformation campaign?",
  value,
  onChange,
  disabled,
}: ThreatAssessmentInputProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-dossier-muted">
          Threat assessment (required to submit)
        </p>
        <p className="mt-2 text-sm text-dossier-text">{question}</p>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Tie your answer to the artifacts. Length affects score: aim for a full paragraph."
        className="min-h-[120px] resize-none font-sans text-sm"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-dossier-muted">
        <span>Saved in this browser tab only</span>
        <span
          className={
            value.trim().length >= ASSESSMENT_FULL_CREDIT_CHARS
              ? "text-dossier-accent"
              : "text-dossier-muted"
          }
        >
          {value.trim().length}/{ASSESSMENT_FULL_CREDIT_CHARS}+ chars for full assessment credit
        </span>
      </div>
    </div>
  );
}
