/** Mirrors `src/campaign-progress.js` — standalone Mission2 cannot import dossier src. */
const KEY = 'deepcover_campaign_v1';
const EVT = 'deepcover-campaign-progress';

function readRaw() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function markMission2FirewallComplete() {
  try {
    const next = { ...readRaw(), m2Complete: true, updatedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch (e) {
    console.warn('[Mission2] campaign progress', e);
  }
}
