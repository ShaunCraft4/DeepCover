import { getState, resetState } from "../lib/store.js";
import { getSession, deleteSession } from "../api/supabase.js";

function computeXp({ clearanceLevel, turnCount, codeRevealed }) {
  const clearanceMultiplier = [1.0, 1.7, 3.0][clearanceLevel - 1] ?? 1;
  const speedBonus = Math.max(1.0, 1.5 - turnCount / 20);
  const baseScore = codeRevealed ? Math.max(40, 100 - turnCount * 3) : 20;
  return Math.round(baseScore * clearanceMultiplier * speedBonus);
}

function ratingLine(turnCount) {
  if (turnCount <= 8) return "ELITE — Field Ready";
  if (turnCount <= 14) return "PROFICIENT — Cleared for Deployment";
  return "DEVELOPING — Mission Complete";
}

function formatElapsed(ms) {
  if (ms == null || Number.isNaN(ms)) return "—";
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function renderDebrief(container) {
  const initial = getState();
  container.innerHTML = `<main class="screen screen--debrief"><p class="mono debrief-loading">DECRYPTING DEBRIEF…</p></main>`;

  void (async () => {
    let row = null;
    try {
      row = await getSession(initial.sessionId);
    } catch (e) {
      console.error(e);
    }

    const full = row?.full_suspect ?? {};
    const fatalFlaw = full.fatal_flaw ?? "—";
    const hiddenTruth = row?.hidden_truth ?? full.hidden_truth ?? "—";
    const alibiLocation = full.alibi_location ?? "—";
    const secretFromDb = row?.secret_code ?? full.secret_code ?? "";
    const name = initial.suspect?.name ?? full.name ?? "Subject";

    const clearanceLevel = initial.clearanceLevel ?? 1;
    const turnCount = initial.turnCount ?? 0;
    const contradictionsCaught = initial.contradictionsCaught ?? 0;
    const codeRevealed = initial.codeRevealed ?? false;
    const extractedCode = initial.extractedCode ?? "";
    const result = initial.result ?? "loss";
    const elapsed = formatElapsed(Date.now() - (initial.missionStartTime ?? Date.now()));

    const xp = computeXp({ clearanceLevel, turnCount, codeRevealed });

    const isWin = result === "win" && codeRevealed;

    container.innerHTML = `
      <main class="screen screen--debrief">
        <div class="debrief-inner">
          <h1 class="debrief-title syne fade-slide-up">${isWin ? "MISSION COMPLETE" : "MISSION FAILED"}</h1>
          <div class="rule-line debrief-rule fade-slide-up" style="animation-delay:0.1s" aria-hidden="true"></div>

          <div class="debrief-blocks">
            ${
              isWin
                ? `
              <section class="debrief-section fade-slide-up" style="animation-delay:0.2s">
                <p class="mono debrief-label">CODE EXTRACTED</p>
                <div class="code-box tension-pulse mono" data-code-display>
                  ${String(extractedCode || secretFromDb)
                    .slice(0, 4)
                    .split("")
                    .map((d) => `<span class="code-digit">${escapeHtml(d)}</span>`)
                    .join("")}
                </div>
              </section>
              <section class="debrief-section fade-slide-up" style="animation-delay:0.35s">
                <p class="mono debrief-label">THE LIE THAT BROKE THEM:</p>
                <p class="mono debrief-emerald" data-typewriter-flaw></p>
              </section>
              <section class="debrief-section fade-slide-up debrief-truth-block" style="animation-delay:0.5s">
                <p class="mono debrief-label">THE TRUTH:</p>
                <p class="inter-body debrief-truth" data-truth hidden>${escapeHtml(hiddenTruth)}</p>
              </section>
              <section class="debrief-section fade-slide-up" style="animation-delay:0.65s">
                <p class="mono debrief-label">PERFORMANCE</p>
                <ul class="mono debrief-stats">
                  <li>Questions used: ${turnCount} / 20</li>
                  <li>Contradictions: ${contradictionsCaught} caught</li>
                  <li>Time: ${elapsed}</li>
                </ul>
                <p class="mono debrief-rating">Rating: ${ratingLine(turnCount)}</p>
              </section>
            `
                : `
              <section class="debrief-section fade-slide-up" style="animation-delay:0.2s">
                <p class="mono debrief-label">CODE NOT EXTRACTED</p>
                <p class="inter-body">${escapeHtml(name)} did not break.</p>
              </section>
              <section class="debrief-section fade-slide-up" style="animation-delay:0.35s">
                <p class="mono debrief-label">THE LIE YOU MISSED:</p>
                <p class="mono debrief-danger">${escapeHtml(fatalFlaw)}</p>
              </section>
              <section class="debrief-section fade-slide-up" style="animation-delay:0.5s">
                <p class="mono debrief-label">WHAT YOU NEEDED TO SAY:</p>
                <p class="inter-body">Something referencing: ${escapeHtml(alibiLocation)} — ${escapeHtml(fatalFlaw)}</p>
              </section>
              <section class="debrief-section fade-slide-up" style="animation-delay:0.65s">
                <p class="mono debrief-label">THE TRUTH (classified):</p>
                <p class="inter-body">${escapeHtml(hiddenTruth)}</p>
              </section>
              <section class="debrief-section fade-slide-up" style="animation-delay:0.8s">
                <p class="mono">Questions wasted: ${turnCount} / 20</p>
              </section>
            `
            }

            <section class="debrief-section fade-slide-up" style="animation-delay:0.9s">
              <p class="mono xp-line">XP AWARDED: <span data-xp-target="${xp}">0</span></p>
            </section>
          </div>

          <button type="button" class="btn-primary debrief-again fade-slide-up" style="animation-delay:1.05s" data-again>
            INTERROGATE AGAIN
          </button>
        </div>
      </main>
    `;

    const flawEl = container.querySelector("[data-typewriter-flaw]");
    if (flawEl && isWin) {
      void typewriter(flawEl, fatalFlaw, () => {
        const truth = container.querySelector("[data-truth]");
        if (truth) {
          setTimeout(() => truth.removeAttribute("hidden"), 1500);
        }
      });
    }

    const xpEl = container.querySelector("[data-xp-target]");
    if (xpEl) {
      const target = Number(xpEl.dataset.xpTarget) || 0;
      animateCount(xpEl, target);
    }

    const again = container.querySelector("[data-again]");
    again.addEventListener("click", async () => {
      const sid = getState().sessionId;
      try {
        if (sid) await deleteSession(sid);
      } catch {
        /* ignore */
      }
      resetState();
    });
  })();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function typewriter(el, text, onDone) {
  const full = String(text);
  for (let i = 0; i <= full.length; i += 1) {
    el.textContent = full.slice(0, i);
    await new Promise((r) => setTimeout(r, 12));
  }
  if (onDone) onDone();
}

function animateCount(el, target) {
  const start = performance.now();
  const dur = 900;
  const step = (now) => {
    const p = Math.min(1, (now - start) / dur);
    el.textContent = String(Math.round(target * p));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
