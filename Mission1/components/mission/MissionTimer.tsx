"use client";

import { useEffect, useMemo, useState } from "react";

import { useMissionStore } from "@/store/mission-store";

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function MissionTimer() {
  const startedAt = useMissionStore((s) => s.startedAt);
  const phase = useMissionStore((s) => s.phase);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt || phase !== "operations") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, phase]);

  const label = useMemo(() => {
    if (!startedAt) return "00:00";
    return formatElapsed(now - startedAt);
  }, [now, startedAt]);

  return (
    <div className="rounded-lg border border-dossier-border bg-dossier-bg/35 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-dossier-muted">
        Mission clock
      </p>
      <p className="mt-2 font-mono text-xl text-dossier-text">{label}</p>
      <p className="mt-2 text-[11px] text-dossier-muted">Elapsed (not scored)</p>
    </div>
  );
}
