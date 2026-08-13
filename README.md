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
- [ ] Countries are tinted green by default, and amber/orange/red for countries with tracked events, based on the dominant severity there, with a thin green outline around every country's border.
- [ ] Event markers on the map are small glowing dots colored by severity, not the default Mapbox teardrop pin.
- [ ] Eight blue ring markers appear at major maritime chokepoints (Hormuz, Suez, Bab-el-Mandeb, Bosphorus, Gibraltar, Panama, Kerch, Malacca) — hovering/clicking shows the strait's name in a dark, high-contrast popup matching the terminal theme, and a red count badge appears when events are tracked within ~400km.
- [ ] The "ÚLTIMAS NOTÍCIAS" panel floating over the bottom-left of the map populates with entries roughly matching the markers on the map, and shows a "48H · N" count of events from the last 48 hours.
- [ ] Clicking a marker highlights the matching card in the feed.
- [ ] Clicking a card in the feed flies the map to that event's location.
- [ ] The severity filter buttons narrow the feed correctly.
- [ ] The 🔔/🔕 button in the feed header toggles the critical-alert beep; the ▲/▼ button collapses/expands the feed to just its header.
- [ ] Temporarily setting `ACLED_PASSWORD` to an invalid value and restarting the dev server does **not** crash the app — GDELT-only data still loads, or (if you also break GDELT) the "Live data unavailable" banner appears instead of a blank page.
- [ ] Clicking on a country's landmass on the map opens a panel with a short Wikipedia summary and the count/dominant severity of tracked events there — including for events whose source used an abbreviated or alternate country name (e.g. an event tagged "DRC" still counts toward Democratic Republic of the Congo).
- [ ] The top-left panel lists up to 10 countries ranked by tracked event count; clicking one flies the map there and opens its country panel.
- [ ] The commodities ticker below the header shows WTI/Brent oil, gold, silver, natural gas, wheat, corn, and copper prices (no API key required — public Yahoo Finance endpoint).
- [ ] When a new CRITICAL-severity event appears on a poll (not on first load), a HUD-style popup appears over the map (with a beep), then auto-dismisses after a few seconds.
- [ ] The MAPA / TENDÊNCIAS / COMMODITIES / PREVISÕES tabs below the ticker switch the main view; TENDÊNCIAS lists up to 20 countries with a "VER NO MAPA" link back to the map, COMMODITIES shows larger price cards, and PREVISÕES lists conflict/geopolitics prediction markets from Polymarket's public API (no key required) with a probability bar and 24h volume, linking out to the market.

## Data source notes

- **ACLED** requires a paid license for event-level API access as of August 2026 (the free `myACLED` tier only covers aggregated data). The client in `lib/acled.ts` is left in place in case you obtain a license later, but expect it to fail with a 403 otherwise — the app runs fine without it.
- **GDELT** is the primary/only practical source. It has two independent endpoints: the precise GEO 2.0 API (city/region-level coordinates) and the DOC 2.0 API (article-level, country-only). `lib/gdelt.ts` tries GEO first and automatically falls back to DOC — plotting events at their source country's centroid instead — if GEO is unreachable, which has happened during real GDELT-side infrastructure outages. No configuration needed; it recovers on its own once GEO comes back.

## Out of scope for this version

Live video stream, PRO paywall, and online-viewer counter — see `docs/superpowers/specs/2026-08-11-warwatch-clone-mvp-design.md` for the original non-goals list. Commodities ticker, Conflict Trends, and the Predictions panel were originally listed there too but have since been added (all free, no paywall).
