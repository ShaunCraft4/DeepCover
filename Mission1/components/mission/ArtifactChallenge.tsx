"use client";

import { useEffect, useState } from "react";

import type { Artifact } from "@/data/types";
import { DossierAudio } from "@/components/ui/dossier-audio";
import { useMissionStore } from "@/store/mission-store";

type ArtifactChallengeProps = {
  artifact: Artifact | null;
  disabled: boolean;
};

export function ArtifactChallenge({ artifact, disabled }: ArtifactChallengeProps) {
  const q = useMissionStore((s) =>
    artifact ? s.artifactQuestions[artifact.id] ?? "" : "",
  );
  const qAudio = useMissionStore((s) =>
    artifact ? s.questionAudioSrc[artifact.id] ?? null : null,
  );

  const [elevenLabsListenUrl, setElevenLabsListenUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!artifact || !q || disabled || qAudio) {
      setElevenLabsListenUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    let cancelled = false;
    (async () => {
      const r = await fetch("/mission1/api/mission/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: q.slice(0, 1200) }),
      });
      if (cancelled || !r.ok) return;
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      setElevenLabsListenUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [artifact?.id, q, qAudio, disabled]);

  const listenSrc = qAudio ?? elevenLabsListenUrl;

  if (!artifact || !q) return null;

  return (
    <div className="rounded-lg border border-dossier-accent/20 bg-dossier-accent/5 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-dossier-accent">
        AI challenge (this run)
      </p>
      <p className="mt-2 text-sm leading-relaxed text-dossier-text">{q}</p>
      {listenSrc && !disabled ? (
        <div className="mt-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-dossier-muted">
            Listen (ElevenLabs)
          </p>
          <DossierAudio className="mt-1" controls preload="metadata" src={listenSrc} />
        </div>
      ) : null}
    </div>
  );
}
