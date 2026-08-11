# WarWatch Clone — MVP Design (Map + Live Conflict Feed)

## Context

Inspired by an Instagram reel from @warwatchz promoting [war-watch.com](https://war-watch.com), a live OSINT-style conflict-tracking dashboard. The full site includes a world map, a live news feed, a commodities ticker, per-country conflict trend stats, Polymarket-based predictions, a live video stream, an online-viewer counter, and a PRO subscription tier.

This spec covers the **MVP only**: an interactive world map paired with a live conflict news feed, backed by real data. All other panels (commodities ticker, conflict trends, predictions, live stream, PRO gating, online counter) are out of scope and will get their own specs in later phases.

## Goals

- Real (not mocked) conflict event data, geolocated on an interactive dark-themed map.
- A side feed of the latest events, synced with the map (click a marker → highlight the card, and vice versa).
- Data refreshes automatically every few minutes without a page reload.
- Resilient to individual data source failures — never show a blank/broken page.

## Non-goals (future phases)

- Commodities ticker (Yahoo Finance)
- Conflict Trends panel (per-country severity/report counts)
- Predictions panel (Polymarket)
- Live video stream embed
- PRO subscription / paywall
- Online viewer counter

## Architecture

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS. All third-party API calls happen in server-side API routes so credentials (ACLED key, Claude API key) are never exposed to the browser.

**Data flow:**

1. `GET /api/events` (Next.js route handler) fetches, in parallel:
   - **ACLED** — Armed Conflict Location & Event Data. Primary source: pre-geocoded conflict events with a severity/event-type classification. Requires a free registered API key + email (env vars `ACLED_API_KEY`, `ACLED_EMAIL`).
   - **GDELT** — Global Database of Events, Language and Tone. Broader, noisier, open, no key required. Used to catch events ACLED hasn't indexed yet.
2. Both responses are normalized into a common `ConflictEvent` shape (see Data Model below).
3. The combined, normalized list is sent to the **Claude API** (server-side, `ANTHROPIC_API_KEY` env var) with a prompt asking it to:
   - Merge near-duplicate events describing the same incident (ACLED and GDELT often double-report).
   - Produce a single concise headline per event.
   - Assign a `severity` tag (`low` / `medium` / `high` / `critical`) and a `confidence` percentage.
4. The result is cached in-memory on the server for ~10 minutes (a simple timestamped module-level cache is sufficient for MVP — no external cache/DB needed).
5. The browser polls `/api/events` every ~3–5 minutes (`setInterval` + `fetch`, or SWR/React Query with a `refreshInterval`). Because the server response is cached, this doesn't cause redundant upstream calls.

**Why polling, not WebSockets:** ACLED/GDELT themselves only update on the order of minutes to hours, so a persistent real-time connection would add infrastructure complexity (a long-running server process, which doesn't fit Next.js's request-driven model on most hosts) for no real benefit.

## Data Model

```ts
type ConflictEvent = {
  id: string;              // stable hash of source + original id
  lat: number;
  lng: number;
  locationName: string;    // e.g. "Al Mokha, Red Sea, Yemen"
  country: string;
  headline: string;        // Claude-refined, single line
  source: string;          // e.g. "ACLED", "GDELT"
  sourceUrl: string;
  timestamp: string;       // ISO 8601
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;      // 0-100
};
```

## Components

- `app/page.tsx` — dashboard shell: header + `<MapView>` + `<NewsFeed>`, shared `events` state fetched via a polling hook.
- `components/MapView.tsx` — Mapbox GL JS map (dark style, e.g. `mapbox://styles/mapbox/dark-v11`), renders one marker per event colored by `severity`. Marker click emits a "select event" callback.
- `components/NewsFeed.tsx` — scrollable list of event cards (location, country, headline, source, relative time, "SOURCE →" link). Includes a severity filter (All / Critical / High). Card click emits the same "select event" callback, which the map listens to for fly-to + highlight.
- `app/api/events/route.ts` — the fetch/normalize/dedupe/cache pipeline described above.
- `lib/acled.ts`, `lib/gdelt.ts` — thin fetch + normalize modules per source, isolated so either can be swapped/retried independently.
- `lib/refineWithClaude.ts` — takes normalized events, returns deduped/refined events; on failure, returns the input unchanged (raw fallback).

## Error Handling

- If both ACLED and GDELT fail: serve the last good cached result if one exists; otherwise show a banner ("Live data unavailable — retrying") instead of a blank map/feed.
- If Claude refinement fails or times out: fall back to the normalized-but-unrefined event list (duplicates and rougher headlines are an acceptable degradation, not a failure).
- If the Mapbox token is missing/invalid: log a clear console error and render a static placeholder instead of a broken map canvas.

## Environment Variables

```
ACLED_API_KEY=
ACLED_EMAIL=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

All stored in a local `.env` file (gitignored), never committed or pasted in chat.

## Testing

Primarily manual verification (`npm run dev`): map renders and loads markers, feed populates, map↔feed click sync works, filter works, and the app survives a simulated upstream failure (e.g. temporarily using a bad API key) without crashing. A focused unit test is worth adding for the normalize/dedupe logic in `lib/acled.ts` / `lib/gdelt.ts` / `refineWithClaude.ts` since that's the part most likely to silently produce bad data.
