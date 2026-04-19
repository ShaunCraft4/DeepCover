import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import {
  CAMPAIGN_CONGRATS_KEY,
  CAMPAIGN_PROGRESS_EVENT,
  CAMPAIGN_STORAGE_KEY,
  getCampaignPercent,
  readCampaignProgress,
} from './campaign-progress.js';
import { getClientEnv } from './env.js';

const env = getClientEnv();

function applyMission1Links() {
  const configured = String(env.mission1Url ?? '').trim();
  document.querySelectorAll('a.js-mission1-link').forEach((a) => {
    const extra = (a.getAttribute('data-mission1-path') || '').trim();
    const tail = !extra || extra === '/' ? '/' : extra.startsWith('/') ? extra : `/${extra}`;

    if (configured) {
      const base = configured.replace(/\/+$/, '');
      a.href = `${base}${tail === '/' ? '/' : tail}`;
      return;
    }

    const root = `${window.location.origin}/mission1`.replace(/\/+$/, '');
    a.href = `${root}${tail === '/' ? '/' : tail}`;
  });
}

if (typeof window !== 'undefined') {
  applyMission1Links();
  Object.defineProperty(window, 'DOSSIER_ENV', {
    value: Object.freeze({ ...env }),
    writable: false,
    configurable: false,
  });
}

const CFG = {
  url: env.supabaseUrl,
  anonKey: env.supabaseAnonKey,
};
const toastEl = document.getElementById('dossier-toast');
let supabase = null;

function toast(msg, ms = 4200) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('is-visible');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('is-visible'), ms);
}

/** Supabase sometimes returns JSON in error.message (e.g. validation_failed). */
function parseAuthErrorText(error) {
  const raw = error?.message ?? String(error ?? '');
  try {
    const j = JSON.parse(raw);
    if (typeof j.msg === 'string') return j.msg;
    if (typeof j.message === 'string') return j.message;
  } catch {
    /* not JSON */
  }
  return raw;
}

function explainAuthError(error) {
  const text = parseAuthErrorText(error);
  if (/provider is not enabled|Unsupported provider|validation_failed/i.test(text)) {
    return 'Enable Google in Supabase: Authentication → Providers → Google (on), then add OAuth Client ID and Client Secret from Google Cloud Console. Also add this app URL under Redirect URLs.';
  }
  return text || 'Sign-in failed.';
}

