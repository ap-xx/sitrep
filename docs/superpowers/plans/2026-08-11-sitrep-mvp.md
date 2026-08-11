# SITREP MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the SITREP MVP — a Next.js dashboard with an interactive dark-themed world map and a synced live news feed, backed by real conflict-event data from ACLED and GDELT, refined/deduped server-side by the Claude API.

**Architecture:** Next.js (App Router, TypeScript, Tailwind). Server-side API route `/api/events` fetches from ACLED and GDELT in parallel, normalizes both into a shared `ConflictEvent` type, sends the combined list to Claude for dedup/refinement, and caches the result in memory for 10 minutes. The client polls that route every few minutes and renders a Mapbox GL map plus a filterable news feed, kept in sync by a shared "selected event" id.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Mapbox GL JS, `@anthropic-ai/sdk`, Vitest.

## Global Constraints

- Real data only for events (ACLED + GDELT) — no mocked/static event data in the shipped app.
- All third-party API calls (ACLED, Claude) happen server-side; `ANTHROPIC_API_KEY` and `ACLED_API_KEY`/`ACLED_EMAIL` must never reach the browser bundle.
- Secrets live only in a local, gitignored `.env` file — never hardcoded, never committed, never pasted in chat.
- Client polls `/api/events` every ~3–5 minutes; server caches the combined/refined result for ~10 minutes.
- Scope is map + news feed only. Commodities ticker, Conflict Trends panel, Predictions panel, live video stream, PRO paywall, and online-viewer counter are explicitly out of scope for this plan.
- Map uses Mapbox GL JS with a dark style (`mapbox://styles/mapbox/dark-v11`), driven by `NEXT_PUBLIC_MAPBOX_TOKEN`.
- If a data source or the Claude refinement step fails, the app must degrade gracefully (stale cache or a visible banner) — never a blank or crashed page.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/page.tsx`
- Create: `.gitignore`
- Create: `.env.example`

**Interfaces:**
- Produces: a buildable Next.js app at the project root; path alias `@/*` → project root (used by every later task's imports).

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "sitrep",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "mapbox-gl": "^3.5.2",
    "@anthropic-ai/sdk": "^0.27.0"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "@types/node": "^20.14.15",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/mapbox-gl": "^3.4.0",
    "tailwindcss": "^3.4.7",
    "postcss": "^8.4.41",
    "autoprefixer": "^10.4.19",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

- [ ] **Step 4: Create `postcss.config.mjs`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#0b0f14",
        "panel-border": "#1f2a33",
        severity: {
          low: "#3fb950",
          medium: "#d4a72c",
          high: "#e8590c",
          critical: "#da3633",
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 6: Create `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body {
  background-color: #05070a;
  color: #e6edf3;
}
```

- [ ] **Step 7: Create `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SITREP — Live Conflict Map",
  description: "Real-time conflict tracking map and news feed.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Create placeholder `app/page.tsx`**

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-xl">SITREP</h1>
    </main>
  );
}
```

- [ ] **Step 9: Create `.gitignore`**

```
node_modules
.next
.env
.env.local
*.log
```

- [ ] **Step 10: Create `.env.example`**

```
ACLED_API_KEY=
ACLED_EMAIL=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

- [ ] **Step 11: Install dependencies**

Run: `npm install`
Expected: installs without errors, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 12: Verify the scaffold builds**

Run: `npm run build`
Expected: build succeeds and reports the `/` route.

- [ ] **Step 13: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs postcss.config.mjs tailwind.config.ts app .gitignore .env.example next-env.d.ts
git commit -m "chore: scaffold Next.js + TypeScript + Tailwind project"
```

---

### Task 2: Testing harness, shared types, and event-id hashing

**Files:**
- Create: `vitest.config.ts`
- Create: `lib/types.ts`
- Create: `lib/ids.ts`
- Test: `lib/ids.test.ts`

**Interfaces:**
- Consumes: path alias `@/*` from Task 1's `tsconfig.json`.
- Produces: `type Severity = "low" | "medium" | "high" | "critical"`; `type ConflictEvent = { id, lat, lng, locationName, country, headline, source, sourceUrl, timestamp, severity, confidence }` (`lib/types.ts`); `makeEventId(source: string, rawId: string): string` (`lib/ids.ts`) — used by Tasks 3 and 4 to build stable ids.

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 2: Write the failing test for `makeEventId`**

Create `lib/ids.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { makeEventId } from "./ids";

describe("makeEventId", () => {
  it("produces the same id for the same source and raw id", () => {
    const a = makeEventId("ACLED", "YEM12345");
    const b = makeEventId("ACLED", "YEM12345");
    expect(a).toBe(b);
  });

  it("produces different ids for different sources with the same raw id", () => {
    const acled = makeEventId("ACLED", "12345");
    const gdelt = makeEventId("GDELT", "12345");
    expect(acled).not.toBe(gdelt);
  });

  it("produces a 16-character hex string", () => {
    const id = makeEventId("GDELT", "abc");
    expect(id).toMatch(/^[0-9a-f]{16}$/);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run lib/ids.test.ts`
Expected: FAIL — `Cannot find module './ids'`.

- [ ] **Step 4: Create `lib/types.ts`**

```ts
export type Severity = "low" | "medium" | "high" | "critical";

export type ConflictEvent = {
  id: string;
  lat: number;
  lng: number;
  locationName: string;
  country: string;
  headline: string;
  source: string;
  sourceUrl: string;
  timestamp: string;
  severity: Severity;
  confidence: number;
};
```

- [ ] **Step 5: Create `lib/ids.ts`**

```ts
import { createHash } from "node:crypto";

export function makeEventId(source: string, rawId: string): string {
  return createHash("sha1").update(`${source}:${rawId}`).digest("hex").slice(0, 16);
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run lib/ids.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts lib/types.ts lib/ids.ts lib/ids.test.ts
git commit -m "feat: add shared ConflictEvent type and event-id hashing"
```

---

### Task 3: ACLED client

**Files:**
- Create: `lib/acled.ts`
- Test: `lib/acled.test.ts`

**Interfaces:**
- Consumes: `makeEventId` and `ConflictEvent` from Task 2; env vars `ACLED_API_KEY`, `ACLED_EMAIL`.
- Produces: `fetchAcledEvents(): Promise<ConflictEvent[]>` — throws on missing credentials, non-OK response, or a `success: false` payload. Used by Task 6.

- [ ] **Step 1: Write the failing tests**

Create `lib/acled.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAcledEvents } from "./acled";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

describe("fetchAcledEvents", () => {
  it("throws when credentials are missing", async () => {
    vi.stubEnv("ACLED_API_KEY", "");
    vi.stubEnv("ACLED_EMAIL", "");
    await expect(fetchAcledEvents()).rejects.toThrow(/ACLED_API_KEY/);
  });

  it("normalizes a successful response into ConflictEvent[]", async () => {
    vi.stubEnv("ACLED_API_KEY", "test-key");
    vi.stubEnv("ACLED_EMAIL", "test@example.com");

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          {
            event_id_cnty: "YEM12345",
            event_date: "2026-08-10",
            event_type: "Violence against civilians",
            sub_event_type: "Attack",
            country: "Yemen",
            location: "Al Mokha",
            latitude: "13.0500",
            longitude: "43.2500",
            source: "Local Source",
            notes: "Cargo vessel struck by projectile.",
            fatalities: "3",
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const events = await fetchAcledEvents();

    expect(events).toHaveLength(1);
    expect(events[0].locationName).toBe("Al Mokha");
    expect(events[0].country).toBe("Yemen");
    expect(events[0].severity).toBe("medium");
    expect(events[0].source).toBe("ACLED");
  });

  it("throws when the HTTP response is not ok", async () => {
    vi.stubEnv("ACLED_API_KEY", "test-key");
    vi.stubEnv("ACLED_EMAIL", "test@example.com");

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;

    await expect(fetchAcledEvents()).rejects.toThrow(/status 500/);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/acled.test.ts`
Expected: FAIL — `Cannot find module './acled'`.

- [ ] **Step 3: Create `lib/acled.ts`**

```ts
import { makeEventId } from "./ids";
import type { ConflictEvent } from "./types";

const ACLED_ENDPOINT = "https://api.acleddata.com/acled/read";

type AcledRawEvent = {
  event_id_cnty: string;
  event_date: string;
  event_type: string;
  sub_event_type: string;
  country: string;
  location: string;
  latitude: string;
  longitude: string;
  source: string;
  notes: string;
  fatalities: string;
};

type AcledResponse = {
  success: boolean;
  data: AcledRawEvent[];
};

function severityFromFatalities(fatalities: number): ConflictEvent["severity"] {
  if (fatalities >= 20) return "critical";
  if (fatalities >= 5) return "high";
  if (fatalities >= 1) return "medium";
  return "low";
}

function last24HoursDate(): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

export async function fetchAcledEvents(): Promise<ConflictEvent[]> {
  const apiKey = process.env.ACLED_API_KEY;
  const email = process.env.ACLED_EMAIL;

  if (!apiKey || !email) {
    throw new Error("ACLED_API_KEY and ACLED_EMAIL must be set");
  }

  const params = new URLSearchParams({
    key: apiKey,
    email,
    event_date: last24HoursDate(),
    event_date_where: ">=",
    limit: "100",
  });

  const response = await fetch(`${ACLED_ENDPOINT}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`ACLED request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as AcledResponse;

  if (!payload.success) {
    throw new Error("ACLED response reported failure");
  }

  return payload.data
    .filter((raw) => raw.latitude && raw.longitude)
    .map((raw) => {
      const fatalities = Number.parseInt(raw.fatalities, 10) || 0;
      return {
        id: makeEventId("ACLED", raw.event_id_cnty),
        lat: Number.parseFloat(raw.latitude),
        lng: Number.parseFloat(raw.longitude),
        locationName: raw.location,
        country: raw.country,
        headline: `${raw.sub_event_type} — ${raw.notes}`.slice(0, 200),
        source: "ACLED",
        sourceUrl: "https://acleddata.com/data-export-tool/",
        timestamp: new Date(raw.event_date).toISOString(),
        severity: severityFromFatalities(fatalities),
        confidence: 90,
      } satisfies ConflictEvent;
    });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/acled.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/acled.ts lib/acled.test.ts
git commit -m "feat: add ACLED client with normalization to ConflictEvent"
```

---

### Task 4: GDELT client

**Files:**
- Create: `lib/gdelt.ts`
- Test: `lib/gdelt.test.ts`

**Interfaces:**
- Consumes: `makeEventId` and `ConflictEvent` from Task 2.
- Produces: `fetchGdeltEvents(): Promise<ConflictEvent[]>` — throws on non-OK response. Used by Task 6.

- [ ] **Step 1: Write the failing tests**

Create `lib/gdelt.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchGdeltEvents } from "./gdelt";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe("fetchGdeltEvents", () => {
  it("normalizes a successful GeoJSON response, extracting headline and url from html", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [43.25, 13.05] },
            properties: {
              name: "Al Mokha, Yemen",
              count: 4,
              html: '<a href="https://news.example.com/a1">Cargo vessel struck off Yemen coast</a>',
            },
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const events = await fetchGdeltEvents();

    expect(events).toHaveLength(1);
    expect(events[0].lat).toBe(13.05);
    expect(events[0].lng).toBe(43.25);
    expect(events[0].headline).toBe("Cargo vessel struck off Yemen coast");
    expect(events[0].sourceUrl).toBe("https://news.example.com/a1");
    expect(events[0].source).toBe("GDELT");
  });

  it("falls back to a generic headline when the html has no anchor tag", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [10, 20] },
            properties: { name: "Somewhere", count: 1, html: "<b>no link here</b>" },
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const events = await fetchGdeltEvents();

    expect(events[0].headline).toBe("Reported activity");
    expect(events[0].sourceUrl).toBe("");
  });

  it("throws when the HTTP response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;

    await expect(fetchGdeltEvents()).rejects.toThrow(/status 500/);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/gdelt.test.ts`
Expected: FAIL — `Cannot find module './gdelt'`.

- [ ] **Step 3: Create `lib/gdelt.ts`**

```ts
import { makeEventId } from "./ids";
import type { ConflictEvent } from "./types";

const GDELT_ENDPOINT = "https://api.gdeltproject.org/api/v2/geo/geo";

const QUERY = "(war OR conflict OR attack OR strike OR clash OR airstrike OR shelling)";

type GdeltFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    name: string;
    count: number;
    html: string;
  };
};

type GdeltGeoJson = {
  type: "FeatureCollection";
  features: GdeltFeature[];
};

function extractHeadlineAndUrl(html: string): { headline: string; url: string } {
  const match = html.match(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/);
  if (!match) {
    return { headline: "Reported activity", url: "" };
  }
  return { url: match[1], headline: match[2] };
}

export async function fetchGdeltEvents(): Promise<ConflictEvent[]> {
  const params = new URLSearchParams({
    query: QUERY,
    mode: "PointData",
    format: "GeoJSON",
    timespan: "24h",
  });

  const response = await fetch(`${GDELT_ENDPOINT}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`GDELT request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GdeltGeoJson;

  return payload.features
    .filter((f) => f.geometry?.coordinates?.length === 2)
    .map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const { headline, url } = extractHeadlineAndUrl(feature.properties.html);
      const count = feature.properties.count ?? 1;

      return {
        id: makeEventId("GDELT", `${feature.properties.name}:${lat}:${lng}`),
        lat,
        lng,
        locationName: feature.properties.name,
        country:
          feature.properties.name.split(",").pop()?.trim() ?? feature.properties.name,
        headline,
        source: "GDELT",
        sourceUrl: url,
        timestamp: new Date().toISOString(),
        severity: "medium",
        confidence: Math.min(95, 40 + count * 5),
      } satisfies ConflictEvent;
    });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/gdelt.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/gdelt.ts lib/gdelt.test.ts
git commit -m "feat: add GDELT client with normalization to ConflictEvent"
```

---

### Task 5: Claude refinement (dedupe + summarize)

**Files:**
- Create: `lib/refineWithClaude.ts`
- Test: `lib/refineWithClaude.test.ts`

**Interfaces:**
- Consumes: `ConflictEvent` from Task 2; env var `ANTHROPIC_API_KEY`.
- Produces: `refineWithClaude(events: ConflictEvent[]): Promise<ConflictEvent[]>` — always resolves (never throws); returns the input unchanged on any failure (missing key, API error, unparsable response, empty result). Used by Task 6.

- [ ] **Step 1: Write the failing tests**

Create `lib/refineWithClaude.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ConflictEvent } from "./types";

const createMock = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: createMock };
  },
}));

import { refineWithClaude } from "./refineWithClaude";

const sampleEvents: ConflictEvent[] = [
  {
    id: "abc123",
    lat: 13.05,
    lng: 43.25,
    locationName: "Al Mokha",
    country: "Yemen",
    headline: "Cargo vessel struck",
    source: "ACLED",
    sourceUrl: "https://example.com",
    timestamp: "2026-08-10T00:00:00.000Z",
    severity: "medium",
    confidence: 90,
  },
];

afterEach(() => {
  createMock.mockReset();
  vi.unstubAllEnvs();
});

describe("refineWithClaude", () => {
  it("returns refined events when Claude responds with valid JSON", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");

    const refined: ConflictEvent[] = [
      { ...sampleEvents[0], headline: "Refined headline", severity: "high", confidence: 95 },
    ];

    createMock.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(refined) }],
    });

    const result = await refineWithClaude(sampleEvents);
    expect(result[0].headline).toBe("Refined headline");
    expect(result[0].severity).toBe("high");
  });

  it("falls back to the original events when the API call fails", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    createMock.mockRejectedValue(new Error("network error"));

    const result = await refineWithClaude(sampleEvents);
    expect(result).toEqual(sampleEvents);
  });

  it("falls back to the original events when the response isn't valid JSON", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    createMock.mockResolvedValue({
      content: [{ type: "text", text: "not json" }],
    });

    const result = await refineWithClaude(sampleEvents);
    expect(result).toEqual(sampleEvents);
  });

  it("returns events unchanged when no API key is configured", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const result = await refineWithClaude(sampleEvents);
    expect(result).toEqual(sampleEvents);
    expect(createMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/refineWithClaude.test.ts`
Expected: FAIL — `Cannot find module './refineWithClaude'`.

- [ ] **Step 3: Create `lib/refineWithClaude.ts`**

```ts
import Anthropic from "@anthropic-ai/sdk";
import type { ConflictEvent } from "./types";

export async function refineWithClaude(events: ConflictEvent[]): Promise<ConflictEvent[]> {
  if (events.length === 0) return events;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return events;
  }

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: buildPrompt(events) }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return events;
    }

    const parsed = JSON.parse(extractJson(textBlock.text)) as ConflictEvent[];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return events;
    }

    return parsed;
  } catch {
    return events;
  }
}

function buildPrompt(events: ConflictEvent[]): string {
  return [
    "You are deduplicating and refining conflict event reports for a live news feed.",
    "Below is a JSON array of events, possibly containing near-duplicates describing the same incident from different sources.",
    "Merge near-duplicates into a single entry (keep the more specific location/headline), write each headline as one concise sentence, and set severity to one of low/medium/high/critical and confidence to a 0-100 integer reflecting how corroborated the event is.",
    "Return ONLY a JSON array of objects with exactly these fields: id, lat, lng, locationName, country, headline, source, sourceUrl, timestamp, severity, confidence. No prose, no markdown fences.",
    "",
    JSON.stringify(events),
  ].join("\n");
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/refineWithClaude.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/refineWithClaude.ts lib/refineWithClaude.test.ts
git commit -m "feat: add Claude-based dedup/refinement with safe fallback"
```

---

### Task 6: Events API route with caching

**Files:**
- Create: `app/api/events/route.ts`
- Test: `app/api/events/route.test.ts`

**Interfaces:**
- Consumes: `fetchAcledEvents` (Task 3), `fetchGdeltEvents` (Task 4), `refineWithClaude` (Task 5), `ConflictEvent` (Task 2).
- Produces: `GET(): Promise<Response>` returning JSON `{ events: ConflictEvent[], stale: boolean, updatedAt: string }` (503 status when both sources fail and no cache exists); `__resetCacheForTests(): void` (test-only). Used by Task 10's `useEvents` hook via `fetch("/api/events")`.

- [ ] **Step 1: Write the failing tests**

Create `app/api/events/route.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConflictEvent } from "@/lib/types";

const fetchAcledEventsMock = vi.fn();
const fetchGdeltEventsMock = vi.fn();
const refineWithClaudeMock = vi.fn();

vi.mock("@/lib/acled", () => ({ fetchAcledEvents: fetchAcledEventsMock }));
vi.mock("@/lib/gdelt", () => ({ fetchGdeltEvents: fetchGdeltEventsMock }));
vi.mock("@/lib/refineWithClaude", () => ({ refineWithClaude: refineWithClaudeMock }));

import { GET, __resetCacheForTests } from "./route";

const sampleEvent: ConflictEvent = {
  id: "abc123",
  lat: 1,
  lng: 2,
  locationName: "Somewhere",
  country: "Testland",
  headline: "Something happened",
  source: "ACLED",
  sourceUrl: "https://example.com",
  timestamp: "2026-08-10T00:00:00.000Z",
  severity: "medium",
  confidence: 80,
};

beforeEach(() => {
  __resetCacheForTests();
  fetchAcledEventsMock.mockReset();
  fetchGdeltEventsMock.mockReset();
  refineWithClaudeMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/events", () => {
  it("returns refined events combining both sources", async () => {
    fetchAcledEventsMock.mockResolvedValue([sampleEvent]);
    fetchGdeltEventsMock.mockResolvedValue([]);
    refineWithClaudeMock.mockImplementation(async (events: ConflictEvent[]) => events);

    const response = await GET();
    const body = await response.json();

    expect(body.events).toHaveLength(1);
    expect(body.stale).toBe(false);
    expect(refineWithClaudeMock).toHaveBeenCalledWith([sampleEvent]);
  });

  it("serves cached results without re-fetching on the second call", async () => {
    fetchAcledEventsMock.mockResolvedValue([sampleEvent]);
    fetchGdeltEventsMock.mockResolvedValue([]);
    refineWithClaudeMock.mockImplementation(async (events: ConflictEvent[]) => events);

    await GET();
    await GET();

    expect(fetchAcledEventsMock).toHaveBeenCalledTimes(1);
    expect(fetchGdeltEventsMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to GDELT data when ACLED fails", async () => {
    fetchAcledEventsMock.mockRejectedValue(new Error("ACLED down"));
    fetchGdeltEventsMock.mockResolvedValue([sampleEvent]);
    refineWithClaudeMock.mockImplementation(async (events: ConflictEvent[]) => events);

    const response = await GET();
    const body = await response.json();

    expect(body.events).toHaveLength(1);
    expect(body.stale).toBe(false);
  });

  it("returns a 503 with no events when both sources fail and there is no cache", async () => {
    fetchAcledEventsMock.mockRejectedValue(new Error("ACLED down"));
    fetchGdeltEventsMock.mockRejectedValue(new Error("GDELT down"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.events).toEqual([]);
    expect(body.stale).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run app/api/events/route.test.ts`
Expected: FAIL — `Cannot find module './route'`.

- [ ] **Step 3: Create `app/api/events/route.ts`**

```ts
import { NextResponse } from "next/server";
import { fetchAcledEvents } from "@/lib/acled";
import { fetchGdeltEvents } from "@/lib/gdelt";
import { refineWithClaude } from "@/lib/refineWithClaude";
import type { ConflictEvent } from "@/lib/types";

const CACHE_TTL_MS = 10 * 60 * 1000;

let cache: { events: ConflictEvent[]; updatedAt: number } | null = null;

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.updatedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      events: cache.events,
      stale: false,
      updatedAt: new Date(cache.updatedAt).toISOString(),
    });
  }

  const [acledResult, gdeltResult] = await Promise.allSettled([
    fetchAcledEvents(),
    fetchGdeltEvents(),
  ]);

  const fetched: ConflictEvent[] = [
    ...(acledResult.status === "fulfilled" ? acledResult.value : []),
    ...(gdeltResult.status === "fulfilled" ? gdeltResult.value : []),
  ];

  if (acledResult.status === "rejected") {
    console.error("ACLED fetch failed:", acledResult.reason);
  }
  if (gdeltResult.status === "rejected") {
    console.error("GDELT fetch failed:", gdeltResult.reason);
  }

  if (fetched.length === 0) {
    if (cache) {
      return NextResponse.json({
        events: cache.events,
        stale: true,
        updatedAt: new Date(cache.updatedAt).toISOString(),
      });
    }
    return NextResponse.json(
      { events: [], stale: true, updatedAt: new Date(now).toISOString() },
      { status: 503 },
    );
  }

  const refined = await refineWithClaude(fetched);

  cache = { events: refined, updatedAt: now };

  return NextResponse.json({
    events: refined,
    stale: false,
    updatedAt: new Date(now).toISOString(),
  });
}

export function __resetCacheForTests() {
  cache = null;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run app/api/events/route.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add app/api/events/route.ts app/api/events/route.test.ts
git commit -m "feat: add /api/events route combining ACLED+GDELT with 10min cache"
```

---

### Task 7: Severity filter utility

**Files:**
- Create: `lib/filterEvents.ts`
- Test: `lib/filterEvents.test.ts`

**Interfaces:**
- Consumes: `ConflictEvent`, `Severity` from Task 2.
- Produces: `type SeverityFilterValue = "all" | Severity`; `filterBySeverity(events: ConflictEvent[], filter: SeverityFilterValue): ConflictEvent[]`. Used by Task 8's `NewsFeed`.

- [ ] **Step 1: Write the failing tests**

Create `lib/filterEvents.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { filterBySeverity } from "./filterEvents";
import type { ConflictEvent } from "./types";

function makeEvent(overrides: Partial<ConflictEvent>): ConflictEvent {
  return {
    id: "id",
    lat: 0,
    lng: 0,
    locationName: "loc",
    country: "country",
    headline: "headline",
    source: "ACLED",
    sourceUrl: "https://example.com",
    timestamp: "2026-08-10T00:00:00.000Z",
    severity: "low",
    confidence: 50,
    ...overrides,
  };
}

const events: ConflictEvent[] = [
  makeEvent({ id: "1", severity: "low" }),
  makeEvent({ id: "2", severity: "critical" }),
  makeEvent({ id: "3", severity: "critical" }),
];

describe("filterBySeverity", () => {
  it("returns all events when filter is 'all'", () => {
    expect(filterBySeverity(events, "all")).toHaveLength(3);
  });

  it("returns only events matching the given severity", () => {
    const result = filterBySeverity(events, "critical");
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.severity === "critical")).toBe(true);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterBySeverity(events, "high")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/filterEvents.test.ts`
Expected: FAIL — `Cannot find module './filterEvents'`.

- [ ] **Step 3: Create `lib/filterEvents.ts`**

```ts
import type { ConflictEvent, Severity } from "./types";

export type SeverityFilterValue = "all" | Severity;

export function filterBySeverity(
  events: ConflictEvent[],
  filter: SeverityFilterValue,
): ConflictEvent[] {
  if (filter === "all") return events;
  return events.filter((event) => event.severity === filter);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/filterEvents.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/filterEvents.ts lib/filterEvents.test.ts
git commit -m "feat: add severity filter utility for the news feed"
```

---

### Task 8: NewsFeed and EventCard components

**Files:**
- Create: `components/EventCard.tsx`
- Create: `components/NewsFeed.tsx`

**Interfaces:**
- Consumes: `ConflictEvent` (Task 2), `filterBySeverity`/`SeverityFilterValue` (Task 7).
- Produces: `EventCard({ event, selected, onSelect }: { event: ConflictEvent; selected: boolean; onSelect: (event: ConflictEvent) => void })`; `NewsFeed({ events, selectedId, onSelect }: { events: ConflictEvent[]; selectedId: string | null; onSelect: (event: ConflictEvent) => void })`. Used by Task 10's `app/page.tsx`.

- [ ] **Step 1: Create `components/EventCard.tsx`**

```tsx
import type { ConflictEvent } from "@/lib/types";

const SEVERITY_LABEL: Record<ConflictEvent["severity"], string> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  critical: "CRITICAL",
};

const SEVERITY_CLASS: Record<ConflictEvent["severity"], string> = {
  low: "text-severity-low border-severity-low",
  medium: "text-severity-medium border-severity-medium",
  high: "text-severity-high border-severity-high",
  critical: "text-severity-critical border-severity-critical",
};

function timeAgo(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function EventCard({
  event,
  selected,
  onSelect,
}: {
  event: ConflictEvent;
  selected: boolean;
  onSelect: (event: ConflictEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      className={`w-full border-l-2 px-3 py-2 text-left hover:bg-panel-border/40 ${
        SEVERITY_CLASS[event.severity]
      } ${selected ? "bg-panel-border/60" : ""}`}
    >
      <div className="flex items-center justify-between text-xs opacity-70">
        <span>{event.locationName}</span>
        <span>{SEVERITY_LABEL[event.severity]}</span>
      </div>
      <p className="text-sm">{event.headline}</p>
      <div className="mt-1 flex items-center justify-between text-xs opacity-60">
        <span>{event.country}</span>
        <span>{timeAgo(event.timestamp)}</span>
      </div>
      {event.sourceUrl && (
        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs underline opacity-70"
        >
          SOURCE →
        </a>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Create `components/NewsFeed.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { ConflictEvent } from "@/lib/types";
import { filterBySeverity, type SeverityFilterValue } from "@/lib/filterEvents";
import { EventCard } from "./EventCard";

const FILTERS: SeverityFilterValue[] = ["all", "critical", "high", "medium", "low"];

export function NewsFeed({
  events,
  selectedId,
  onSelect,
}: {
  events: ConflictEvent[];
  selectedId: string | null;
  onSelect: (event: ConflictEvent) => void;
}) {
  const [filter, setFilter] = useState<SeverityFilterValue>("all");
  const filtered = filterBySeverity(events, filter);

  return (
    <aside className="flex h-full w-96 flex-col border-l border-panel-border bg-panel">
      <div className="flex gap-1 border-b border-panel-border p-2 text-xs">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded px-2 py-1 uppercase ${
              filter === value ? "bg-panel-border" : "opacity-60"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            selected={event.id === selectedId}
            onSelect={onSelect}
          />
        ))}
        {filtered.length === 0 && (
          <p className="p-4 text-center text-sm opacity-50">No events match this filter.</p>
        )}
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Verify the project still type-checks and builds**

Run: `npm run build`
Expected: build succeeds with no type errors (these components aren't wired into a page yet, so this only confirms they compile).

- [ ] **Step 4: Commit**

```bash
git add components/EventCard.tsx components/NewsFeed.tsx
git commit -m "feat: add NewsFeed and EventCard components"
```

---

### Task 9: MapView component

**Files:**
- Create: `components/MapView.tsx`

**Interfaces:**
- Consumes: `ConflictEvent` (Task 2); env var `NEXT_PUBLIC_MAPBOX_TOKEN`; `mapbox-gl`.
- Produces: `MapView({ events, selectedId, onSelect }: { events: ConflictEvent[]; selectedId: string | null; onSelect: (event: ConflictEvent) => void })`. Used by Task 10's `app/page.tsx`.

- [ ] **Step 1: Create `components/MapView.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { ConflictEvent } from "@/lib/types";

const SEVERITY_COLOR: Record<ConflictEvent["severity"], string> = {
  low: "#3fb950",
  medium: "#d4a72c",
  high: "#e8590c",
  critical: "#da3633",
};

export function MapView({
  events,
  selectedId,
  onSelect,
}: {
  events: ConflictEvent[];
  selectedId: string | null;
  onSelect: (event: ConflictEvent) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [20, 20],
      zoom: 2,
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    for (const event of events) {
      const marker = new mapboxgl.Marker({ color: SEVERITY_COLOR[event.severity] })
        .setLngLat([event.lng, event.lat])
        .addTo(map);

      marker.getElement().addEventListener("click", () => onSelect(event));
      markersRef.current.set(event.id, marker);
    }
  }, [events, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const event = events.find((e) => e.id === selectedId);
    if (event) {
      map.flyTo({ center: [event.lng, event.lat], zoom: 6 });
    }
  }, [selectedId, events]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-panel text-sm opacity-60">
        Map unavailable — NEXT_PUBLIC_MAPBOX_TOKEN is not configured.
      </div>
    );
  }

  return <div ref={containerRef} className="h-full flex-1" />;
}
```

- [ ] **Step 2: Verify the project still type-checks and builds**

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 3: Commit**

```bash
git add components/MapView.tsx
git commit -m "feat: add MapView component with severity-colored markers"
```

---

### Task 10: Dashboard page wiring and polling hook

**Files:**
- Create: `hooks/useEvents.ts`
- Modify: `app/page.tsx` (replace the Task 1 placeholder)

**Interfaces:**
- Consumes: `MapView` (Task 9), `NewsFeed` (Task 8), `ConflictEvent` (Task 2); fetches `GET /api/events` (Task 6).
- Produces: `useEvents(): { events: ConflictEvent[]; stale: boolean; updatedAt: string | null; error: string | null }`. The default export of `app/page.tsx` is the full dashboard shell — nothing later depends on it directly.

- [ ] **Step 1: Create `hooks/useEvents.ts`**

```ts
"use client";

import { useEffect, useState } from "react";
import type { ConflictEvent } from "@/lib/types";

const POLL_INTERVAL_MS = 4 * 60 * 1000;

type EventsResponse = {
  events: ConflictEvent[];
  stale: boolean;
  updatedAt: string;
};

export function useEvents() {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/events");
        const body = (await response.json()) as EventsResponse;
        if (!cancelled) {
          setData(body);
          setError(response.ok ? null : "Live data unavailable — retrying");
        }
      } catch {
        if (!cancelled) {
          setError("Live data unavailable — retrying");
        }
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return {
    events: data?.events ?? [],
    stale: data?.stale ?? false,
    updatedAt: data?.updatedAt ?? null,
    error,
  };
}
```

- [ ] **Step 2: Replace `app/page.tsx` with the wired dashboard**

```tsx
"use client";

import { useState } from "react";
import { MapView } from "@/components/MapView";
import { NewsFeed } from "@/components/NewsFeed";
import { useEvents } from "@/hooks/useEvents";
import type { ConflictEvent } from "@/lib/types";

export default function Home() {
  const { events, stale, error } = useEvents();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleSelect(event: ConflictEvent) {
    setSelectedId(event.id);
  }

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-panel-border bg-panel px-4 py-2">
        <span className="text-lg font-bold tracking-wide">SITREP</span>
        <span className="flex items-center gap-2 text-xs text-severity-critical">
          <span className="h-2 w-2 rounded-full bg-severity-critical" />
          LIVE
        </span>
      </header>
      {(error || stale) && (
        <div className="bg-severity-high/20 px-4 py-1 text-center text-xs text-severity-high">
          {error ?? "Showing cached data — live sources are temporarily unavailable."}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <MapView events={events} selectedId={selectedId} onSelect={handleSelect} />
        <NewsFeed events={events} selectedId={selectedId} onSelect={handleSelect} />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify the project builds**

Run: `npm run build`
Expected: build succeeds with no type errors; `/` route listed in the output.

- [ ] **Step 4: Commit**

```bash
git add hooks/useEvents.ts app/page.tsx
git commit -m "feat: wire dashboard page with polling, map, and news feed"
```

---

### Task 11: README, environment setup guide, and final verification

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: nothing new — documents the whole system built in Tasks 1–10.
- Produces: nothing consumed by other tasks; this is the terminal task.

- [ ] **Step 1: Create `README.md`**

```md
# SITREP

A live conflict-tracking dashboard: an interactive dark-themed world map paired with a real-time news feed, built with Next.js. Independent implementation inspired by the map+feed concept of war-watch.com — not affiliated with it.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `ACLED_API_KEY` / `ACLED_EMAIL` — register for a free key at https://acleddata.com/register/
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
- [ ] Temporarily setting `ACLED_API_KEY` to an invalid value and restarting the dev server does **not** crash the app — GDELT-only data still loads, or (if you also break GDELT) the "Live data unavailable" banner appears instead of a blank page.

## Out of scope for this version

Commodities ticker, Conflict Trends panel, Predictions panel, live video stream, PRO paywall, and online-viewer counter — see `docs/superpowers/specs/2026-08-11-warwatch-clone-mvp-design.md` for the full non-goals list. These would each get their own design spec in a future phase.
```

- [ ] **Step 2: Run the full build**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: Run the full automated test suite**

Run: `npm test`
Expected: all tests pass (ids, acled, gdelt, refineWithClaude, filterEvents, route — 17 tests total across the suite).

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions and manual verification checklist"
```

- [ ] **Step 5: Manual walkthrough (requires real credentials — not automatable)**

Populate `.env` with real ACLED, Anthropic, and Mapbox credentials, run `npm run dev`, and work through the "Manual verification checklist" in `README.md` above before considering the MVP done.
