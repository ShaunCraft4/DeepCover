const state = {
  screen: "home",
  clearanceLevel: null,
  sessionId: null,
  suspect: null,
  conversationHistory: [],
  turnCount: 0,
  maxTurns: 20,
  contradictionsCaught: 0,
  codeRevealed: false,
  extractedCode: null,
  missionStartTime: null,
  result: null,
};

const listeners = new Set();

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getState = () => ({ ...state });

export const setState = (updates) => {
  Object.assign(state, updates);
  listeners.forEach((fn) => fn({ ...state }));
};

export const resetState = () => {
  Object.assign(state, {
    screen: "home",
    clearanceLevel: null,
    sessionId: null,
    suspect: null,
    conversationHistory: [],
    turnCount: 0,
    contradictionsCaught: 0,
    codeRevealed: false,
    extractedCode: null,
    missionStartTime: null,
    result: null,
  });
  listeners.forEach((fn) => fn({ ...state }));
};
