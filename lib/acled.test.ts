import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAcledEvents } from "./acled";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

function mockTokenThenRead(readResponse: unknown) {
  global.fetch = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ access_token: "test-access-token" }),
    })
    .mockResolvedValueOnce(readResponse) as unknown as typeof fetch;
}

describe("fetchAcledEvents", () => {
  it("throws when credentials are missing", async () => {
    vi.stubEnv("ACLED_EMAIL", "");
    vi.stubEnv("ACLED_PASSWORD", "");
    await expect(fetchAcledEvents()).rejects.toThrow(/ACLED_EMAIL/);
  });

  it("throws when the OAuth token request fails", async () => {
    vi.stubEnv("ACLED_EMAIL", "test@example.com");
    vi.stubEnv("ACLED_PASSWORD", "test-password");

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    }) as unknown as typeof fetch;

    await expect(fetchAcledEvents()).rejects.toThrow(/OAuth token request failed/);
  });

  it("throws when the OAuth token response has no access_token", async () => {
    vi.stubEnv("ACLED_EMAIL", "test@example.com");
    vi.stubEnv("ACLED_PASSWORD", "test-password");

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    await expect(fetchAcledEvents()).rejects.toThrow(/missing access_token/);
  });

  it("normalizes a successful response into ConflictEvent[]", async () => {
    vi.stubEnv("ACLED_EMAIL", "test@example.com");
    vi.stubEnv("ACLED_PASSWORD", "test-password");

    mockTokenThenRead({
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
    });

    const events = await fetchAcledEvents();

    expect(events).toHaveLength(1);
    expect(events[0].locationName).toBe("Al Mokha");
    expect(events[0].country).toBe("Yemen");
    expect(events[0].severity).toBe("medium");
    expect(events[0].source).toBe("ACLED");
  });

  it("throws when the HTTP response is not ok", async () => {
    vi.stubEnv("ACLED_EMAIL", "test@example.com");
    vi.stubEnv("ACLED_PASSWORD", "test-password");

    mockTokenThenRead({
      ok: false,
      status: 500,
    });

    await expect(fetchAcledEvents()).rejects.toThrow(/status 500/);
  });

  it("throws when ACLED response reports success: false", async () => {
    vi.stubEnv("ACLED_EMAIL", "test@example.com");
    vi.stubEnv("ACLED_PASSWORD", "test-password");

    mockTokenThenRead({
      ok: true,
      status: 200,
      json: async () => ({ success: false, data: [] }),
    });

    await expect(fetchAcledEvents()).rejects.toThrow(/failure/);
  });
});
