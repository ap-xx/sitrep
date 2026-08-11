# SITREP

A live conflict-tracking dashboard: an interactive dark-themed world map paired with a real-time news feed, built with Next.js. Independent implementation inspired by the map+feed concept of war-watch.com — not affiliated with it.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `ACLED_EMAIL` / `ACLED_PASSWORD` — your myACLED account credentials (register free at https://acleddata.com/register/). ACLED authenticates via OAuth (email + password), not a static API key.
   - `ANTHROPIC_API_KEY` — from https://console.anthropic.com/settings/keys. **Never share this key in chat, screenshots, or commits.**
   - `NEXT_PUBLIC_MAPBOX_TOKEN` — a public token from https://account.mapbox.com/access-tokens/ (free tier is sufficient)
3. `npm run dev` and open http://localhost:3000

## Testing

`npm test` runs the automated suite (event normalization, dedup/refinement fallback behavior, and the `/api/events` caching pipeline).

## Manual verification checklist

With `.env` fully populated:

- [ ] Map loads with the dark Mapbox style and shows markers colored by severity.
- [ ] The news feed on the right populates with entries roughly matching the markers on the map.
- [ ] Clicking a marker highlights the matching card in the feed.
- [ ] Clicking a card in the feed flies the map to that event's location.
- [ ] The severity filter buttons narrow the feed correctly.
- [ ] Temporarily setting `ACLED_PASSWORD` to an invalid value and restarting the dev server does **not** crash the app — GDELT-only data still loads, or (if you also break GDELT) the "Live data unavailable" banner appears instead of a blank page.
- [ ] Clicking on a country's landmass on the map opens a panel with a short Wikipedia summary and the count/dominant severity of tracked events there.

## Out of scope for this version

Commodities ticker, Conflict Trends panel, Predictions panel, live video stream, PRO paywall, and online-viewer counter — see `docs/superpowers/specs/2026-08-11-warwatch-clone-mvp-design.md` for the full non-goals list. These would each get their own design spec in a future phase.
