import { getState, subscribe } from '../lib/store.js';
import { buildInspectionRows } from '../lib/inspectionSignals.js';

/**
 * @param {HTMLElement} container
 * @param {object} api
 * @param {(choice: 'allow'|'block') => void} api.onDecision
 */
export function mountInspectionPanel(container, api) {
  const panel = document.createElement('div');
  panel.className = 'inspection-panel';
  panel.innerHTML = `
    <div class="inspection-panel-inner">
      <div class="inspection-panel-head">
        <span>PACKET INSPECTION</span>
        <span class="inspection-panel-id"></span>
      </div>
      <div class="inspection-panel-body"></div>
      <div class="inspection-actions">
        <button type="button" class="btn-allow inspection-allow">✓  ALLOW</button>
        <button type="button" class="btn-quarantine inspection-block">⊘  QUARANTINE</button>
      </div>
    </div>
  `;
  container.appendChild(panel);

  const idEl = panel.querySelector('.inspection-panel-id');
  const bodyEl = panel.querySelector('.inspection-panel-body');

  panel.querySelector('.inspection-allow').addEventListener('click', () => api.onDecision('allow'));
  panel.querySelector('.inspection-block').addEventListener('click', () => api.onDecision('block'));

  const apply = () => {
    const p = getState().inspecting;
    const level = /** @type {1|2|3} */ (getState().clearanceLevel ?? 1);
    if (!p) {
      panel.classList.remove('is-open');
      return;
    }
    panel.classList.add('is-open');
    idEl.textContent = p.id;

    const rows = buildInspectionRows(p, level);
    bodyEl.replaceChildren();
    rows.forEach(row => {
      const wrap = document.createElement('div');
      wrap.className = 'inspection-field';
      const k = document.createElement('div');
      k.className = 'inspection-k';
      k.textContent = row.label;
      const v = document.createElement('div');
      v.className = 'inspection-value text-data';
      v.textContent = row.value;
      wrap.appendChild(k);
      wrap.appendChild(v);
      bodyEl.appendChild(wrap);
    });
  };

  const unsub = subscribe(() => apply());
  apply();

  return {
    destroy: () => {
      unsub();
      panel.remove();
    },
  };
}
