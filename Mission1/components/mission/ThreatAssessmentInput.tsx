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
          Final threat assessment
        </p>
        <p className="mt-2 text-sm text-dossier-text">{question}</p>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Synthesize the narrative mechanics: who benefits, what truth is being obscured, and how the synthetic artifacts cooperate with the real ones."
        className="min-h-[140px] resize-none font-sans text-sm"
      />
      <div className="flex items-center justify-between font-mono text-[10px] text-dossier-muted">
        <span>Autosave: local session only</span>
        <span>{value.trim().length} chars</span>
      </div>
    </div>
  );
}
