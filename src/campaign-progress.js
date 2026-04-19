/** Keep in sync with Mission1/lib/campaign-progress.ts */
export const CAMPAIGN_STORAGE_KEY = 'deepcover_campaign_v1';
export const CAMPAIGN_PROGRESS_EVENT = 'deepcover-campaign-progress';

/** localStorage: show congratulations toast once when campaign first hits 100%. */
export const CAMPAIGN_CONGRATS_KEY = 'deepcover_campaign_congrats_toast_v1';

/**
 * @returns {{
 *  m1Complete: boolean,
 *  m2Complete: boolean,
 *  m3Reached: boolean,
 *  m3Complete: boolean,
 *  m1BestScore?: number,
 *  m1Max?: number,
 *  m1Score?: number,
 *  m2Score?: number,
 *  m3Score?: number
 * }}
 */
export function readCampaignProgress() {
  try {
    const raw = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (!raw) {
      return { m1Complete: false, m2Complete: false, m3Reached: false, m3Complete: false };
    }
    const p = JSON.parse(raw);
    return {
      m1Complete: Boolean(p.m1Complete),
      m2Complete: Boolean(p.m2Complete),
      m3Reached: Boolean(p.m3Reached),
      m3Complete: Boolean(p.m3Complete),
      m1BestScore: typeof p.m1BestScore === 'number' ? p.m1BestScore : undefined,
      m1Max: typeof p.m1Max === 'number' ? p.m1Max : undefined,
      m1Score: typeof p.m1Score === 'number' ? p.m1Score : undefined,
      m2Score: typeof p.m2Score === 'number' ? p.m2Score : undefined,
      m3Score: typeof p.m3Score === 'number' ? p.m3Score : undefined,
    };
  } catch {
    return { m1Complete: false, m2Complete: false, m3Reached: false, m3Complete: false };
  }
}

/** @returns {number} 0–100 based on three training milestones (M1, M2, M3). */
export function getCampaignPercent(p) {
  const n = (p.m1Complete ? 1 : 0) + (p.m2Complete ? 1 : 0) + (p.m3Complete ? 1 : 0);
  return Math.round((n / 3) * 100);
}
