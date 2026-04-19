import { getState, registerRouteCommit } from './lib/store.js';
import { mountHome } from './screens/home.js';
import { mountGame } from './screens/game.js';
import { mountDebrief } from './screens/debrief.js';

const app = document.getElementById('app');
if (!app) throw new Error('#app missing');

let unmount = null;
let lastScreen = /** @type {string|null} */ (null);

function render() {
  if (unmount) {
    unmount();
    unmount = null;
  }
  const { screen } = getState();
  // Must set before mount*(): game/debrief call setState during mount (e.g. engine.start).
  // If lastScreen still pointed at the previous screen, the store subscriber would re-enter
  // render(), unmount the new screen, and kill the timer + packet engine.
  lastScreen = screen;
  if (screen === 'home') unmount = mountHome(app);
  else if (screen === 'game') unmount = mountGame(app);
  else if (screen === 'debrief') unmount = mountDebrief(app);
}

registerRouteCommit(() => {
  const screen = getState().screen;
  // Re-render whenever store screen differs from what we last mounted (handles resetState / edge cases).
  if (screen === lastScreen) return;
  render();
});
render();
