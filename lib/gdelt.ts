import { makeEventId } from "./ids";
import { getCountryCentroid } from "./countryCentroids";
import { canonicalCountryName } from "./countryNames";
import type { ConflictEvent } from "./types";

const GDELT_GEO_ENDPOINT = "https://api.gdeltproject.org/api/v2/geo/geo";
const GDELT_DOC_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";

const QUERY =
  "(war OR conflict OR attack OR strike OR clash OR airstrike OR shelling OR " +
  "earthquake OR flood OR hurricane OR wildfire OR famine OR drought OR " +
  "outbreak OR epidemic OR pandemic OR evacuation OR humanitarian crisis)";

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

type GdeltDocArticle = {
  url: string;
  title: string;
  seendate: string;
  sourcecountry: string;
};

type GdeltDocResponse = {
  articles: GdeltDocArticle[];
};

function extractHeadlineAndUrl(html: string): { headline: string; url: string } {
  const match = html.match(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/);
  if (!match) {
    return { headline: "Reported activity", url: "" };
  }
  return { url: match[1], headline: match[2] };
}

function parseGdeltDocDate(seendate: string): string {
  const match = seendate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!match) return new Date().toISOString();
  const [, y, mo, d, h, mi, s] = match;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
}

/**
 * Precise, city/region-level results. This is GDELT's primary geocoded feed,
 * but it has intermittently suffered infrastructure outages independent of
 * this app; fetchGdeltEvents() falls back to fetchGdeltDocEvents() when it's
 * unavailable.
 */
export async function fetchGdeltGeoEvents(): Promise<ConflictEvent[]> {
  const params = new URLSearchParams({
    query: QUERY,
    mode: "PointData",
    format: "GeoJSON",
    timespan: "24h",
  });

  const response = await fetch(`${GDELT_GEO_ENDPOINT}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`GDELT GEO request failed with status ${response.status}`);
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
        country: canonicalCountryName(
          feature.properties.name.split(",").pop()?.trim() ?? feature.properties.name,
        ),
        headline,
        source: "GDELT",
        sourceUrl: url,
        timestamp: new Date().toISOString(),
        severity: "medium",
        confidence: Math.min(95, 40 + count * 5),
      } satisfies ConflictEvent;
    });
}

/**
 * Fallback used when the GEO endpoint is down: article-level data with only
 * a source country, not a precise location, so events are plotted at that
 * country's centroid (approximate) and given a lower confidence score.
 * Articles whose country has no known centroid are dropped rather than
 * plotted incorrectly.
 */
export async function fetchGdeltDocEvents(): Promise<ConflictEvent[]> {
  const params = new URLSearchParams({
    query: QUERY,
    mode: "artlist",
    format: "json",
    maxrecords: "75",
    timespan: "1d",
  });

  const response = await fetch(`${GDELT_DOC_ENDPOINT}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`GDELT DOC request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GdeltDocResponse;

  return payload.articles
    .map((article): ConflictEvent | null => {
      const country = canonicalCountryName(article.sourcecountry);
      const centroid = getCountryCentroid(country);
      if (!centroid) return null;

      return {
        id: makeEventId("GDELT-DOC", article.url),
        lat: centroid.lat,
        lng: centroid.lng,
        locationName: country,
        country,
        headline: article.title,
        source: "GDELT",
        sourceUrl: article.url,
        timestamp: parseGdeltDocDate(article.seendate),
        severity: "medium",
        confidence: 35,
      };
    })
    .filter((event): event is ConflictEvent => event !== null);
}

export async function fetchGdeltEvents(): Promise<ConflictEvent[]> {
  try {
    return await fetchGdeltGeoEvents();
  } catch (error) {
    console.warn("GDELT GEO fetch failed, falling back to DOC API:", error);
    return await fetchGdeltDocEvents();
  }
}
