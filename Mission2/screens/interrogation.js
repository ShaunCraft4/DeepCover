import { getState, setState, subscribe } from "../lib/store.js";
import { getSession } from "../api/supabase.js";
import { callGemini, generateInterrogationReply, repairSuspectReply } from "../api/gemini.js";
import { speakText, unlockAudioPlayback } from "../api/elevenlabs.js";
import { buildSpySystemPrompt } from "../lib/spyPrompt.js";
import { getIntelDisplay } from "../lib/intelReveal.js";
import { getMissionPrimer, getNextStaticHint, resetHintRotation } from "../lib/simpleHints.js";

function stripCodeFromDisplay(text) {
  return text.replace(/\[CODE:\s*\d{4}\]/gi, "").trim();
}

function checkConfessionTrigger(playerMessage, fullSuspect) {
  const kws = fullSuspect?.confession_keywords;
  if (!Array.isArray(kws) || kws.length === 0) return false;
  const msg = playerMessage.toLowerCase();
  return kws.some((kw) => msg.includes(String(kw).toLowerCase()));
}

async function detectContradiction(conversationHistory, latestResponse) {
  if (conversationHistory.length < 4) return null;

  const check = await callGemini({
    systemInstruction: `You detect contradictions in interrogation transcripts. 
                         Return ONLY valid JSON. Nothing else.`,
    userMessage: `
      Here is a conversation transcript:
      ${conversationHistory.map((t) => `${t.role.toUpperCase()}: ${t.content}`).join("\n")}
      
      The suspect just said: "${latestResponse}"
      
      Does this response contradict any specific factual claim the suspect made earlier?
      Only flag if you are highly confident (>= 0.75).
      
      Return: { 
        "contradiction": boolean, 
        "earlier_claim": "what they said before, verbatim or close", 
        "new_claim": "what they just said that conflicts",
        "confidence": 0.0 to 1.0
      }
    `,
    temperature: 0.1,
    maxTokens: 200,
  });

  try {
    const result = JSON.parse(check);
    if (result.contradiction && result.confidence >= 0.75) return result;
    return null;
  } catch {
    return null;
  }
}

