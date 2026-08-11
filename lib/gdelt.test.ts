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
