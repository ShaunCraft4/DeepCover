import { getState } from '../lib/store.js';

/**
 * @param {object} opts
 * @param {import('../api/gemini.js').Packet} opts.packet
 * @param {number} opts.leftPct
 * @param {number} opts.lifetimeMs
 * @param {(p: import('../api/gemini.js').Packet) => void} opts.onInspect
 */
export function createPacketCard(opts) {
  const el = document.createElement('div');
  el.className = 'packet-card';
  const ms = Number.isFinite(opts.lifetimeMs) ? opts.lifetimeMs : 10000;
  el.style.setProperty('--packet-lifetime', `${ms}ms`);
  el.style.setProperty('--packet-left-pct', `${opts.leftPct}%`);

  const inspecting = getState().inspecting;
  if (inspecting && inspecting.id === opts.packet.id) {
    el.classList.add('paused');
  }

  el.innerHTML = `
    <div class="packet-card-inner">
      <div class="packet-card-head">
        <span>◈ INCOMING PACKET</span>
        <span class="packet-card-id">${opts.packet.id}</span>
      </div>
      <div class="packet-card-rule"></div>
      <div class="packet-card-field"><span class="packet-card-k">PROTOCOL:</span> <span class="packet-card-v">${opts.packet.protocol}://</span></div>
      <div class="packet-card-field"><span class="packet-card-k">DOMAIN:</span> <span class="packet-card-v">${escapeHtml(opts.packet.domain)}</span></div>
      <div class="packet-card-field packet-card-payload"><span class="packet-card-k">PAYLOAD:</span> <span class="packet-card-v">${escapeHtml(truncate(opts.packet.payload, 80))}</span></div>
      <div class="packet-card-rule"></div>
      <div class="packet-card-cta">CLICK TO INSPECT</div>
    </div>
  `;

  el.addEventListener('click', e => {
    e.stopPropagation();
    opts.onInspect(opts.packet);
  });

  return el;
}

function truncate(s, n) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
