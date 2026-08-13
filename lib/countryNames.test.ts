import { describe, expect, it } from "vitest";
import { canonicalCountryName } from "./countryNames";

describe("canonicalCountryName", () => {
  it("expands a known abbreviation to the full name", () => {
    expect(canonicalCountryName("DRC")).toBe("Democratic Republic of the Congo");
  });

  it("is case-insensitive", () => {
    expect(canonicalCountryName("usa")).toBe("United States of America");
    expect(canonicalCountryName("Usa")).toBe("United States of America");
  });

  it("passes through an already-canonical or unrecognized name unchanged", () => {
    expect(canonicalCountryName("Yemen")).toBe("Yemen");
    expect(canonicalCountryName("Atlantis")).toBe("Atlantis");
  });

  it("trims surrounding whitespace", () => {
    expect(canonicalCountryName("  UK  ")).toBe("United Kingdom");
  });
});
