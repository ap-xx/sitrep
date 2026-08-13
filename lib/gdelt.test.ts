import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchGdeltEvents, fetchGdeltGeoEvents, fetchGdeltDocEvents } from "./gdelt";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function geoResponse(features: unknown[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ type: "FeatureCollection", features }),
  };
}

const sampleGeoFeature = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [43.25, 13.05] },
  properties: {
    name: "Al Mokha, Yemen",
    count: 4,
    html: '<a href="https://news.example.com/a1">Cargo vessel struck off Yemen coast</a>',
  },
};

function docResponse(articles: unknown[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ articles }),
  };
}

const sampleDocArticle = {
  url: "https://news.example.com/doc1",
  title: "Clashes reported near border",
  seendate: "20260813T024500Z",
  sourcecountry: "Yemen",
};

describe("fetchGdeltGeoEvents", () => {
  it("normalizes a successful GeoJSON response, extracting headline and url from html", async () => {
    global.fetch = vi.fn().mockResolvedValue(geoResponse([sampleGeoFeature])) as unknown as typeof fetch;

    const events = await fetchGdeltGeoEvents();

    expect(events).toHaveLength(1);
    expect(events[0].lat).toBe(13.05);
    expect(events[0].lng).toBe(43.25);
    expect(events[0].headline).toBe("Cargo vessel struck off Yemen coast");
    expect(events[0].sourceUrl).toBe("https://news.example.com/a1");
    expect(events[0].source).toBe("GDELT");
  });

  it("falls back to a generic headline when the html has no anchor tag", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      geoResponse([
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [10, 20] },
          properties: { name: "Somewhere", count: 1, html: "<b>no link here</b>" },
        },
      ]),
    ) as unknown as typeof fetch;

    const events = await fetchGdeltGeoEvents();

    expect(events[0].headline).toBe("Reported activity");
    expect(events[0].sourceUrl).toBe("");
  });

  it("throws when the HTTP response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

    await expect(fetchGdeltGeoEvents()).rejects.toThrow(/GEO request failed with status 500/);
  });
});

describe("fetchGdeltDocEvents", () => {
  it("normalizes articles, plotting them at their source country's centroid", async () => {
    global.fetch = vi.fn().mockResolvedValue(docResponse([sampleDocArticle])) as unknown as typeof fetch;

    const events = await fetchGdeltDocEvents();

    expect(events).toHaveLength(1);
    expect(events[0].country).toBe("Yemen");
    expect(events[0].headline).toBe("Clashes reported near border");
    expect(events[0].sourceUrl).toBe("https://news.example.com/doc1");
    expect(events[0].timestamp).toBe("2026-08-13T02:45:00Z");
    expect(events[0].confidence).toBe(35);
  });

  it("drops articles whose source country has no known centroid", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      docResponse([{ ...sampleDocArticle, sourcecountry: "Atlantis" }]),
    ) as unknown as typeof fetch;

    const events = await fetchGdeltDocEvents();

    expect(events).toHaveLength(0);
  });

  it("throws when the HTTP response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

    await expect(fetchGdeltDocEvents()).rejects.toThrow(/DOC request failed with status 500/);
  });
});

describe("fetchGdeltEvents (orchestration)", () => {
  it("returns GEO results without touching DOC when GEO succeeds", async () => {
    const fetchMock = vi.fn().mockResolvedValue(geoResponse([sampleGeoFeature]));
    global.fetch = fetchMock as unknown as typeof fetch;

    const events = await fetchGdeltEvents();

    expect(events).toHaveLength(1);
    expect(events[0].source).toBe("GDELT");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to DOC results when GEO fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce(docResponse([sampleDocArticle]));
    global.fetch = fetchMock as unknown as typeof fetch;

    const events = await fetchGdeltEvents();

    expect(events).toHaveLength(1);
    expect(events[0].headline).toBe("Clashes reported near border");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws when both GEO and DOC fail", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

    await expect(fetchGdeltEvents()).rejects.toThrow(/DOC request failed with status 500/);
  });
});
