/**
 * @typedef {'correct-block' | 'correct-allow' | 'wrong-allow' | 'wrong-block' | 'miss-malicious'} AlertKind
 */

/**
 * @param {HTMLElement} container
 */
export function mountAlertBanner(container) {
  const host = document.createElement('div');
  host.className = 'alert-banner-host';
  container.appendChild(host);
  let hideTimer = null;

  /**
   * @param {object} opts
   * @param {AlertKind} opts.kind
   * @param {string} opts.title
   * @param {string[]} opts.lines
   */
  const show = opts => {
    clearTimeout(hideTimer);
    host.className = 'alert-banner-host';
    host.innerHTML = '';

    const card = document.createElement('div');
    card.className = `alert-banner-card alert-banner-card--${opts.kind}`;
    const title = document.createElement('div');
    title.className = 'alert-banner-title';
    title.textContent = opts.title;
    card.appendChild(title);
    opts.lines.forEach(text => {
      const p = document.createElement('p');
      p.className = 'alert-banner-body';
      p.textContent = text;
      card.appendChild(p);
    });
    host.appendChild(card);
    requestAnimationFrame(() => host.classList.add('is-visible'));

    hideTimer = window.setTimeout(() => {
      host.classList.remove('is-visible');
    }, 3500);
  };

  return { show, destroy: () => host.remove() };
}
