# Mission 02 — The Counter-Intel Firewall

Standalone Vite module under `Mission2/`. The project root `vite.config.js` sets `envDir` to this folder so Gemini reads `Mission2/.env`.

## Setup

1. Copy `Mission2/.env` and set your key:

   ```
   VITE_GEMINI_API_KEY=your_key_here
   ```

2. From the **repository root** (where `package.json` lives), run:

   ```
   npm install
   npm run dev
   ```

3. Open the mission in the browser:

   ```
   http://localhost:5173/Mission2/index.html
   ```

If the API key is missing or generation fails, the game uses 40 hardcoded fallback packets (`lib/fallbackPackets.js`).

## Build

```
npm run build
```

Preview the production build with `npm run preview` (see root `vite.config.js` for the port).
