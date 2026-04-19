/**
 * @typedef {Object} Packet
 * @property {string} id
 * @property {'HTTPS' | 'HTTP'} protocol
 * @property {string} domain
 * @property {string} payload
 * @property {string} destination
 * @property {boolean} isMalicious
 * @property {'safe' | 'http_unencrypted' | 'typosquatting' | 'phishing'} threatType
 * @property {string} explanation
 * @property {1 | 2 | 3} difficulty
 */

/**
 * @param {1 | 2 | 3} clearanceLevel
 * @returns {Promise<Packet[]>}
 */
export async function generatePackets(clearanceLevel) {
  const prompt = buildPacketPrompt(clearanceLevel);
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    const { FALLBACK_PACKETS } = await import('../lib/fallbackPackets.js');
    return FALLBACK_PACKETS;
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 4000 },
      }),
    }
  );

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    const packets = JSON.parse(clean);
    if (Array.isArray(packets) && packets.length >= 20) return normalizePackets(packets);
    throw new Error('Invalid packet array');
  } catch {
    const { FALLBACK_PACKETS } = await import('../lib/fallbackPackets.js');
    return FALLBACK_PACKETS;
  }
}

/** @param {unknown[]} raw */
function normalizePackets(raw) {
  return raw.map((p, i) => {
    const o = /** @type {Record<string, unknown>} */ (p);
    return {
      id: String(o.id ?? `pkt_${String(i + 1).padStart(3, '0')}`),
      protocol: o.protocol === 'HTTP' ? 'HTTP' : 'HTTPS',
      domain: String(o.domain ?? ''),
      payload: String(o.payload ?? ''),
      destination: String(o.destination ?? ''),
      isMalicious: Boolean(o.isMalicious),
      threatType:
        o.threatType === 'http_unencrypted' ||
        o.threatType === 'typosquatting' ||
        o.threatType === 'phishing'
          ? o.threatType
          : 'safe',
      explanation: String(o.explanation ?? ''),
      difficulty: [1, 2, 3].includes(/** @type {number} */ (o.difficulty))
        ? /** @type {1 | 2 | 3} */ (o.difficulty)
        : 1,
    };
  });
}

/**
 * @param {1 | 2 | 3} clearanceLevel
 */
