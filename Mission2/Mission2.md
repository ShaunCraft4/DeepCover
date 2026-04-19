# Mission 02 — Counter-Intel Firewall (standalone Vite)

## Environment (repo-root `.env`)

`Mission2/vite.config.mjs` sets **`envDir` to the repository parent** (`DeepCover/`), same as the Dossier and Mission1. Put keys in **`DeepCover/.env`** (not a separate `Mission2/.env`).

Gemini is read in `lib/geminiEnv.js` (first match wins):

- `VITE_GEMINI_API_KEY`
- `GEMINI_API_KEY`
- `GOOGLE_API_KEY`
- `GOOGLE_AI_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`

Optional: `VITE_GEMINI_MODEL` (default `gemini-2.0-flash`).

If the key is missing or generation fails, the game uses fallback packets (`lib/fallbackPackets.js`).

## Run with the rest of the stack (port 5173)

From the **repository root**:

```bash
npm install
cd Mission2 && npm install && cd ..
npm run dev
```

- Dossier: `http://localhost:5173/`
- This module (same dev server as the dossier): `http://localhost:5173/Mission2/index.html` (see root `vite.config.js` multi-page `input`)

Mission1 Next (legacy Mission2 route) lives at `http://localhost:5173/mission1/mission2/` — a different app. After a **perfect** Mission 01 score, **Continue to Mission 2** opens the standalone Counter-Intel Firewall app at **`/Mission2/index.html`**.

## Build

```bash
cd Mission2
npm run build
```

## Preview

```bash
cd Mission2
npm run preview
```
