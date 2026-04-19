import { subscribe } from '../lib/store.js';

function formatTime(ts) {
  const d = new Date(ts);
  return d.toTimeString().slice(0, 8);
}

function threatLabel(threatType) {
  if (threatType === 'safe') return 'SAFE';
  if (threatType === 'http_unencrypted') return 'HTTP';
  if (threatType === 'typosquatting') return 'TYPOSQUATTING';
  if (threatType === 'phishing') return 'PHISHING';
  return String(threatType).toUpperCase();
}

/**
 * @param {import('../lib/store.js').Decision} d
 */
function entryClass(d) {
  if (d.kind === 'miss') {
    return d.packet.isMalicious ? 'threat-log-line--miss-bad' : 'threat-log-line--miss-safe';
  }
  const blocked = d.playerChoice === 'block';
  if (d.wasCorrect && blocked) return 'threat-log-line--ok';
  if (d.wasCorrect && !blocked) return 'threat-log-line--ok';
  if (!d.wasCorrect && blocked) return 'threat-log-line--fp';
  return 'threat-log-line--breach';
}

/**
 * @param {import('../lib/store.js').Decision} d
 */
function lineLabel(d) {
  if (d.kind === 'miss') return 'MISSED';
  if (d.playerChoice === 'block') return 'BLOCKED';
  return 'ALLOWED';
}

/**
 * @param {import('../lib/store.js').Decision} d
 */
function iconFor(d) {
  if (d.kind === 'miss') return '!';
  if (d.playerChoice === 'block') return '⊘';
  return '✓';
}

/**
 * @param {HTMLElement} container
 */
export function mountThreatLog(container) {
  const wrap = document.createElement('div');
  wrap.className = 'threat-log';
  wrap.innerHTML = `
    <div class="threat-log-header">THREAT LOG</div>
    <div class="threat-log-scroll"></div>
  `;
  container.appendChild(wrap);
  const scroll = wrap.querySelector('.threat-log-scroll');

  let lastLen = 0;

  const unsub = subscribe(state => {
    if (state.decisions.length === lastLen) return;
    const last = state.decisions[state.decisions.length - 1];
    lastLen = state.decisions.length;
    if (!last) return;

    const row = document.createElement('div');
    row.className = `threat-log-line fade-slide-up ${entryClass(last)}`;
    row.innerHTML = `
      <span class="threat-log-time">${formatTime(last.timestamp)}</span>
      <span class="threat-log-action">${lineLabel(last)}</span>
      <span class="threat-log-icon">${iconFor(last)}</span>
      <span class="threat-log-domain">${last.packet.domain}</span>
      <span class="threat-log-type">[${threatLabel(last.packet.threatType)}]</span>
    `;
    scroll.insertBefore(row, scroll.firstChild);
  });

  return {
    destroy: () => {
      unsub();
      wrap.remove();
    },
  };
}
