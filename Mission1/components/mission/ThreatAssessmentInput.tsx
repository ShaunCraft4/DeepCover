"use client";

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
        placeholder="Short paragraphs are fine. Tie your answer to what you saw in the artifacts."
        className="min-h-[120px] resize-none font-sans text-sm"
      />
      <p className="font-mono text-[10px] text-dossier-muted">Saved in this browser tab only</p>
    </div>
  );
}
