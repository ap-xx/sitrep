import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function request(url: string) {
  return new Request(url);
}

function mockLangLinksThenSummary(langLinksResponse: unknown, summaryResponse?: unknown) {
  const fn = vi.fn().mockResolvedValueOnce(langLinksResponse);
  if (summaryResponse) {
    fn.mockResolvedValueOnce(summaryResponse);
  }
  global.fetch = fn as unknown as typeof fetch;
}

describe("GET /api/country", () => {
  it("returns 400 when the name query parameter is missing", async () => {
    const response = await GET(request("http://localhost/api/country"));
    expect(response.status).toBe(400);
  });

  it("returns the Portuguese title and extract when a langlink and summary are found", async () => {
    mockLangLinksThenSummary(
      {
        ok: true,
        status: 200,
        json: async () => ({
          query: { pages: [{ langlinks: [{ lang: "pt", title: "França" }] }] },
        }),
      },
      {
        ok: true,
        status: 200,
        json: async () => ({ extract: "França é um país da Europa Ocidental." }),
      },
    );

    const response = await GET(request("http://localhost/api/country?name=France"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toBe("França");
    expect(body.extract).toBe("França é um país da Europa Ocidental.");
  });

  it("returns nulls when no Portuguese langlink exists", async () => {
    mockLangLinksThenSummary({
      ok: true,
      status: 200,
      json: async () => ({ query: { pages: [{}] } }),
    });

    const response = await GET(request("http://localhost/api/country?name=Nowhereland"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toBeNull();
    expect(body.extract).toBeNull();
  });

  it("returns the title with extract: null when the Portuguese summary request fails", async () => {
    mockLangLinksThenSummary(
      {
        ok: true,
        status: 200,
        json: async () => ({
          query: { pages: [{ langlinks: [{ lang: "pt", title: "França" }] }] },
        }),
      },
      { ok: false, status: 404 },
    );

    const response = await GET(request("http://localhost/api/country?name=France"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toBe("França");
    expect(body.extract).toBeNull();
  });

  it("returns nulls when the langlinks request fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

    const response = await GET(request("http://localhost/api/country?name=France"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toBeNull();
    expect(body.extract).toBeNull();
  });

  it("returns nulls when the fetch throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network error"));

    const response = await GET(request("http://localhost/api/country?name=France"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toBeNull();
    expect(body.extract).toBeNull();
  });
});