/** OAuth errors sometimes land in the URL hash after redirect. */
function consumeHashOAuthError() {
  const h = window.location.hash;
  if (!h || !h.includes('error')) return;
  const q = new URLSearchParams(h.replace(/^#/, ''));
  const code = q.get('error');
  const desc = q.get('error_description');
  if (!code && !desc) return;
  let msg = desc ? decodeURIComponent(desc.replace(/\+/g, ' ')) : code;
  if (/not enabled|Unsupported provider/i.test(msg)) {
    msg = explainAuthError({ message: msg });
  }
  toast(msg, 8000);
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

function cfgOk() {
  return !!(CFG.url && CFG.anonKey);
}

const screenSelect = document.getElementById('screen-mission-select');
const screens = {
  select: screenSelect,
  deepfake: document.getElementById('screen-mission-deepfake'),
  interrogation: document.getElementById('screen-mission-interrogation'),
  cyber: document.getElementById('screen-mission-cyber'),
};

function closeAllScreens() {
  document.body.classList.remove('dossier-app-lock');
  Object.values(screens).forEach((el) => {
    if (!el) return;
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
  });
}

function openScreen(name) {
  closeAllScreens();
  const el = screens[name];
  if (!el) return;
  document.body.classList.add('dossier-app-lock');
  el.classList.add('is-open');
  el.setAttribute('aria-hidden', 'false');
  if (name === 'select') {
    history.replaceState(null, '', '#briefing');
  } else {
    history.replaceState(null, '', '#mission-' + name);
  }
}

function setOperativeEmail(user) {
  const bar = document.getElementById('dossier-user-email');
  if (!bar || !user?.email) return;
  bar.replaceChildren();
  const line = document.createElement('span');
  line.textContent = 'Operative';
  const br = document.createElement('br');
  const em = document.createElement('strong');
  em.textContent = user.email;
  bar.append(line, br, em);
}

function readOperativeName() {
  const em = document.querySelector('#dossier-user-email strong');
  const raw = String(em?.textContent || 'AGENT CALLSIGN').trim();
  if (!raw || raw === 'Operative') return 'AGENT CALLSIGN';
  const base = raw.includes('@') ? raw.split('@')[0] : raw;
  return base.replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase() || 'AGENT CALLSIGN';
}

function toPercent(best, max) {
  if (typeof best !== 'number' || typeof max !== 'number' || max <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((best / max) * 100)));
}

function getUnitScores(p) {
  const m1 =
    typeof p.m1Score === 'number'
      ? Math.max(0, Math.min(100, Math.round(p.m1Score)))
      : toPercent(p.m1BestScore, p.m1Max);
  return {
    m1,
    m2: typeof p.m2Score === 'number' ? Math.max(0, Math.min(100, Math.round(p.m2Score))) : null,
    m3: typeof p.m3Score === 'number' ? Math.max(0, Math.min(100, Math.round(p.m3Score))) : null,
  };
}

function drawScoreRow(doc, label, value, y, accent = [0, 255, 157]) {
  doc.setFont('courier', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(136, 136, 136);
  doc.text(label, 20, y);
  doc.setFillColor(30, 30, 30);
  doc.roundedRect(88, y - 5, 88, 4.8, 1.8, 1.8, 'F');
  if (typeof value === 'number') {
    const w = Math.max(1.8, (88 * value) / 100);
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.roundedRect(88, y - 5, w, 4.8, 1.8, 1.8, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(String(value).padStart(2, '0') + '/100', 183, y);
  } else {
    doc.setFont('courier', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(68, 68, 68);
    doc.text('PENDING', 183, y);
  }
}

function downloadCertificate() {
  const p = readCampaignProgress();
  const pct = getCampaignPercent(p);
  const name = readOperativeName();
  const scores = getUnitScores(p);
  const scoreList = [scores.m1, scores.m2, scores.m3].filter((n) => typeof n === 'number');
  const avg = scoreList.length ? Math.round(scoreList.reduce((a, b) => a + b, 0) / scoreList.length) : 0;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFillColor(5, 5, 5);
  doc.rect(0, 0, 297, 210, 'F');
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.5);
  doc.rect(8, 8, 281, 194);
  doc.setDrawColor(0, 255, 157);
  doc.setLineWidth(0.9);
  doc.rect(10, 10, 277, 190);

  doc.setFont('courier', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 255, 157);
  doc.text('DOSSIER CERTIFICATE OF COMPLETION', 148.5, 28, { align: 'center' });
  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(68, 68, 68);
  doc.text('INTELLIGENCE TRAINING DIVISION', 148.5, 34, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(136, 136, 136);
  doc.text('This certifies that operative', 148.5, 52, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(240, 240, 240);
  doc.text(name, 148.5, 64, { align: 'center' });
  doc.setDrawColor(42, 42, 42);
  doc.line(74, 68, 223, 68);

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(136, 136, 136);
  doc.text('has completed all active training units with the following mission scores:', 148.5, 76, {
    align: 'center',
  });

  drawScoreRow(doc, 'MISSION 01  DEEPFAKE DETECTION', scores.m1, 94, [0, 255, 157]);
  drawScoreRow(doc, 'MISSION 02  COUNTER-INTEL FIREWALL', scores.m2, 106, [0, 212, 255]);
  drawScoreRow(doc, 'MISSION 03  CYBER DEFENSE', scores.m3, 118, [255, 184, 0]);

  doc.setDrawColor(30, 30, 30);
  doc.line(20, 128, 277, 128);
  doc.setFont('courier', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(136, 136, 136);
  doc.text('OVERALL CAMPAIGN SCORE', 20, 138);
  doc.setFont('courier', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 255, 157);
  doc.text(String(avg) + '/100', 82, 138);

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(68, 68, 68);
  doc.text(`Issued: ${new Date().toISOString().slice(0, 10)}  ·  Training Progress: ${pct}%`, 20, 182);
  doc.text('DOSSIER // CLASSIFIED TRAINING RECORD', 277, 182, { align: 'right' });

  const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`dossier-certificate-${safeName || 'operative'}.pdf`);
}

function renderCampaignProgressBar() {
  const wrap = document.getElementById('dossier-campaign-progress');
  if (!wrap) return;
  const p = readCampaignProgress();
  const pct = getCampaignPercent(p);
  const steps = [
    { id: 'm1', label: 'M1', done: p.m1Complete, hint: 'Deepfake — perfect run' },
    { id: 'm2', label: 'M2', done: p.m2Complete, hint: 'Counter-Intel Firewall session' },
    { id: 'm3', label: 'M3', done: p.m3Complete, hint: 'Cyber Defense — all modules' },
  ];
  const filled = steps.filter((s) => s.done).length;
  wrap.innerHTML = '';

  const pctRow = document.createElement('div');
  pctRow.className = 'campaign-progress-pct-row';
  const pctLabel = document.createElement('div');
  pctLabel.className = 'campaign-progress-pct-head';
  pctLabel.innerHTML =
    '<span class="campaign-progress-pct-title">Training progress</span>' +
    `<span class="campaign-progress-pct-value" aria-live="polite">${pct}%</span>`;
  const pctTrack = document.createElement('div');
  pctTrack.className = 'campaign-progress-pct-track';
  pctTrack.setAttribute('role', 'progressbar');
  pctTrack.setAttribute('aria-valuemin', '0');
  pctTrack.setAttribute('aria-valuemax', '100');
  pctTrack.setAttribute('aria-valuenow', String(pct));
  pctTrack.setAttribute('aria-label', `Training progress ${pct} percent`);
  const pctFill = document.createElement('div');
  pctFill.className = 'campaign-progress-pct-fill';
  pctFill.style.width = pct + '%';
  pctTrack.appendChild(pctFill);
  pctRow.appendChild(pctLabel);
  pctRow.appendChild(pctTrack);
  wrap.appendChild(pctRow);

  const track = document.createElement('div');
  track.className = 'campaign-progress-track';
  track.setAttribute('role', 'group');
  track.setAttribute('aria-label', 'Campaign milestones');
  steps.forEach((s, i) => {
    const seg = document.createElement('div');
    seg.className = 'campaign-progress-seg' + (s.done ? ' is-done' : '');
    seg.dataset.mission = s.id;
    seg.title = s.hint;
    const lab = document.createElement('span');
    lab.className = 'campaign-progress-seg-label';
    lab.textContent = s.label;
    seg.appendChild(lab);
    track.appendChild(seg);
    if (i < steps.length - 1) {
      const conn = document.createElement('div');
      conn.className = 'campaign-progress-conn' + (s.done ? ' is-done' : '');
      track.appendChild(conn);
    }
  });
  wrap.appendChild(track);

  const cap = document.createElement('p');
  cap.className = 'campaign-progress-caption';
  if (pct >= 100) {
    cap.textContent =
      'Campaign complete — all training milestones cleared. You are cleared for live deployment rotations.';
  } else if (filled === 0) {
    cap.textContent =
      'Earn progress by completing Mission 01 (perfect score), Mission 02 (firewall session), and Mission 03 (all Cyber Defense modules).';
  } else {
    cap.textContent = `Milestones cleared: ${filled} of 3 (${pct}% overall).`;
  }
  wrap.appendChild(cap);

  const actionRow = document.createElement('div');
  actionRow.className = 'campaign-progress-actions';
  const certBtn = document.createElement('button');
  certBtn.type = 'button';
  certBtn.className = 'campaign-cert-btn';
  certBtn.textContent = 'Download Certificate';
  certBtn.disabled = false;
  certBtn.title = 'Download your training certificate';
  certBtn.addEventListener('click', downloadCertificate);
  actionRow.appendChild(certBtn);
  wrap.appendChild(actionRow);

  if (pct >= 100) {
    const banner = document.createElement('div');
    banner.className = 'campaign-complete-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML =
      '<p class="campaign-complete-banner-title">Campaign complete</p>' +
      '<p class="campaign-complete-banner-sub">Congratulations, operative. All training tracks are finished.</p>';
    wrap.appendChild(banner);
    if (!localStorage.getItem(CAMPAIGN_CONGRATS_KEY)) {
      localStorage.setItem(CAMPAIGN_CONGRATS_KEY, '1');
      toast('Congratulations — 100% training progress complete. Outstanding work, operative.', 9000);
    }
  }

  wrap.setAttribute('data-progress-pct', String(pct));
}

function showMissionBriefing() {
  openScreen('select');
  renderCampaignProgressBar();
  if (supabase) {
    supabase.auth.getUser().then(({ data: { user } }) => setOperativeEmail(user));
  }
}

async function recordMissionStart(missionKey) {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const { data, error: fetchErr } = await supabase
      .from('user_progress')
      .select('missions')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchErr && !/PGRST116|does not exist|Could not find/i.test(fetchErr.message || '')) {
      console.warn('[dossier] progress fetch', fetchErr);
    }

    const missions = (data && !fetchErr ? data.missions : null) || {};
    missions[missionKey] = {
      ...(missions[missionKey] || {}),
      last_started_at: new Date().toISOString(),
      last_access: 'index',
    };

    const { error } = await supabase.from('user_progress').upsert(
      { user_id: user.id, missions, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    if (error && !/42P01|does not exist|Could not find/i.test(error.message || '')) {
      console.warn('[dossier] progress save', error);
    }
  } catch (e) {
    console.warn('[dossier] recordMissionStart', e);
  }
}

function initSupabase() {
  if (!cfgOk()) {
    console.warn('[dossier] Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    return null;
  }
  return createClient(CFG.url, CFG.anonKey, {
    auth: {
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
}

async function beginTrainingFlow() {
  if (!cfgOk()) {
    toast('Configure .env: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    return;
  }
  if (!supabase) supabase = initSupabase();
  if (!supabase) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    showMissionBriefing();
    return;
  }

  sessionStorage.setItem('dossier_intent', 'mission_select');
  const redirectTo = window.location.href.split('#')[0];
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) {
    toast(explainAuthError(error), 10000);
    sessionStorage.removeItem('dossier_intent');
  }
}

function routeFromHash() {
  const h = (window.location.hash || '').slice(1);
  if (!supabase || !cfgOk()) return;
  if (h === 'briefing') {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) showMissionBriefing();
    });
    return;
  }
  const m = h.match(/^mission-(deepfake|interrogation|cyber)$/);
  if (m) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        openScreen(m[1]);
      }
    });
  }
}

document.querySelectorAll('.js-begin-training').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    beginTrainingFlow();
  });
});

