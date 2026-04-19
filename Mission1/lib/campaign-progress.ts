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
  writeCampaignProgress({ m1Complete: true, m1BestScore: total, m1Max: max });
}

export function markMission2Complete() {
  writeCampaignProgress({ m2Complete: true });
}

export function markMission3Reached() {
  writeCampaignProgress({ m3Reached: true });
}

export function markMission3Complete() {
  writeCampaignProgress({ m3Complete: true, m3Reached: true });
}
