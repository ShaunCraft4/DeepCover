/** Spawn interval (ms), max concurrent cards, packet lifetime (ms). L2/L3 are only slightly faster than L1 — harder mainly via more inspection checks, not brutal cadence. */
export const DIFFICULTY_CONFIG = {
  1: { spawnInterval: 4000, maxOnScreen: 3, packetLifetime: 12000 },
  2: { spawnInterval: 3600, maxOnScreen: 4, packetLifetime: 11000 },
  3: { spawnInterval: 3200, maxOnScreen: 4, packetLifetime: 10000 },
};

/** Session countdown (seconds) — 2:00; when 0, round ends. */
export const SESSION_DURATION_SEC = {
  1: 120,
  2: 120,
  3: 120,
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * @param {import('../api/gemini.js').Packet[]} packets
 * @param {1|2|3} clearanceLevel
 * @param {object} handlers
 * @param {() => { queue: import('../api/gemini.js').Packet[]; activePackets: { packet: import('../api/gemini.js').Packet; leftPct: number }[]; inspecting: import('../api/gemini.js').Packet | null; gameOver: boolean }} handlers.getState
 * @param {(u: Record<string, unknown>) => void} handlers.setState
 * @param {(reason: 'complete' | 'score') => void} handlers.onGameOver
 * @param {(packet: import('../api/gemini.js').Packet) => void} handlers.onMissed
 */
export function createPacketEngine(packets, clearanceLevel, handlers) {
  const cfg = DIFFICULTY_CONFIG[clearanceLevel];
  const queue = shuffle(packets);
  const expiryTimers = new Map();
  let spawnTimer = null;
  let stopped = false;

  const clearTimer = id => {
    const t = expiryTimers.get(id);
    if (t) clearTimeout(t);
    expiryTimers.delete(id);
  };

  const tryFinishGame = () => {
    const { queue: q, activePackets: act, gameOver } = handlers.getState();
    if (gameOver || stopped) return;
    if (q.length === 0 && act.length === 0) handlers.onGameOver('complete');
  };

  const scheduleExpiry = (packetId, packet) => {
    clearTimer(packetId);
    const run = () => {
      if (stopped) return;
      const st = handlers.getState();
      if (st.inspecting && st.inspecting.id === packetId) {
        const t = setTimeout(run, 120);
        expiryTimers.set(packetId, t);
        return;
      }
      const act = st.activePackets.filter(x => x.packet.id !== packetId);
      handlers.setState({ activePackets: act });
      clearTimer(packetId);
      handlers.onMissed(packet);
      tryFinishGame();
    };
    const t = setTimeout(run, cfg.packetLifetime);
    expiryTimers.set(packetId, t);
  };

  const spawnOne = () => {
    if (stopped) return;
    const st = handlers.getState();
    if (st.gameOver) return;
    if (st.inspecting) return;
    if (!st.queue.length) return;
    if (st.activePackets.length >= cfg.maxOnScreen) return;
    const [next, ...rest] = st.queue;
    const leftPct = 5 + Math.random() * 65;
    handlers.setState({
      queue: rest,
      activePackets: [...st.activePackets, { packet: next, leftPct }],
    });
    scheduleExpiry(next.id, next);
  };

  const tick = () => {
    if (stopped) return;
    spawnOne();
  };

  const start = () => {
    handlers.setState({ queue, activePackets: [] });
    spawnTimer = window.setInterval(tick, cfg.spawnInterval);
    tick();
  };

  const stop = () => {
    stopped = true;
    if (spawnTimer != null) clearInterval(spawnTimer);
    spawnTimer = null;
    expiryTimers.forEach(t => clearTimeout(t));
    expiryTimers.clear();
  };

  const removeActivePacket = packetId => {
    clearTimer(packetId);
    const st = handlers.getState();
    handlers.setState({
      activePackets: st.activePackets.filter(x => x.packet.id !== packetId),
    });
    tryFinishGame();
  };

  return { start, stop, removeActivePacket, getConfig: () => cfg };
}
