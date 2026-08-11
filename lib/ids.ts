import { createHash } from "node:crypto";

export function makeEventId(source: string, rawId: string): string {
  return createHash("sha1").update(`${source}:${rawId}`).digest("hex").slice(0, 16);
}
