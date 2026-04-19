# Mission 02 — The Interrogation Room

## Prerequisites

- Node.js 18+
- API keys in `Mission2/.env` (loaded by Vite via `envDir: 'Mission2'` in the repo root `vite.config.js`)

Fill in:

- `VITE_GEMINI_API_KEY` — Google AI Studio / Gemini API key
- `VITE_ELEVENLABS_API_KEY` — ElevenLabs API key
- `VITE_ELEVENLABS_VOICE_ID` — Voice ID for text-to-speech
- `VITE_SUPABASE_URL` — Project URL
- `VITE_SUPABASE_ANON_KEY` — (optional fallback) anon key
- `VITE_SUPABASE_SERVICE_ROLE_KEY` — service role key for inserting/fetching session rows during this prototype (keep private; do not ship to public clients in production)

## Database

Run `Mission2/supabase_migration.sql` in the Supabase SQL editor to create `mission2_sessions`.

## Run locally

From the **repository root** (not inside `Mission2/`):

```bash
npm install
npm run dev
```

Open the mission UI at:

`http://localhost:5173/Mission2/index.html`

## Build

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Notes

- This mission is self-contained under `Mission2/` and uses vanilla JavaScript with Vite.
- If Supabase env vars are missing, sessions fall back to an in-memory store for the current browser tab only.
