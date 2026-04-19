import { setState } from '../lib/store.js';
import { generatePackets } from '../api/gemini.js';
import { SESSION_DURATION_SEC } from '../lib/packetEngine.js';

function fmtSession(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * @param {HTMLElement} root
 */
export function mountHome(root) {
  root.innerHTML = `
    <div class="home-screen">
      <section class="home-section home-section--header fade-slide-up" style="animation-delay:0ms">
        <p class="home-mission-label">MISSION 02</p>
        <div class="home-rule"></div>
        <h1 class="home-title">THE COUNTER-INTEL FIREWALL</h1>
        <div class="home-body">
          <p>Enemy operatives are probing our network.</p>
          <p>Data packets are incoming — and some of them are traps.</p>
          <p>Your job: open each packet and read every line in the inspection drawer. Higher levels show <strong>more checks per packet</strong> (3 → 5 → 7). Block anything that fails your review.</p>
          <p class="home-what-title">Level 1 — Recruit: <strong>3</strong> checks per packet</p>
          <ol class="home-what-ol">
            <li><strong>Encrypted transport?</strong> <code>HTTPS</code> = TLS to this host. <code>HTTP</code> = no TLS (nothing sensitive should go plain).</li>
            <li><strong>Hostname</strong> — Is the domain exactly what you expect? One wrong letter or digit can be a fake.</li>
            <li><strong>Destination vs story</strong> — Does where it is sent match what the message claims?</li>
          </ol>
          <p class="home-what-title home-what-title--tier">Level 2 — Operative: <strong>5</strong> checks per packet</p>
          <p class="home-what-tier-note">Same topics as Recruit, but the drawer splits routing and body into separate rows:</p>
          <ol class="home-what-ol">
            <li><strong>Transport</strong> — <code>HTTP</code> vs <code>HTTPS</code> (TLS or not).</li>
            <li><strong>Hostname</strong> — Brand lookalikes and typos.</li>
            <li><strong>Destination</strong> — Where the packet is routed.</li>
            <li><strong>Payload</strong> — What the message claims.</li>
            <li><strong>Brand + encryption story</strong> — Does the hostname still look trustworthy? Does the text claim “secure” while the protocol stays <code>HTTP</code>?</li>
          </ol>
          <p class="home-what-title home-what-title--tier">Level 3 — Handler: <strong>7</strong> checks per packet</p>
          <p class="home-what-tier-note"><strong>1–4</strong> — Same four blocks as Operative (transport, hostname, destination, payload). <strong>5–7</strong> add deeper review:</p>
          <ol class="home-what-ol" start="5">
            <li><strong>Brand / lookalike</strong> — Scrutinize commerce- or login-shaped names character by character.</li>
            <li><strong>Encryption vs wording</strong> — Does the language match what <code>HTTP</code> / <code>HTTPS</code> actually provides?</li>
            <li><strong>TLD · egress · tone · scripts</strong> — Wrong domain endings, odd IPs, fake-calm “compliance” tone, and homoglyphs.</li>
          </ol>
          <p>One wrong approval and enemy signals intelligence owns that data. Don't let it happen.</p>
          <p class="home-next-module">
            <a class="home-next-module-link" href="/Mission3/index.html">Mission 03 — Cyber Defense →</a>
          </p>
        </div>
        <div class="home-rule"></div>
      </section>

      <section class="home-section fade-slide-up" style="animation-delay:120ms">
        <div class="difficulty-grid">
          <button type="button" class="difficulty-card" data-level="1">
            <span class="difficulty-level">LEVEL 1</span>
            <span class="difficulty-name">RECRUIT</span>
            <p class="difficulty-desc"><strong>3</strong> inspection checks per packet. Slower feed — best to learn the basics.</p>
            <p class="difficulty-meta">Packets: 40<br>Feed: slowest<br>Session: ${fmtSession(SESSION_DURATION_SEC[1])}</p>
          </button>
          <button type="button" class="difficulty-card" data-level="2">
            <span class="difficulty-level">LEVEL 2</span>
            <span class="difficulty-name">OPERATIVE</span>
            <p class="difficulty-desc"><strong>5</strong> inspection checks per packet. Slightly quicker feed than Recruit.</p>
            <p class="difficulty-meta">Packets: 40<br>Feed: medium<br>Session: ${fmtSession(SESSION_DURATION_SEC[2])}</p>
          </button>
          <button type="button" class="difficulty-card" data-level="3">
            <span class="difficulty-level">LEVEL 3</span>
            <span class="difficulty-name">HANDLER</span>
            <p class="difficulty-desc"><strong>7</strong> inspection checks per packet. A bit faster than Operative — expert focus.</p>
            <p class="difficulty-meta">Packets: 40<br>Feed: brisk (not max speed)<br>Session: ${fmtSession(SESSION_DURATION_SEC[3])}</p>
          </button>
        </div>
      </section>

      <section class="home-section home-section--start fade-slide-up" style="animation-delay:240ms">
        <button type="button" class="btn-init" disabled>INITIALIZE FIREWALL</button>
      </section>
    </div>
  `;

  const cards = root.querySelectorAll('.difficulty-card');
  const btn = root.querySelector('.btn-init');
  /** @type {1|2|3|null} */
  let selected = null;

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const lv = /** @type {'1'|'2'|'3'} */ (card.getAttribute('data-level'));
      selected = /** @type {1|2|3} */ (Number(lv));
      cards.forEach(c => c.classList.toggle('is-selected', c === card));
      btn.disabled = false;
    });
  });

  btn.addEventListener('click', async () => {
    if (selected == null) return;
    btn.disabled = true;
    btn.classList.add('scanning');
    btn.textContent = 'GENERATING THREAT DATABASE...';
    try {
      const packets = await generatePackets(selected);
      setState({
        screen: 'game',
        clearanceLevel: selected,
        packets,
        queue: [],
        activePackets: [],
        inspecting: null,
        score: 100,
        maxScore: 100,
        totalPackets: packets.length,
        decisions: [],
        packetsProcessed: 0,
        correctDecisions: 0,
        wrongDecisions: 0,
        sessionStartTime: Date.now(),
        gameOver: false,
      });
    } catch (e) {
      console.error(e);
      btn.disabled = false;
      btn.textContent = 'INITIALIZE FIREWALL';
    } finally {
      btn.classList.remove('scanning');
    }
  });

  return () => {
    root.innerHTML = '';
  };
}