document.getElementById('dossier-sign-out')?.addEventListener('click', async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
  closeAllScreens();
  history.replaceState(null, '', window.location.pathname + window.location.search);
  toast('Signed out.');
});

document.querySelectorAll('.mission-select-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.getAttribute('data-mission-external') === 'true') {
      recordMissionStart(btn.getAttribute('data-mission') || 'deepfake');
      return;
    }
    const route = btn.getAttribute('data-mission-route');
    if (!route) return;
    recordMissionStart(btn.getAttribute('data-mission') || route);
    openScreen(route);
  });
});

document.querySelectorAll('.js-back-to-select').forEach((btn) => {
  btn.addEventListener('click', () => showMissionBriefing());
});

window.addEventListener('hashchange', routeFromHash);
window.addEventListener(CAMPAIGN_PROGRESS_EVENT, renderCampaignProgressBar);
window.addEventListener('storage', (e) => {
  if (e.key === CAMPAIGN_STORAGE_KEY) renderCampaignProgressBar();
});

consumeHashOAuthError();

supabase = initSupabase();
if (supabase) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && sessionStorage.getItem('dossier_intent') === 'mission_select') {
      sessionStorage.removeItem('dossier_intent');
      showMissionBriefing();
    }
    if (session?.user) setOperativeEmail(session.user);
  });

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session && sessionStorage.getItem('dossier_intent') === 'mission_select') {
      sessionStorage.removeItem('dossier_intent');
      showMissionBriefing();
    }
    routeFromHash();
  });
}

renderCampaignProgressBar();
