import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function request(url: string) {
  return new Request(url);
}

describe("GET /api/country", () => {
  it("returns 400 when the name query parameter is missing", async () => {
    const response = await GET(request("http://localhost/api/country"));
    expect(response.status).toBe(400);
  });

  it("returns the extract from Wikipedia on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ extract: "France is a country in Western Europe." }),
    }) as unknown as typeof fetch;

    const response = await GET(request("http://localhost/api/country?name=France"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.extract).toBe("France is a country in Western Europe.");
  });

  it("returns extract: null when Wikipedia responds with a non-ok status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as unknown as typeof fetch;

    const response = await GET(request("http://localhost/api/country?name=Nowhereland"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.extract).toBeNull();
  });

  it("returns extract: null when the fetch throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network error"));

    const response = await GET(request("http://localhost/api/country?name=France"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.extract).toBeNull();
  });
});
