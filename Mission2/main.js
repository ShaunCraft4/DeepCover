import { subscribe, getState } from "./lib/store.js";
import { renderHome } from "./screens/home.js";
import { renderInterrogation } from "./screens/interrogation.js";
import { renderDebrief } from "./screens/debrief.js";

const app = document.getElementById("app");

let lastScreen = null;
let screenCleanup = null;

function mountScreen(state) {
  if (screenCleanup) {
    screenCleanup();
    screenCleanup = null;
  }
  app.innerHTML = "";
  if (state.screen === "home") {
    renderHome(app);
    return;
  }
  if (state.screen === "interrogation") {
    screenCleanup = renderInterrogation(app);
    return;
  }
  renderDebrief(app);
}

subscribe((state) => {
  if (state.screen !== lastScreen) {
    lastScreen = state.screen;
    mountScreen(state);
  }
});

mountScreen(getState());
