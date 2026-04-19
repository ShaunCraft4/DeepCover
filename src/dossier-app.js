import { createClient } from '@supabase/supabase-js';
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

function showMissionBriefing() {
  openScreen('select');
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
