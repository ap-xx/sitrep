import { describe, expect, it } from "vitest";
import { getCountryCentroid } from "./countryCentroids";

describe("getCountryCentroid", () => {
  it("returns coordinates for a known country", () => {
    expect(getCountryCentroid("Yemen")).toEqual({ lat: 15.6, lng: 48.5 });
  });

  it("trims surrounding whitespace before lookup", () => {
    expect(getCountryCentroid("  Yemen  ")).toEqual({ lat: 15.6, lng: 48.5 });
  });

  it("returns null for an unknown country", () => {
    expect(getCountryCentroid("Atlantis")).toBeNull();
  });
});
