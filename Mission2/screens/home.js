import { setState, getState } from "../lib/store.js";
import { generateSuspect, toPublicSuspect } from "../lib/suspectGenerator.js";
import { createSession } from "../api/supabase.js";
import { resetHintRotation } from "../lib/simpleHints.js";

function selectCard(root, level) {
  root.querySelectorAll("[data-level]").forEach((el) => {
    el.classList.toggle("difficulty-card--selected", Number(el.dataset.level) === level);
  });
}

export function renderHome(container) {
  const state = getState();
  const selected = state.clearanceLevel ?? null;

  container.innerHTML = `
    <main class="screen screen--home">
      <div class="home-section home-section--title fade-slide-up">
        <p class="mission-label">MISSION 02</p>
        <div class="rule-line" aria-hidden="true"></div>
        <h1 class="screen-title">THE INTERROGATION ROOM</h1>
        <div class="briefing-block inter-body">
          <p>You have one job: get the code.</p>
          <p>A suspect has been brought in for questioning. 
          They are connected to a critical breach of our systems. 
          Somewhere in their story is a lie — and that lie is your weapon.</p>
          <p>You will be given partial intel before you begin. 
          Use it. Ask anything. Push on everything.
          When you catch them in a contradiction and they break — they'll give you 
          the 4-digit code needed to abort the server wipe.</p>
          <p>You have 20 questions. Make them count.</p>
        </div>
        <div class="rule-line" aria-hidden="true"></div>
      </div>

      <div class="home-section home-section--difficulty fade-slide-up fade-slide-up--delay-1">
        <h2 class="section-heading syne">CLEARANCE</h2>
        <div class="difficulty-grid" role="radiogroup" aria-label="Difficulty">
          <button type="button" class="difficulty-card ${selected === 1 ? "difficulty-card--selected" : ""}" data-level="1">
            <span class="difficulty-card__level syne">LEVEL 1</span>
            <span class="difficulty-card__name">RECRUIT</span>
            <p class="difficulty-card__desc inter">The suspect cracks easily. One good push on a contradiction and they fold.</p>
          </button>
          <button type="button" class="difficulty-card ${selected === 2 ? "difficulty-card--selected" : ""}" data-level="2">
            <span class="difficulty-card__level syne">LEVEL 2</span>
            <span class="difficulty-card__name">OPERATIVE</span>
            <p class="difficulty-card__desc inter">The suspect will try to cover up once before breaking. Be persistent.</p>
          </button>
          <button type="button" class="difficulty-card ${selected === 3 ? "difficulty-card--selected" : ""}" data-level="3">
            <span class="difficulty-card__level syne">LEVEL 3</span>
            <span class="difficulty-card__name">HANDLER</span>
            <p class="difficulty-card__desc inter">The suspect is a professional. They will cover up twice before finally breaking.</p>
          </button>
        </div>
      </div>

      <div class="home-section home-section--start fade-slide-up fade-slide-up--delay-2">
        <button type="button" class="btn-primary btn-start ${selected ? "" : "btn-primary--disabled"}" ${selected ? "" : "disabled"}>
          BEGIN INTERROGATION
        </button>
      </div>
    </main>
  `;

  const grid = container.querySelector(".difficulty-grid");
  const startBtn = container.querySelector(".btn-start");

  grid.querySelectorAll("[data-level]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const level = Number(btn.dataset.level);
      selectCard(container, level);
      setState({ clearanceLevel: level });
      startBtn.disabled = false;
      startBtn.classList.remove("btn-primary--disabled");
    });
  });

  startBtn.addEventListener("click", async () => {
    const { clearanceLevel } = getState();
    if (!clearanceLevel) return;

    startBtn.disabled = true;
    startBtn.classList.add("scanning");

    try {
      resetHintRotation();
      const full = await generateSuspect(clearanceLevel);
      const sessionId = await createSession(
        full.hidden_truth,
        full.secret_code,
        full,
        clearanceLevel,
      );
      const publicSuspect = toPublicSuspect(full);
      setState({
        sessionId,
        suspect: publicSuspect,
        screen: "interrogation",
        conversationHistory: [],
        turnCount: 0,
        contradictionsCaught: 0,
        codeRevealed: false,
        extractedCode: null,
        result: null,
        missionStartTime: Date.now(),
      });
    } catch (err) {
      console.error(err);
      startBtn.disabled = false;
    } finally {
      startBtn.classList.remove("scanning");
    }
  });
}
