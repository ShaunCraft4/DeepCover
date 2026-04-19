/**
 * Builds the inspection drawer rows for the active clearance level.
 * Level 1 → 3 checks, Level 2 → 5, Level 3 → 7 (each row is one thing to verify).
 * @param {import('../api/gemini.js').Packet} p
 * @param {1|2|3} level
 * @returns {{ label: string; value: string }[]}
 */
export function buildInspectionRows(p, level) {
  const proto = `${p.protocol}://`;
  const httpPlain = p.protocol === 'HTTP';
  const secureWords = /\b(encrypt|encrypted|secure\s+channel|TLS|SSL|VPN|private\s+link)\b/i.test(
    p.payload
  );

  if (level === 1) {
    return [
      {
        label: '1. Encrypted transport?',
        value: httpPlain
          ? `${proto}\nNo — HTTP has no TLS; sensitive data is visible on the wire.`
          : `${proto}\nYes — HTTPS uses TLS to this host (you still verify hostname and route).`,
      },
      {
        label: '2. Domain / hostname',
        value: p.domain,
      },
      {
        label: '3. Destination vs story',
        value: `Destination:\n${p.destination}\n\nPayload:\n${p.payload}`,
      },
    ];
  }

  if (level === 2) {
    const brandNote =
      p.threatType === 'typosquatting' && p.isMalicious
        ? 'Hostname may imitate a trusted brand — compare every character.'
        : 'Look for shortened or “almost right” brand spellings in the hostname.';
    const encNote = httpPlain
      ? secureWords
        ? 'Payload mentions security, but protocol is HTTP — traffic is still plaintext.'
        : 'If the text later implies “secure” or “encrypted” while protocol stays HTTP, that is a mismatch.'
      : 'Confirm TLS matches the sensitivity implied in the payload.';

    return [
      { label: '1. Transport', value: `${proto}${httpPlain ? ' (no TLS)' : ' (TLS)'}` },
      { label: '2. Hostname', value: p.domain },
      { label: '3. Destination', value: p.destination },
      { label: '4. Payload', value: p.payload },
      {
        label: '5. Brand + encryption story',
        value: `Brand / lookalike:\n${brandNote}\n\nEncryption vs protocol:\n${encNote}`,
      },
    ];
  }

  // Level 3 — 7 checks
  const tldNote = /\.(co|cam|tk|ru|cn|zip|gq)\b/i.test(p.domain)
    ? 'Unusual or “cousin” TLD for this kind of host — verify intent.'
    : 'Watch for wrong TLD (.co vs .com) or regional knockoffs.';
  const egressNote = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(p.destination)
    ? 'Numeric IP or odd relay — confirm it is authorized for this traffic.'
    : 'Internal-sounding labels must match real topology; watch mismatched egress.';
  const toneNote = /\b(audit|compliance|certificate|quarterly|reconciliation)\b/i.test(p.payload)
    ? 'Calm “compliance” tone can still be malicious — verify destination anyway.'
    : 'Low-drama wording is still dangerous if the route is wrong.';
  const homoglyphNote =
    /[^\u0000-\u007f]/.test(p.domain) || /[а-яА-Я]/.test(p.domain)
      ? 'Non-ASCII in hostname — possible homoglyph / confusable script.'
      : 'Scan for letters that look identical but come from different alphabets.';

  const encL3 = httpPlain
    ? secureWords
      ? 'Payload claims security; protocol is HTTP — plaintext.'
      : 'Re-read payload for implied security vs actual protocol above.'
    : 'Payload and protocol should align with stated sensitivity.';

  const brandL3 =
    p.threatType === 'typosquatting' && p.isMalicious
      ? 'Hostname may imitate a trusted brand — compare every character.'
      : 'Look for shortened or “almost right” brand spellings in the hostname.';

  return [
    { label: '1. Transport', value: `${proto}${httpPlain ? ' — no TLS' : ' — TLS to host'}` },
    { label: '2. Hostname', value: p.domain },
    { label: '3. Destination', value: p.destination },
    { label: '4. Payload', value: p.payload },
    {
      label: '5. Brand / lookalike',
      value:
        'Check commerce- or login-shaped names character-by-character (e.g. Amzin, Amaz0n).\n' +
        brandL3,
    },
    {
      label: '6. Encryption vs wording',
      value: encL3,
    },
    {
      label: '7. TLD · egress · tone · scripts',
      value: `TLD:\n${tldNote}\n\nEgress:\n${egressNote}\n\nTone:\n${toneNote}\n\nScripts:\n${homoglyphNote}`,
    },
  ];
}
