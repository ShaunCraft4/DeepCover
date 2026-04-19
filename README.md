# DeepCover

A hackathon project for CitrusHack2026.

## Local development (single URL)

Run **everything** from the repository root:

```bash
npm install
npm --prefix Mission1 install
npm --prefix Mission2 install
npm run dev
```

**Open only:** [http://localhost:5173](http://localhost:5173)

| What | URL on :5173 |
|------|----------------|
| Dossier (main app) | `/` |
| Mission 1 (Next.js) | `/mission1` |
| Mission 2 (standalone Vite game) | `/Mission2/index.html` |
| Mission 3 (Cyber Defense — single-page shell) | `/Mission3/index.html` |

Port **3000** runs Next (Mission1) **behind the proxy** — open only **5173** in the browser. Mission2 is another HTML entry on the **same** Vite dev server (no second frontend port). The root dev server proxies `/mission1` (and `/_next`) to port 3000.

Environment variables live in **`.env` at the repo root** (shared by the dossier, Mission1, Mission2, and Mission3 where applicable).

### Scripts

- `npm run dev` — dossier + Mission1 + Mission2 (use this for full stack on **5173**).
- `npm run dev:dossier` — dossier only (Mission1/Mission2 routes will not work unless those servers run separately).
- `npm run dev:mission1` — Next only (advanced). `npm run dev:mission2` — Mission2 Vite project alone (advanced; full stack uses root `npm run dev` — Mission2 at `/Mission2/index.html` on **5173**).
