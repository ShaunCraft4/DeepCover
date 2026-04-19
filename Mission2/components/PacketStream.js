import { subscribe, getState } from '../lib/store.js';
import { createPacketCard } from './PacketCard.js';

/**
 * @param {HTMLElement} container
 * @param {object} api
 * @param {(p: import('../api/gemini.js').Packet) => void} api.onInspect
 * @param {number} api.packetLifetimeMs
 */
export function mountPacketStream(container, api) {
  const zone = document.createElement('div');
  zone.className = 'packet-stream';
  container.appendChild(zone);

  const cards = new Map();

  const syncPaused = () => {
    const ins = getState().inspecting;
    cards.forEach((el, id) => {
      if (ins && ins.id === id) el.classList.add('paused');
      else el.classList.remove('paused');
    });
  };

  const render = () => {
    const { activePackets } = getState();
    const ids = new Set(activePackets.map(x => x.packet.id));

    cards.forEach((el, id) => {
      if (!ids.has(id)) {
        el.classList.add('packet-card--exit');
        window.setTimeout(() => {
          el.remove();
          cards.delete(id);
        }, 400);
      }
    });

    activePackets.forEach(ap => {
      if (cards.has(ap.packet.id)) return;
      const card = createPacketCard({
        packet: ap.packet,
        leftPct: ap.leftPct,
        lifetimeMs: api.packetLifetimeMs,
        onInspect: api.onInspect,
      });
      cards.set(ap.packet.id, card);
      zone.appendChild(card);
    });
    syncPaused();
  };

  const unsub = subscribe(() => render());
  render();

  return {
    destroy: () => {
      unsub();
      zone.remove();
    },
  };
}
