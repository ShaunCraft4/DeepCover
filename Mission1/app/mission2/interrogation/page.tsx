"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { ContradictionLog } from "@/components/mission2/ContradictionLog";
import { InterrogationChat } from "@/components/mission2/InterrogationChat";
import { PlayHintBanner } from "@/components/mission2/PlayHintBanner";
import { PsychProfile } from "@/components/mission2/PsychProfile";
import { SuspectPortrait } from "@/components/mission2/SuspectPortrait";
import { TensionMeter } from "@/components/mission2/TensionMeter";
import { VerdictForm } from "@/components/mission2/VerdictForm";
import { useMission2Store } from "@/lib/mission2/store";

export default function Mission2InterrogationPage() {
  const router = useRouter();
  const suspect = useMission2Store((s) => s.suspect);
  const tensionLevel = useMission2Store((s) => s.tensionLevel);
  const turnNumber = useMission2Store((s) => s.turnNumber);
  const codeRevealed = useMission2Store((s) => s.codeRevealed);
  const verdictUnlocked = useMission2Store((s) => s.verdictUnlocked);
  const behavioralFlag = useMission2Store((s) => s.behavioralFlag);
  const contradictionsLogged = useMission2Store((s) => s.contradictionsLogged);
  const lastContradictionIntroduced = useMission2Store((s) => s.lastContradictionIntroduced);
  const setPhase = useMission2Store((s) => s.setPhase);

  useEffect(() => {
    if (!suspect) {
      router.replace("/mission2/briefing");
    }
  }, [router, suspect]);

  useEffect(() => {
    setPhase("interrogation");
  }, [setPhase]);

  const completedTurns = useMemo(() => turnNumber, [turnNumber]);

  if (!suspect) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text-secondary)]">
        Redirecting…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-3 py-4 text-[var(--text-primary)] md:px-6 md:py-6">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 lg:flex-row">
        <div className="lg:w-[280px]">
          <ContradictionLog
            items={contradictionsLogged}
            onAnnotate={() => {
              /* annotations are optional local notes */
            }}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <PlayHintBanner />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
            <SuspectPortrait
              name={suspect.name}
              tensionLevel={tensionLevel}
              codeRevealed={codeRevealed}
              contradictionThisTurn={lastContradictionIntroduced}
            />
            <PsychProfile suspect={suspect} completedTurns={completedTurns} />
          </div>

          <InterrogationChat
            suspect={suspect}
            onVerdictNeeded={() => {
              /* verdict modal driven by store.verdictUnlocked */
            }}
          />
        </div>

        <div className="flex w-full flex-row items-stretch justify-end gap-3 lg:w-[120px] lg:flex-col">
          <div className="hidden lg:block" />
          <TensionMeter value={tensionLevel} behavioralFlag={behavioralFlag} />
        </div>
      </div>

      <VerdictForm open={verdictUnlocked} />
    </main>
  );
}
