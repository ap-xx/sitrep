import { makeEventId } from "./ids";
import type { ConflictEvent } from "./types";

const ACLED_TOKEN_ENDPOINT = "https://acleddata.com/oauth/token";
const ACLED_READ_ENDPOINT = "https://acleddata.com/api/acled/read";

type AcledTokenResponse = {
  access_token?: string;
};

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

async function fetchAcledAccessToken(email: string, password: string): Promise<string> {
  const body = new URLSearchParams({
    username: email,
    password,
    grant_type: "password",
    client_id: "acled",
    scope: "authenticated",
  });

  const response = await fetch(ACLED_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`ACLED OAuth token request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as AcledTokenResponse;

  if (!payload.access_token) {
    throw new Error("ACLED OAuth token response missing access_token");
  }

  return payload.access_token;
}

export async function fetchAcledEvents(): Promise<ConflictEvent[]> {
  const email = process.env.ACLED_EMAIL;
  const password = process.env.ACLED_PASSWORD;

  if (!email || !password) {
    throw new Error("ACLED_EMAIL and ACLED_PASSWORD must be set");
  }

  const accessToken = await fetchAcledAccessToken(email, password);

  const params = new URLSearchParams({
    _format: "json",
    event_date: last24HoursDate(),
    event_date_where: ">=",
    limit: "100",
  });

  const response = await fetch(`${ACLED_READ_ENDPOINT}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

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
