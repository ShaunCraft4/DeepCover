/**
 * @typedef {import('../api/gemini.js').Packet} Packet
 * @typedef {{
 *   packet: Packet,
 *   playerChoice: 'allow'|'block'|null,
 *   wasCorrect: boolean,
 *   timestamp: number,
 *   kind: 'decision'|'miss',
 * }} Decision
 */

const state = {
  screen: 'home',
  clearanceLevel: null,
  packets: [],
  queue: [],
  activePackets: [],
  inspecting: null,
  score: 0,
  maxScore: 100,
  decisions: [],
  packetsProcessed: 0,
  correctDecisions: 0,
  wrongDecisions: 0,
  sessionStartTime: null,
  /** Total packets in this run (usually 40) — used for score = correct / total */
  totalPackets: 40,
  gameOver: false,
};

const listeners = new Set();

/** @type {(() => void) | null} */
let routeCommit = null;

/**
 * Registers a callback that runs after setState/resetState when the route (`screen`) may need to update.
 * Must call `render()` when `getState().screen` differs from the last rendered screen.
 */
export const registerRouteCommit = fn => {
  routeCommit = fn;
};

export const subscribe = fn => listeners.add(fn);
export const getState = () => ({ ...state });
export const setState = updates => {
  Object.assign(state, updates);
  listeners.forEach(fn => fn({ ...state }));
  if (routeCommit && updates && Object.prototype.hasOwnProperty.call(updates, 'screen')) {
    routeCommit();
  }
};
export const resetState = () => {
  Object.assign(state, {
    screen: 'home',
    clearanceLevel: null,
    packets: [],
    queue: [],
    activePackets: [],
    inspecting: null,
    score: 0,
    maxScore: 100,
    decisions: [],
    packetsProcessed: 0,
    correctDecisions: 0,
    wrongDecisions: 0,
    sessionStartTime: null,
    totalPackets: 40,
    gameOver: false,
  });
  // Navigate first so the game unmounts before component listeners run (avoids listener errors blocking routeCommit).
  routeCommit?.();
  try {
    listeners.forEach(fn => fn({ ...state }));
  } catch (e) {
    console.error(e);
  }
};
