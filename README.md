# DeepCover

DeepCover is a multi-mission cyber-intelligence game experience built for CitrusHack 2026.

The repository combines:
- A root Vite app (the Dossier shell)
- A Next.js app for Mission 1
- A standalone Vite mission for Mission 2
- A static Mission 3 entry page

## Project Structure

- `index.html` + `src/` - Dossier shell (root Vite app)
- `Mission1/` - Next.js app (Mission 1 plus mission APIs/UI)
- `Mission2/` - standalone Vite game (Counter-Intel Firewall)
- `Mission3/index.html` - static mission shell page
- `vite.config.js` - root dev/build config with multi-page entries and proxying
- `.env` - shared environment variables for all parts of the project

## Requirements

- Node.js 18+ (20+ recommended)
- npm

## Quick Start (full stack, one URL)

Run this from the repository root:

```bash
npm install
npm --prefix Mission1 install
npm --prefix Mission2 install
npm run dev
```

Open:
- [http://localhost:5173](http://localhost:5173)

Use this single origin for local development. The root Vite server proxies Mission 1 internally to port `3000`.

## Local Routes

On `http://localhost:5173`:

- Dossier: `/`
- Mission 1 (Next.js): `/mission1`
- Mission 2 (standalone app): `/Mission2/index.html`
- Mission 3 (static page): `/Mission3/index.html`

Notes:
- Mission 1 dev server runs on `127.0.0.1:3000` and is proxied through the root server.
- `/_next` requests are rewritten to `/mission1/_next` by the root `vite.config.js`.

## Environment Variables

Create a single `.env` file in the repository root (`DeepCover/.env`).

Commonly used keys:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`
- `VITE_ELEVENLABS_API_KEY`
- `VITE_MISSION1_URL` (optional override for Mission 1 base URL)
- `VITE_GEMINI_MODEL` (optional; Mission 2 default is `gemini-2.0-flash`)

Mission 2 Gemini key lookup (first available):
- `VITE_GEMINI_API_KEY`
- `GEMINI_API_KEY`
- `GOOGLE_API_KEY`
- `GOOGLE_AI_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`

If Gemini keys are missing or a generation call fails, Mission 2 falls back to local packet data.

## Scripts (root)

- `npm run dev` - starts the full local stack:
  - resets ports `5173` and `3000`
  - runs root Vite (Dossier + Mission2/Mission3 pages)
  - runs `Mission1` Next dev server
- `npm run dev:dossier` - root Vite only
- `npm run dev:mission1` - Mission 1 Next dev only
- `npm run build` - builds root multi-page bundle
- `npm run preview` - previews root build on port `4173`

## Mission-Specific Commands

Mission 1 (from root):

```bash
npm --prefix Mission1 run dev
npm --prefix Mission1 run build
npm --prefix Mission1 run start
```

Mission 2 (from root):

```bash
npm --prefix Mission2 run dev
npm --prefix Mission2 run build
npm --prefix Mission2 run preview
```

## Build and Preview (root app)

```bash
npm run build
npm run preview
```

The root build includes multiple HTML entry points:
- `index.html`
- `Mission2/index.html`
- `Mission3/index.html`

## Troubleshooting

- If `5173` or `3000` is in use, run `npm run dev` (it already includes port cleanup).
- If Mission 1 looks broken under `/mission1`, make sure you opened `http://localhost:5173` (not `3000`) for normal integrated dev.
- If AI-generated content is missing in Mission 2, confirm API keys in root `.env`.

## License

No license file is currently defined in this repository.