function portraitClass(state) {
  if (state.codeRevealed || state.contradictionsCaught >= 3) return "portrait--broken";
  if (state.contradictionsCaught >= 2) return "portrait--rattled";
  if (state.contradictionsCaught >= 1) return "portrait--nervous";
  return "portrait--neutral";
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function portraitSvg() {
  return `
      <svg viewBox="0 0 200 220" class="portrait-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="40" y="30" width="120" height="140" rx="12" class="portrait-svg__face" />
        <rect x="70" y="150" width="60" height="40" rx="8" class="portrait-svg__neck" />
        <circle cx="85" cy="85" r="8" class="portrait-svg__eye portrait-svg__eye--l" />
        <circle cx="115" cy="85" r="8" class="portrait-svg__eye portrait-svg__eye--r" />
        <path d="M88 115 Q100 125 112 115" class="portrait-svg__mouth" fill="none" stroke-width="3" stroke-linecap="round" />
        <path d="M55 60 L145 60" class="portrait-svg__brow portrait-svg__brow--l" fill="none" stroke-width="4" stroke-linecap="round" />
        <path d="M55 58 L145 58" class="portrait-svg__brow portrait-svg__brow--r" fill="none" stroke-width="4" stroke-linecap="round" />
        <circle cx="100" cy="105" r="3" class="portrait-svg__sweat" />
      </svg>
    `;
}

function buildIntelPanelHtml(suspect) {
  const d = getIntelDisplay(suspect);
  const facts = (d.facts || [])
    .map(
      (f, i) =>
        `<li class="intel-fact fade-slide-up" style="animation-delay:${0.4 + i * 0.15}s">${escapeHtml(f)}</li>`,
    )
    .join("");
  const factsSection =
    (d.facts || []).length > 0
      ? `<p class="mono intel-heading">KNOWN FACTS:</p><ul class="intel-facts">${facts}</ul>`
      : `<p class="mono intel-heading">KNOWN FACTS:</p><p class="intel-empty inter-body">No facts listed.</p>`;

  return `
            <h2 class="panel__title mono">YOUR INTEL</h2>
            <div class="rule-line rule-line--short" aria-hidden="true"></div>
            <dl class="intel-dossier mono">
              <dt>SUBJECT:</dt><dd>${escapeHtml(d.subjectName)}</dd>
              <dt>AGE:</dt><dd>${escapeHtml(d.age)}</dd>
              <dt>OCCUPATION:</dt><dd>${escapeHtml(d.occupation)}</dd>
              <dt>APPEARANCE:</dt><dd>${escapeHtml(d.appearance)}</dd>
            </dl>
            ${factsSection}
            <div class="intel-objective mono">
              <p><strong>OBJECTIVE:</strong> Extract the 4-digit server abort code before the wipe executes.</p>
              <p><strong>WARNING:</strong> Subject is aware of their rights. Do not reveal what you know too early.</p>
            </div>
            <div class="rule-line rule-line--short" aria-hidden="true"></div>
            <p class="redacted-line mono"><span class="redacted-line__inner">[REDACTED: ██████████]</span></p>
  `;
}

function buildMissionHowToHtml() {
  return `
    <div class="mission-howto mono">
      <p class="mission-howto__title">HOW TO WIN (SIMPLE)</p>
      <ol class="mission-howto__list inter-body">
        <li>Type anything — “Good morning” is fine. The subject should answer like a person.</li>
        <li>Ask where they were and when. Then look for something in their story that cannot be true.</li>
        <li>When they break, they will say a line with <span class="mission-howto__code">[CODE:1234]</span> — that four-digit number ends the mission.</li>
      </ol>
    </div>
  `;
}

function buildLayout(suspect) {
  const intelInner = buildIntelPanelHtml(suspect);
  return `
      <div class="interrogation-layout">
        <header class="interrogation-header">
          <div class="interrogation-header__title syne">MISSION 02 — THE INTERROGATION ROOM</div>
          <div class="interrogation-header__meta mono">QUESTIONS LEFT: <span data-header-count>20/20</span></div>
        </header>
        <div class="interrogation-grid">
          <aside class="panel panel--intel" data-intel-aside>
            ${intelInner}
          </aside>

          <section class="panel panel--feed">
            ${buildMissionHowToHtml()}
            <div class="feed-head">
              <h2 class="panel__title mono panel__title--feed">INTERROGATION FEED</h2>
              <button type="button" class="btn-hint mono" data-hint-btn>NEXT STEP</button>
            </div>
            <div class="hint-drawer mono" data-hint-drawer>
              <p class="hint-drawer__label">WHAT TO DO</p>
              <p class="hint-drawer__text" data-hint-text></p>
            </div>
            <div class="feed-thread" data-feed-thread></div>
            <form class="feed-form" data-chat-form novalidate>
              <div class="feed-input-row">
                <label class="sr-only" for="operative-input">Message to subject</label>
                <input id="operative-input" class="feed-input mono" name="msg" type="text" autocomplete="off" placeholder="Say anything — e.g. Good morning…" />
                <button type="submit" class="btn-send mono" data-send-btn>SEND</button>
                <span class="questions-display mono" data-questions-left>QUESTIONS REMAINING: 20</span>
              </div>
            </form>
          </section>

          <aside class="panel panel--status">
            <h2 class="panel__title mono">SUBJECT STATUS</h2>
            <div class="portrait-wrap">
              <div class="radar-sweep" aria-hidden="true"></div>
              <div class="portrait portrait--neutral" data-portrait>
                ${portraitSvg()}
              </div>
            </div>
            <div class="contradiction-block mono">
              <p class="contradiction-label">CONTRADICTIONS CAUGHT</p>
              <div class="contradiction-slots">
                <span data-contradiction-slot class="contradiction-slot"></span>
                <span data-contradiction-slot class="contradiction-slot"></span>
                <span data-contradiction-slot class="contradiction-slot"></span>
              </div>
              <p class="contradiction-readout">[ <span data-contradiction-count>0</span> ] / [ 3 ]</p>
            </div>
            <div class="questions-meter mono">
              <span class="questions-meter__label">QUESTIONS REMAINING</span>
              <div class="questions-meter__track">
                <div class="questions-meter__fill" data-questions-meter></div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    `;
}

export function renderInterrogation(container) {
  let unsub = null;
  let disposed = false;
  let fullSuspect = null;
  let systemPrompt = "";
  let layoutEl = null;

  const cleanup = () => {
    disposed = true;
    if (unsub) unsub();
  };

  function syncHeader(state) {
    if (!layoutEl) return;
    const left = Math.max(0, state.maxTurns - state.turnCount);
    const meter = layoutEl.querySelector("[data-questions-meter]");
    const label = layoutEl.querySelector("[data-questions-left]");
    const countSlot = layoutEl.querySelector("[data-header-count]");
    if (countSlot) countSlot.textContent = `${left}/${state.maxTurns}`;
    if (label) {
      label.textContent = `QUESTIONS REMAINING: ${left}`;
      label.classList.remove("questions-display--warn", "questions-display--critical");
      if (left < 4) label.classList.add("questions-display--critical");
      else if (left < 7) label.classList.add("questions-display--warn");
    }
    if (meter) {
      const pct = Math.min(100, Math.max(0, (left / state.maxTurns) * 100));
      meter.style.height = `${pct}%`;
      meter.classList.remove("questions-meter__fill--amber", "questions-meter__fill--red");
      if (left < 4) meter.classList.add("questions-meter__fill--red");
      else if (left < 7) meter.classList.add("questions-meter__fill--amber");
    }
  }

  function syncContradictions(state) {
    if (!layoutEl) return;
    const portrait = layoutEl.querySelector("[data-portrait]");
    if (portrait) {
      portrait.classList.remove("portrait--neutral", "portrait--nervous", "portrait--rattled", "portrait--broken");
      portrait.classList.add(portraitClass(state));
    }
    const slots = layoutEl.querySelectorAll("[data-contradiction-slot]");
    slots.forEach((slot, i) => {
      slot.classList.toggle("contradiction-slot--filled", i < state.contradictionsCaught);
    });
    const countReadout = layoutEl.querySelector("[data-contradiction-count]");
    if (countReadout) countReadout.textContent = String(state.contradictionsCaught);
  }

  function updateFromState(state) {
    syncHeader(state);
    syncContradictions(state);
  }

  function showNotification() {
    if (!layoutEl) return;
    const bar = document.createElement("div");
    bar.className = "contradiction-toast";
    bar.textContent = "⚡ CONTRADICTION DETECTED — Push on this";
    layoutEl.insertAdjacentElement("afterbegin", bar);
    setTimeout(() => bar.remove(), 4000);
  }

  async function handleSend(input, sendBtn, thread) {
    unlockAudioPlayback();
    const state = getState();
    const userMessage = input.value;
    input.value = "";

    let messageForModel = userMessage;
    if (fullSuspect && checkConfessionTrigger(userMessage, fullSuspect)) {
      messageForModel += `\n\n[SYSTEM NOTE — DO NOT READ ALOUD: The interrogator has referenced ${fullSuspect.fatal_flaw}. Execute confession behavior according to your difficulty rules.]`;
    }

    const prior = [...state.conversationHistory];
    setState({
      conversationHistory: [...prior, { role: "user", content: userMessage }],
    });

    const userBubble = document.createElement("div");
    userBubble.className = "msg msg--player fade-slide-up";
    userBubble.innerHTML = `
      <div class="msg__label msg__label--player">INTERROGATOR</div>
      <div class="msg__body mono" data-user-body></div>
    `;
    userBubble.querySelector("[data-user-body]").textContent = userMessage;
    thread.appendChild(userBubble);
    thread.scrollTop = thread.scrollHeight;

    input.disabled = true;
    sendBtn.disabled = true;
    sendBtn.classList.add("scanning");

    const typing = document.createElement("div");
    typing.className = "typing-indicator fade-slide-up";
    typing.innerHTML = "<span></span><span></span><span></span>";
    thread.appendChild(typing);
    thread.scrollTop = thread.scrollHeight;

    const bubble = document.createElement("div");
    bubble.className = "msg msg--subject fade-slide-up";
    bubble.innerHTML = `
      <div class="msg__label msg__label--subject">SUBJECT</div>
      <div class="msg__body mono" data-stream-body></div>
      <div class="waveform" data-waveform hidden>
        ${Array.from({ length: 5 })
          .map((_, i) => `<span class="waveform__bar waveform__bar--${i}" aria-hidden="true"></span>`)
          .join("")}
      </div>
    `;
    const streamBody = bubble.querySelector("[data-stream-body]");
    const waveformEl = bubble.querySelector("[data-waveform]");

    const modelHistory = prior.map((t) => ({
      role: t.role === "model" ? "model" : "user",
      content: t.content,
    }));

    try {
      console.log("[Interrogation] → Gemini. Your line:", userMessage);

      const raw = await generateInterrogationReply({
        systemInstruction: systemPrompt,
        conversationHistory: modelHistory,
        newMessage: messageForModel,
      });

      if (typing.isConnected) typing.remove();
      if (!bubble.parentNode) thread.appendChild(bubble);

      let displaySafe = stripCodeFromDisplay(raw || "");
      if (!(displaySafe || "").trim()) {
        const repaired = await repairSuspectReply({
          systemInstruction: systemPrompt,
          conversationHistory: modelHistory,
          newMessage: messageForModel,
        });
        const r = (repaired || "").trim();
        displaySafe = stripCodeFromDisplay(r) || r;
      }
      if (!(displaySafe || "").trim()) {
        displaySafe =
          "The API returned no text. Open DevTools (F12) → Console and look for [Gemini] logs. Check VITE_GEMINI_API_KEY (no space after =) and VITE_GEMINI_MODEL.";
      }

      streamBody.textContent = displaySafe;
      thread.scrollTop = thread.scrollHeight;
      console.log("[Interrogation] ← Shown in UI:", displaySafe);

      if (waveformEl) waveformEl.hidden = false;
      await speakText(displaySafe);
      if (waveformEl) waveformEl.hidden = true;

      const codeMatch = (raw || "").match(/\[CODE:(\d{4})\]/) || displaySafe.match(/\[CODE:(\d{4})\]/);

      const historyForModel = [
        ...prior,
        { role: "user", content: userMessage },
        { role: "model", content: displaySafe },
      ];

      setState({ conversationHistory: historyForModel });

      if (codeMatch) {
        setState({
          codeRevealed: true,
          extractedCode: codeMatch[1],
          result: "win",
          screen: "debrief",
        });
        return;
      }

      void (async () => {
        const hit = await detectContradiction(
          historyForModel.map((t) => ({ role: t.role, content: t.content })),
          displaySafe,
        );
        if (hit && !disposed) {
          const st = getState();
          setState({ contradictionsCaught: st.contradictionsCaught + 1 });
          showNotification();
        }
      })();

      const st2 = getState();
      const nextTurn = st2.turnCount + 1;
      setState({ turnCount: nextTurn });

      const st3 = getState();
      if (nextTurn >= st3.maxTurns && !st3.codeRevealed) {
        setState({ result: "loss", screen: "debrief" });
      }
    } catch (err) {
      console.error(err);
      if (typing.isConnected) typing.remove();
      const errBubble = document.createElement("div");
      errBubble.className = "msg msg--subject msg--error fade-slide-up";
      errBubble.innerHTML = `
        <div class="msg__label msg__label--subject">SUBJECT</div>
        <div class="msg__body mono">Something failed in the uplink. Try again in a moment.</div>
      `;
      thread.appendChild(errBubble);
    } finally {
      if (getState().screen === "interrogation") {
        input.disabled = false;
        sendBtn.disabled = false;
        sendBtn.classList.remove("scanning");
        input.focus();
      }
    }
  }

  void (async () => {
    container.innerHTML = `<div class="screen screen--interrogation"><div class="loading-panel mono scanning">SECURE CHANNEL… LOADING SUBJECT</div></div>`;

    const sessionState = getState();
    try {
      const row = await getSession(sessionState.sessionId);
      if (disposed) return;
      fullSuspect = row.full_suspect;
      systemPrompt = buildSpySystemPrompt(fullSuspect, row.clearance_level ?? sessionState.clearanceLevel);
    } catch (e) {
      console.error(e);
      if (!disposed) {
        container.innerHTML = `<div class="screen screen--interrogation"><p class="mono panel--error">Session load failed. Check Supabase configuration.</p></div>`;
      }
      return;
    }

    if (disposed) return;

    if (!getState().missionStartTime) {
      setState({ missionStartTime: Date.now() });
    }

    resetHintRotation();
    const st0 = getState();
    const suspect = st0.suspect;
    if (disposed) return;
    container.innerHTML = `<div class="screen screen--interrogation">${buildLayout(suspect)}</div>`;
    layoutEl = container.querySelector(".interrogation-layout");
    const thread = container.querySelector("[data-feed-thread]");
    const input = container.querySelector("#operative-input");
    const sendBtn = container.querySelector("[data-send-btn]");
    const hintBtn = container.querySelector("[data-hint-btn]");
    const hintDrawer = container.querySelector("[data-hint-drawer]");
    const hintText = container.querySelector("[data-hint-text]");

    updateFromState(getState());

    unsub = subscribe((s) => {
      if (s.screen === "interrogation") updateFromState(s);
    });

    const form = container.querySelector("[data-chat-form]");
    const submit = () => handleSend(input, sendBtn, thread);

    if (form) {
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        submit();
      });
    }

    if (hintText) {
      hintText.textContent = `${getMissionPrimer()} Tap NEXT STEP for numbered guidance.`;
    }

    hintBtn.addEventListener("click", () => {
      unlockAudioPlayback();
      if (hintText) hintText.textContent = getNextStaticHint();
    });

    input.focus();
  })();

  return cleanup;
}
