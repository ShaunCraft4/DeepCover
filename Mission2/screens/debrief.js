import { getState, resetState } from '../lib/store.js';
import { markMission2FirewallComplete } from '../lib/campaignBridge.js';

/**
 * @param {'http_unencrypted' | 'typosquatting' | 'phishing'} t
 */
function totalInDataset(packets, t) {
  return packets.filter(p => p.threatType === t && p.isMalicious).length;
}

/**
 * @param {'http_unencrypted' | 'typosquatting' | 'phishing'} t
 */
function caughtCount(decisions, t) {
  return decisions.filter(d => {
    if (d.kind !== 'decision') return false;
    if (d.playerChoice !== 'block') return false;
    return d.wasCorrect && d.packet.threatType === t;
  }).length;
}

/**
 * @param {HTMLElement} root
 */
export function mountDebrief(root) {
  const state = getState();
  markMission2FirewallComplete(state.score);
  const packets = state.packets;
  const decisions = state.decisions;
  const score = Math.max(0, Math.min(100, Math.round(state.score)));
  const clearanceLevel = /** @type {1|2|3} */ (state.clearanceLevel ?? 1);
  const totalPkt = state.totalPackets || packets.length || 40;

  const correctBlocks = decisions.filter(
    d => d.kind === 'decision' && d.playerChoice === 'block' && d.wasCorrect
  ).length;
  const wrongAllows = decisions.filter(
    d => d.kind === 'decision' && d.playerChoice === 'allow' && !d.wasCorrect
  ).length;
  const wrongBlocks = decisions.filter(
    d => d.kind === 'decision' && d.playerChoice === 'block' && !d.wasCorrect
  ).length;

  const missedMalicious = decisions.filter(d => d.kind === 'miss' && d.packet.isMalicious);

  const httpTotal = totalInDataset(packets, 'http_unencrypted');
  const typoTotal = totalInDataset(packets, 'typosquatting');
  const phishTotal = totalInDataset(packets, 'phishing');

  const httpCaught = caughtCount(decisions, 'http_unencrypted');
  const typoCaught = caughtCount(decisions, 'typosquatting');
  const phishCaught = caughtCount(decisions, 'phishing');

  let headerText = 'NETWORK COMPROMISED';
  let headerClass = 'debrief-head--red';
  if (score >= 85) {
    headerText = 'PERIMETER SECURED';
    headerClass = 'debrief-head--emerald';
  } else if (score >= 60) {
    headerText = 'BREACH CONTAINED';
    headerClass = 'debrief-head--white';
  } else if (score >= 40) {
    headerText = 'SIGNIFICANT EXPOSURE';
    headerClass = 'debrief-head--amber';
  }

  const clearanceMultiplier = [1.0, 1.7, 3.0][clearanceLevel - 1];
  const xp = Math.round(score * clearanceMultiplier);

  root.innerHTML = `
    <div class="debrief-screen">
      <h2 class="debrief-head ${headerClass} debrief-reveal" style="animation-delay:0ms">${headerText}</h2>

      <div class="debrief-block debrief-reveal" style="animation-delay:1100ms">
        <h3 class="debrief-sub">SESSION COMPLETE</h3>
        <p class="debrief-score-hero" aria-live="polite">${score}%</p>
        <p class="debrief-score-caption">Final security rating</p>
        <div class="home-rule"></div>
        <h3 class="debrief-sub debrief-sub--inline">MISSION DEBRIEF</h3>
        <dl class="debrief-stats">
          <dt>PACKETS PROCESSED:</dt><dd>${state.packetsProcessed} / ${totalPkt}</dd>
          <dt>CORRECT DECISIONS:</dt><dd>${state.correctDecisions}</dd>
          <dt>WRONG DECISIONS:</dt><dd>${state.wrongDecisions}</dd>
          <dt>THREATS NEUTRALIZED:</dt><dd>${correctBlocks}</dd>
          <dt class="debrief-stat-warn">BREACHES ALLOWED:</dt><dd class="${wrongAllows > 0 ? 'text-breach' : ''}">${wrongAllows}</dd>
          <dt class="debrief-stat-warn2">FALSE POSITIVES:</dt><dd class="${wrongBlocks > 0 ? 'text-fp' : ''}">${wrongBlocks}</dd>
        </dl>
        <div class="home-rule"></div>
      </div>

      <div class="debrief-block debrief-reveal" style="animation-delay:2200ms">
        <h4 class="debrief-mini-title">THREAT TYPE BREAKDOWN</h4>
        <div class="debrief-breakdown">
          ${breakdownRow('HTTP UNENCRYPTED', httpCaught, httpTotal, 'http')}
          ${breakdownRow('TYPOSQUATTING', typoCaught, typoTotal, 'typo')}
          ${breakdownRow('PHISHING', phishCaught, phishTotal, 'phish')}
        </div>
      </div>

      ${
        missedMalicious.length
          ? `<div class="debrief-block debrief-reveal" style="animation-delay:3300ms">
        <h4 class="debrief-mini-title">UNDETECTED THREATS</h4>
        <div class="debrief-missed">
          ${missedMalicious
            .map(
              d => `
            <div class="debrief-missed-row">
              <span>${d.packet.id}</span>
              <span>${d.packet.protocol}://${d.packet.domain}</span>
              <span>[${String(d.packet.threatType).toUpperCase()}]</span>
              <p class="debrief-missed-exp">${escapeHtml(d.packet.explanation)}</p>
            </div>`
            )
            .join('')}
        </div>
      </div>`
          : ''
      }

      <div class="debrief-xp debrief-reveal" style="animation-delay:${missedMalicious.length ? 4400 : 3300}ms">
        <span class="debrief-xp-label">XP AWARDED:</span>
        <span class="debrief-xp-val" data-target="${xp}">0</span>
      </div>

      <div class="debrief-actions debrief-reveal" style="animation-delay:${missedMalicious.length ? 5500 : 4400}ms">
        <button type="button" class="btn-debrief-primary" id="debrief-home">MISSION HOME</button>
        <a class="btn-debrief-ghost" href="/Mission3/index.html">MISSION 03 — CYBER DEFENSE</a>
        <button type="button" class="btn-debrief-ghost" id="debrief-review-toggle">REVIEW PACKETS</button>
      </div>

      <div class="debrief-review debrief-reveal" id="debrief-review" hidden style="animation-delay:${missedMalicious.length ? 5500 : 4400}ms">
        <table class="debrief-table">
          <thead>
            <tr>
              <th>ID</th><th>Protocol</th><th>Domain</th><th>Correct action</th><th>Threat</th>
            </tr>
          </thead>
          <tbody>
            ${packets
              .map(
                p => `
              <tr>
                <td>${p.id}</td>
                <td>${p.protocol}</td>
                <td>${escapeHtml(p.domain)}</td>
                <td>${p.isMalicious ? 'QUARANTINE' : 'ALLOW'}</td>
                <td>${p.threatType}</td>
              </tr>
              <tr class="debrief-table-exp-row">
                <td colspan="5">${escapeHtml(p.explanation)}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const xpEl = root.querySelector('.debrief-xp-val');
  const target = xpEl ? Number(xpEl.getAttribute('data-target') ?? 0) : 0;
  let cur = 0;
  const dur = 900;
  const t0 = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - t0) / dur);
    cur = Math.round(target * p);
    if (xpEl) xpEl.textContent = String(cur);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  root.querySelector('#debrief-home')?.addEventListener('click', () => {
    resetState();
  });

  const reviewPanel = root.querySelector('#debrief-review');
  root.querySelector('#debrief-review-toggle')?.addEventListener('click', () => {
    reviewPanel?.toggleAttribute('hidden');
  });

  return () => {
    root.innerHTML = '';
  };
}

/**
 * @param {string} label
 * @param {number} x
 * @param {number} y
 * @param {'http'|'typo'|'phish'} tip
 */
function breakdownRow(label, x, y, tip) {
  const tips = {
    http: 'Remember: HTTP means data travels in plain text. Always look for the S.',
    typo: "Enemies substitute letters for numbers. 'l' becomes '1', 'o' becomes '0'.",
    phish: 'The domain can look perfect. Always check where the packet is actually going.',
  };
  const showTip = x < y;
  return `
    <div class="debrief-row">
      <span class="debrief-row-label">${label}</span>
      <span class="debrief-row-count">caught ${x} / ${y}</span>
      ${showTip ? `<p class="debrief-row-tip">${tips[tip]}</p>` : ''}
    </div>
  `;
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
