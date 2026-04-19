/** Shared with `src/campaign-progress.js` (Dossier shell) — keep key + shape in sync. */
export const CAMPAIGN_STORAGE_KEY = "deepcover_campaign_v1";

export const CAMPAIGN_PROGRESS_EVENT = "deepcover-campaign-progress";

export type CampaignProgress = {
  m1Complete: boolean;
  m2Complete: boolean;
  m3Reached: boolean;
  /** Mission 03 Cyber Defense — all hub modules finished (local game state). */
  m3Complete: boolean;
  m1BestScore?: number;
  m1Max?: number;
  /** Mission 01 score normalized to 0-100 for cross-mission comparisons/certificate. */
  m1Score?: number;
  m2Score?: number;
  m3Score?: number;
  updatedAt?: string;
};

export function readCampaignProgress(): CampaignProgress {
  if (typeof window === "undefined") {
    return { m1Complete: false, m2Complete: false, m3Reached: false, m3Complete: false };
  }
  try {
    const raw = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (!raw) return { m1Complete: false, m2Complete: false, m3Reached: false, m3Complete: false };
    const p = JSON.parse(raw) as Partial<CampaignProgress>;
    return {
      m1Complete: Boolean(p.m1Complete),
      m2Complete: Boolean(p.m2Complete),
      m3Reached: Boolean(p.m3Reached),
      m3Complete: Boolean(p.m3Complete),
      m1BestScore: typeof p.m1BestScore === "number" ? p.m1BestScore : undefined,
      m1Max: typeof p.m1Max === "number" ? p.m1Max : undefined,
      m1Score: typeof p.m1Score === "number" ? p.m1Score : undefined,
      m2Score: typeof p.m2Score === "number" ? p.m2Score : undefined,
      m3Score: typeof p.m3Score === "number" ? p.m3Score : undefined,
      updatedAt: typeof p.updatedAt === "string" ? p.updatedAt : undefined,
    };
  } catch {
    return { m1Complete: false, m2Complete: false, m3Reached: false, m3Complete: false };
  }
}

export function writeCampaignProgress(patch: Partial<CampaignProgress>) {
  const next: CampaignProgress = {
    ...readCampaignProgress(),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CAMPAIGN_PROGRESS_EVENT));
}

export function markMission1Perfect(total: number, max: number) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((total / max) * 100))) : undefined;
  writeCampaignProgress({
    m1Complete: true,
    m1BestScore: total,
    m1Max: max,
    ...(typeof pct === "number" ? { m1Score: pct } : {}),
  });
}

/**
 * Persist latest Mission 01 debrief score even when not perfect, so dossier/certificate can show it.
 */
export function markMission1Score(total: number, max: number) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((total / max) * 100))) : undefined;
  writeCampaignProgress({
    m1BestScore: total,
    m1Max: max,
    ...(typeof pct === "number" ? { m1Score: pct } : {}),
  });
}

export function markMission2Complete(score?: number) {
  writeCampaignProgress({
    m2Complete: true,
    ...(typeof score === "number" ? { m2Score: Math.max(0, Math.min(100, Math.round(score))) } : {}),
  });
}

export function markMission3Reached() {
  writeCampaignProgress({ m3Reached: true });
}

export function markMission3Complete(score?: number) {
  writeCampaignProgress({
    m3Complete: true,
    m3Reached: true,
    ...(typeof score === "number" ? { m3Score: Math.max(0, Math.min(100, Math.round(score))) } : {}),
  });
}