function buildPacketPrompt(clearanceLevel) {
  return `
You are generating a dataset of simulated network packets for a cybersecurity training game.
Return ONLY a valid JSON array. No markdown. No explanation. No preamble. Just the raw JSON array.

Generate exactly 40 packets using this structure for each:
{
  "id": "pkt_001",  // increment for each packet
  "protocol": "HTTPS" or "HTTP",
  "domain": "the domain string",
  "payload": "1 sentence describing what this packet contains",
  "destination": "where it is routing to — either a named internal server or a suspicious IP",
  "isMalicious": true or false,
  "threatType": "safe" | "http_unencrypted" | "typosquatting" | "phishing",
  "explanation": "1-2 sentences explaining the threat or confirming safety, written directly to the player as 'Agent,'",
  "difficulty": 1, 2, or 3
}

DISTRIBUTION — generate exactly these counts:
- 20 SAFE packets (isMalicious: false, threatType: "safe")
- 7 HTTP_UNENCRYPTED (isMalicious: true, threatType: "http_unencrypted") 
- 7 TYPOSQUATTING (isMalicious: true, threatType: "typosquatting")
- 6 PHISHING (isMalicious: true, threatType: "phishing")

SAFE PACKET RULES:
- Protocol must be HTTPS
- Domain must be correctly spelled and look like a real government or enterprise domain
- Payload must be routine and expected (e.g., "Encrypted login token refresh", "Scheduled ops report upload")
- Destination must be a named internal server (e.g., "Internal Auth Server", "HQ File Archive")
- Examples of safe domains: agency-portal.gov, ops-central.gov, secure-hq.net, intel-hub.gov

HTTP_UNENCRYPTED PACKET RULES:
- Protocol is HTTP (no S)
- Domain may look perfectly legitimate — the ONLY red flag is the missing S
- Payload sounds routine but shouldn't be sent unencrypted (passwords, credentials, reports)
- Explanation must teach the player: unencrypted = enemy can intercept this data
- Example explanation: "Agent, the domain looks fine but HTTP means this data travels in plain text. Enemy signals intelligence can intercept every byte of that password hash."

TYPOSQUATTING PACKET RULES:
- Protocol is HTTPS (so it looks legitimate at first glance)
- Domain is a very close misspelling of a real-looking domain — only 1 character is different
- Substitution types to use across the 7 packets — use each at least once:
  * Letter swap: l → 1 (lowercase L to number one) e.g. "agency-porta1.gov"
  * Letter swap: o → 0 (letter O to number zero) e.g. "g0v-secure.net"
  * Double letter: "agenxy-portal.gov" (extra or missing letter)
  * Hyphen trick: "agencyportal.gov" (removed hyphen from "agency-portal.gov")
  * TLD swap: "agency-portal.com" instead of "agency-portal.gov"
  * Letter transposition: "agency-protal.gov" (r and o swapped)
  * Added subdomain: "login.agency-portal.gov.malicious.io"
- Payload sounds urgent to pressure fast clicking
- Explanation must name the exact character that was changed

PHISHING PACKET RULES:
- Protocol is HTTPS (again, looks safe at first glance)
- Domain looks real
- The red flag is entirely in the PAYLOAD and DESTINATION
- Payload examples: 
  * "URGENT: Agency director password reset required immediately"
  * "CRITICAL: Multi-factor auth token expiring — click to re-authenticate now"
  * "ACTION REQUIRED: Verify your identity or access will be suspended in 10 minutes"
- Destination must be a suspicious IP address or clearly wrong server
  (e.g., "185.220.101.47", "redirect: 92.63.196.99", "unknown external endpoint")
- Explanation must teach the player to always check WHERE a link actually goes

DIFFICULTY CALIBRATION — match the player briefing tiers:
Level ${clearanceLevel}:
${
  clearanceLevel === 1
    ? `
- Level 1 (RECRUIT) — baseline roster only:
  * HTTP vs HTTPS: obvious misses (clear HTTP where HTTPS is expected for sensitive flows).
  * Typosquatting: simple digit-for-letter (1/l, 0/o), obvious hyphen tricks.
  * Phishing: dramatic urgent copy; destinations are clearly external or bogus IPs.
  Do NOT use brand-mangled commerce names, homoglyphs, or calm “compliance” phishing — save those for higher levels.
  All difficulty: 1 on every packet.
`
    : clearanceLevel === 2
      ? `
- Level 2 (OPERATIVE) — baseline PLUS two extra dimensions (must appear across malicious packets):
  * BRAND-MANGLED / COMMERCE LOOKALIKES: include typosquatting that mimics shopping or login portals (e.g. "Amzin.com", "Amaz0n-support.net", shortened spellings) — still threatType "typosquatting" but vary domains accordingly.
  * ENCRYPTION THEATER: include several HTTP packets whose PAYLOAD falsely implies encryption or "secure channel" / "encrypted attachment" language — the red flag remains protocol HTTP.
  * Keep mixing easier threats too; use harder typos (hyphen removal, TLD swap) in some typosquatting packets.
  * Phishing: destinations that almost look internal but are not (nearby IP ranges, fake internal names).
  Use difficulty: 1 for ~40%, difficulty: 2 for ~60% of packets.
`
      : `
- Level 3 (HANDLER) — baseline + Operative patterns PLUS four extra dimensions (weave into malicious packets; keep threatType one of http_unencrypted | typosquatting | phishing):
  * HOMOGLYPHS / CONFUSABLES: at least 2 typosquatting packets using visually similar characters (describe in domain string, e.g. Cyrillic а vs Latin a) — still ASCII-like output in JSON if needed, but concept clear in domain field.
  * TLD / COUSIN TRICKS: .co, .cam, regional or brand-adjacent TLD confusion in typosquatting.
  * TRUSTED LABEL, WRONG EGRESS: phishing packets where payload cites internal process but destination is external IP or unrelated relay.
  * LOW-DRAMA SOCIAL ENGINEERING: phishing payloads that sound like compliance, audit, or certificate review — not panicked — with subtle destination mismatch.
  * HTTP payloads may mimic “TLS” or “VPN” jargon while remaining HTTP.
  Use difficulty: 3 on all malicious packets; mix 1–2 on safe packets.
`
}

Make every packet feel distinct. Do not repeat the same domain or payload twice.
The player must actually read each packet carefully. Do not make all threats obvious or all 
safe packets boring.
  `;
}
