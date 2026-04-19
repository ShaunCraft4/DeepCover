import { getState, setState } from '../lib/store.js';
import { createPacketEngine, DIFFICULTY_CONFIG, SESSION_DURATION_SEC } from '../lib/packetEngine.js';
import { evaluateDecision, computePenaltyPercentScore } from '../lib/scoring.js';
import { mountScoreBar } from '../components/ScoreBar.js';
import { mountThreatLog } from '../components/ThreatLog.js';
import { mountPacketStream } from '../components/PacketStream.js';
import { mountInspectionPanel } from '../components/InspectionPanel.js';
import { mountAlertBanner } from '../components/AlertBanner.js';

function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = Math.max(0, totalSec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * @param {HTMLElement} root
 */
export function mountGame(root) {
  const level = /** @type {1|2|3} */ (getState().clearanceLevel ?? 1);
  const lifetimeMs = DIFFICULTY_CONFIG[level].packetLifetime;
  const sessionSec = SESSION_DURATION_SEC[level];
  const totalPkts = () => getState().totalPackets || 40;

  root.innerHTML = `
    <div class="game-screen">
      <div class="screen-flash-red-host"></div>
      <div class="game-header">
        <h1 class="game-title">COUNTER-INTEL FIREWALL</h1>
        <div class="game-timer" aria-live="polite">
          <span class="game-timer-label">SESSION</span>
          <span class="game-timer-val">${formatTime(sessionSec)}</span>
        </div>
        <div class="game-header-score"></div>
        <div class="game-packet-count">PACKETS: <span class="game-packet-num">00</span></div>
        <button type="button" class="btn-game-exit" id="game-exit-home">EXIT TO HOME</button>
      </div>
      <div class="game-main">
        <div class="game-feed">
          <div class="game-feed-label">LIVE TRAFFIC FEED — click packets to inspect</div>
          <div class="game-feed-zone"></div>
        </div>
        <div class="game-sidebar">
          <div class="game-threat-log-host"></div>
        </div>
      </div>
      <div class="game-inspection-host"></div>
      <div class="game-alert-host"></div>
      <div class="game-session-end" id="game-session-end" hidden aria-hidden="true">
        <div class="game-session-end-card">
          <p class="game-session-end-kicker">MISSION 02</p>
          <p class="game-session-end-label">SESSION COMPLETE</p>
          <p class="game-session-end-score" aria-live="polite">0</p>
          <p class="game-session-end-caption">Final security rating</p>
          <button type="button" class="btn-game-session-home" id="game-session-home">MISSION HOME</button>
        </div>
      </div>
    </div>
  `;

  const flashHost = root.querySelector('.screen-flash-red-host');
  const scoreHost = root.querySelector('.game-header-score');
  const feedZone = root.querySelector('.game-feed-zone');
  const logHost = root.querySelector('.game-threat-log-host');
  const inspectionHost = root.querySelector('.game-inspection-host');
  const alertHost = root.querySelector('.game-alert-host');
  const packetNumEl = root.querySelector('.game-packet-num');
  const timerValEl = root.querySelector('.game-timer-val');
  const sessionEndOverlay = root.querySelector('#game-session-end');
  const sessionEndScoreEl = root.querySelector('.game-session-end-score');

  const scoreApi = mountScoreBar(scoreHost);
  const alertApi = mountAlertBanner(alertHost);
  const threatLogApi = mountThreatLog(logHost);

  let timeLeftSec = sessionSec;
  /** @type {ReturnType<typeof setInterval> | null} */
  let timerId = null;

  const updateTimerDom = () => {
    if (timerValEl) timerValEl.textContent = formatTime(timeLeftSec);
  };

  const triggerBreachFlash = () => {
    const el = document.createElement('div');
    el.className = 'screen-flash-red';
    flashHost.appendChild(el);
    window.setTimeout(() => el.remove(), 650);
  };

  const updatePacketCount = () => {
    const n = getState().packetsProcessed;
    packetNumEl.textContent = String(n).padStart(2, '0');
  };

  /** @type {ReturnType<typeof createPacketEngine> | null} */
  let engine = null;
  let sessionEnded = false;

  const endSession = () => {
    if (sessionEnded) return;
    sessionEnded = true;
    if (timerId != null) {
      clearInterval(timerId);
      timerId = null;
    }
    engine?.stop();
    const st = getState();
    const finalScore = computePenaltyPercentScore(st.decisions, st.totalPackets || 40);
    setState({
      gameOver: true,
      inspecting: null,
      score: finalScore,
    });
    if (sessionEndScoreEl) sessionEndScoreEl.textContent = String(finalScore);
    if (sessionEndOverlay) {
      sessionEndOverlay.hidden = false;
      sessionEndOverlay.setAttribute('aria-hidden', 'false');
      // Avoid transformed ancestors (e.g. inspection drawer) clipping or blocking fixed overlays.
      if (sessionEndOverlay.parentElement !== document.body) {
        document.body.appendChild(sessionEndOverlay);
      }
    }
  };

  const maybeEndOnZeroScore = nextScore => {
    if (nextScore > 0) return;
    endSession();
  };

  const onSessionEndClick = e => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (!t.closest('.btn-game-session-home')) return;
    e.preventDefault();
    e.stopPropagation();
    // Full document reload: reliably returns to the Mission 2 shell (#app + home) regardless of
    // SPA route/overlay state (e.g. overlay moved to body, lastScreen edge cases).
    window.location.reload();
  };
  sessionEndOverlay?.addEventListener('click', onSessionEndClick);

  root.querySelector('#game-exit-home')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !window.confirm(
        'Leave this session and return to the mission home screen? Current run progress will be lost.'
      )
    )
      return;
    // Same as session-end MISSION HOME: full reload reliably restores Mission 2 home (store + #app).
    window.location.reload();
  });

  const onMissed = packet => {
    const s = getState();

    const dec = {
      packet,
      playerChoice: /** @type {const} */ (null),
      wasCorrect: false,
      timestamp: Date.now(),
      kind: /** @type {const} */ ('miss'),
    };

    const nextDecisions = [...s.decisions, dec];
    const nextScore = computePenaltyPercentScore(nextDecisions, totalPkts());
    setState({
      decisions: nextDecisions,
      packetsProcessed: s.packetsProcessed + 1,
      score: nextScore,
    });

    updatePacketCount();
    scoreApi.flash('bad');
    maybeEndOnZeroScore(nextScore);

    if (packet.isMalicious) {
      alertApi.show({
        kind: 'miss-malicious',
        title: '✕  THREAT SLIPPED THROUGH',
        lines: [
          `THREAT TYPE: ${packet.threatType}`,
          "You didn't inspect this packet in time.",
          packet.explanation,
        ],
      });
    }
  };

  engine = createPacketEngine(getState().packets, level, {
    getState: () => {
      const st = getState();
      return {
        queue: st.queue,
        activePackets: st.activePackets,
        inspecting: st.inspecting,
        gameOver: st.gameOver,
      };
    },
    setState,
    onGameOver: () => endSession(),
    onMissed,
  });

  const handleInspect = packet => {
    setState({ inspecting: packet });
  };

  const streamApi = mountPacketStream(feedZone, {
    packetLifetimeMs: lifetimeMs,
    onInspect: handleInspect,
  });

  const panelApi = mountInspectionPanel(inspectionHost, {
    onDecision: choice => {
      const packet = getState().inspecting;
      if (!packet) return;

      const { correct } = evaluateDecision(choice, packet);
      const s0 = getState();
      const nextCorrect = s0.correctDecisions + (correct ? 1 : 0);

      const dec = {
        packet,
        playerChoice: choice,
        wasCorrect: correct,
        timestamp: Date.now(),
        kind: /** @type {const} */ ('decision'),
      };

      const nextDecisions = [...s0.decisions, dec];
      const nextScore = computePenaltyPercentScore(nextDecisions, totalPkts());

      setState({
        inspecting: null,
        decisions: nextDecisions,
        packetsProcessed: s0.packetsProcessed + 1,
        correctDecisions: nextCorrect,
        wrongDecisions: s0.wrongDecisions + (correct ? 0 : 1),
        score: nextScore,
      });

      engine?.removeActivePacket(packet.id);
      updatePacketCount();
      maybeEndOnZeroScore(nextScore);

      if (correct && choice === 'block') {
        alertApi.show({
          kind: 'correct-block',
          title: '✓  THREAT NEUTRALIZED',
          lines: [packet.explanation],
        });
        scoreApi.flash('good');
      } else if (correct && choice === 'allow') {
        alertApi.show({
          kind: 'correct-allow',
          title: '✓  PACKET CLEARED',
          lines: [packet.explanation],
        });
        scoreApi.flash('good');
      } else if (!correct && choice === 'allow') {
        alertApi.show({
          kind: 'wrong-allow',
          title: '✕  BREACH — WRONG CALL',
          lines: [packet.explanation],
        });
        triggerBreachFlash();
        scoreApi.flash('bad');
      } else {
        alertApi.show({
          kind: 'wrong-block',
          title: '⚠  FALSE POSITIVE',
          lines: [packet.explanation],
        });
        scoreApi.flash('bad');
      }
    },
  });

  engine.start();
  updatePacketCount();
  updateTimerDom();

  timerId = window.setInterval(() => {
    timeLeftSec -= 1;
    updateTimerDom();
    if (timeLeftSec <= 0) {
      timeLeftSec = 0;
      updateTimerDom();
      endSession();
    }
  }, 1000);

  return () => {
    if (timerId != null) clearInterval(timerId);
    engine?.stop();
    sessionEndOverlay?.removeEventListener('click', onSessionEndClick);
    document.getElementById('game-session-end')?.remove();
    streamApi.destroy();
    panelApi.destroy();
    threatLogApi.destroy();
    alertApi.destroy();
    scoreApi.destroy();
    root.innerHTML = '';
  };
}
