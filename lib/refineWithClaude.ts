import Anthropic from "@anthropic-ai/sdk";
import type { ConflictEvent, Severity } from "./types";

const MAX_EVENTS_TO_REFINE = 60;

function isValidConflictEvent(value: unknown): value is ConflictEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Check all required string fields
  if (typeof obj.id !== "string") return false;
  if (typeof obj.locationName !== "string") return false;
  if (typeof obj.country !== "string") return false;
  if (typeof obj.headline !== "string") return false;
  if (typeof obj.source !== "string") return false;
  if (typeof obj.sourceUrl !== "string") return false;
  if (typeof obj.timestamp !== "string") return false;

  // Check lat and lng are finite numbers within valid geographic range
  if (
    typeof obj.lat !== "number" ||
    !Number.isFinite(obj.lat) ||
    obj.lat < -90 ||
    obj.lat > 90
  ) {
    return false;
  }
  if (
    typeof obj.lng !== "number" ||
    !Number.isFinite(obj.lng) ||
    obj.lng < -180 ||
    obj.lng > 180
  ) {
    return false;
  }

  // Check confidence is a number
  if (typeof obj.confidence !== "number") return false;

  // Check severity is one of the valid values
  const validSeverities: Severity[] = ["low", "medium", "high", "critical"];
  if (!validSeverities.includes(obj.severity as Severity)) {
    return false;
  }

  return true;
}

export async function refineWithClaude(events: ConflictEvent[]): Promise<ConflictEvent[]> {
  if (events.length === 0) return events;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return events;
  }

  const toRefine = events.slice(0, MAX_EVENTS_TO_REFINE);
  const overflow = events.slice(MAX_EVENTS_TO_REFINE);

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 16000,
      messages: [{ role: "user", content: buildPrompt(toRefine) }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.warn("Claude refinement fell back to raw events: no text block in response");
      return events;
    }

    const jsonText = extractJson(textBlock.text);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      const repaired = repairTruncatedJsonArray(jsonText);
      if (!repaired) {
        console.warn(
          "Claude refinement fell back to raw events: failed to parse JSON response (likely truncated, no complete elements found)",
        );
        return events;
      }
      try {
        parsed = JSON.parse(repaired);
        console.warn(
          "Claude refinement response was truncated; recovered the complete leading elements and kept the raw (untranslated) version of the rest",
        );
      } catch (error) {
        console.warn(
          "Claude refinement fell back to raw events: failed to parse JSON response even after truncation repair",
          error,
        );
        return events;
      }
    }

    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every(isValidConflictEvent)) {
      console.warn(
        "Claude refinement fell back to raw events: response was not a valid non-empty array of ConflictEvents",
      );
      return events;
    }

    const refined = parsed as ConflictEvent[];
    const refinedIds = new Set(refined.map((e) => e.id));
    const notRefined = toRefine.filter((e) => !refinedIds.has(e.id));

    return [...refined, ...notRefined, ...overflow];
  } catch (error) {
    console.warn("Claude refinement fell back to raw events:", error);
    return events;
  }
}

function buildPrompt(events: ConflictEvent[]): string {
  return [
    "You are deduplicating and refining conflict event reports for a live news feed.",
    "Below is a JSON array of events, possibly containing near-duplicates describing the same incident from different sources.",
    "Merge near-duplicates into a single entry (keep the more specific location/headline), write each headline as one concise sentence IN BRAZILIAN PORTUGUESE (translate if the source is in another language), and set severity to one of low/medium/high/critical and confidence to a 0-100 integer reflecting how corroborated the event is.",
    "Return ONLY a JSON array of objects with exactly these fields: id, lat, lng, locationName, country, headline, source, sourceUrl, timestamp, severity, confidence. No prose, no markdown fences.",
    "",
    JSON.stringify(events),
  ].join("\n");
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) return fenceMatch[1];

  // No closing fence found — the response was likely truncated mid-output.
  // Still strip a leading opening fence if present, so the repair step below
  // sees the raw (incomplete) JSON array rather than the fence marker.
  const openFenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*)$/);
  return openFenceMatch ? openFenceMatch[1] : trimmed;
}

/**
 * Best-effort recovery for a JSON array truncated mid-element (e.g. hit
 * max_tokens). Cuts back to the last complete "},{" boundary and closes the
 * array, dropping only the incomplete trailing element.
 */
function repairTruncatedJsonArray(text: string): string | null {
  const lastCompleteObjectEnd = text.lastIndexOf("},");
  if (lastCompleteObjectEnd === -1) return null;
  return `${text.slice(0, lastCompleteObjectEnd + 1)}]`;
}
