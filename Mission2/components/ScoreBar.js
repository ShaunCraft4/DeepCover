import { subscribe, getState } from '../lib/store.js';

/**
 * @param {HTMLElement} container
 */
export function mountScoreBar(container) {
  const wrap = document.createElement('div');
  wrap.className = 'score-bar';
  wrap.innerHTML = `
    <span class="score-bar-label">AGENCY SECURITY SCORE</span>
    <div class="score-bar-track" role="progressbar" aria-valuemin="0" aria-valuemax="100">
      <div class="score-bar-fill"></div>
    </div>
    <span class="score-bar-numbers"><span class="score-bar-current">100</span>%</span>
  `;
  container.appendChild(wrap);

  const fill = wrap.querySelector('.score-bar-fill');
  const currentEl = wrap.querySelector('.score-bar-current');
  const track = wrap.querySelector('.score-bar-track');

  const applyScore = score => {
    const pct = Math.max(0, Math.min(100, score));
    fill.style.width = `${pct}%`;
    currentEl.textContent = String(Math.round(score < 0 ? 0 : score));
    track.setAttribute('aria-valuenow', String(Math.round(pct)));

    fill.classList.remove('score-bar-fill--high', 'score-bar-fill--mid', 'score-bar-fill--low');
    if (pct > 70) fill.classList.add('score-bar-fill--high');
    else if (pct >= 40) fill.classList.add('score-bar-fill--mid');
    else fill.classList.add('score-bar-fill--low');
  };

  const unsub = subscribe(s => applyScore(s.score));

  applyScore(getState().score);

  return {
    flash(kind) {
      wrap.classList.remove('score-bar--flash-bad', 'score-bar--flash-good');
      void wrap.offsetWidth;
      if (kind === 'bad') wrap.classList.add('score-bar--flash-bad');
      else if (kind === 'good') wrap.classList.add('score-bar--flash-good');
      window.setTimeout(() => {
        wrap.classList.remove('score-bar--flash-bad', 'score-bar--flash-good');
      }, kind === 'bad' ? 800 : 500);
    },
    destroy: () => {
      unsub();
      wrap.remove();
    },
  };
}
