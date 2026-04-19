"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { DebriefReveal } from "@/components/mission2/DebriefReveal";
import { markMission2Complete } from "@/lib/campaign-progress";
import { useMission2Store } from "@/lib/mission2/store";

export default function Mission2DebriefPage() {
  const router = useRouter();
  const payload = useMission2Store((s) => s.debriefPayload);
  const resetMission = useMission2Store((s) => s.resetMission);
  const setPhase = useMission2Store((s) => s.setPhase);

  useEffect(() => {
    setPhase("debrief");
  }, [setPhase]);

  useEffect(() => {
    if (!payload) {
      router.replace("/mission2");
    }
  }, [payload, router]);

  if (!payload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text-secondary)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <DebriefReveal
        payload={payload}
        onExit={() => {
          markMission2Complete();
          resetMission();
          router.push("/mission3");
        }}
      />
    </div>
  );
}
