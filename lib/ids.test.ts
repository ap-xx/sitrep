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
