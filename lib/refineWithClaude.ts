import Anthropic from "@anthropic-ai/sdk";
import type { ConflictEvent, Severity } from "./types";

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

  // Check lat and lng are numbers
  if (typeof obj.lat !== "number") return false;
  if (typeof obj.lng !== "number") return false;

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

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: buildPrompt(events) }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return events;
    }

    const parsed = JSON.parse(extractJson(textBlock.text)) as ConflictEvent[];

    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every(isValidConflictEvent)) {
      return events;
    }

    return parsed;
  } catch {
    return events;
  }
}

function buildPrompt(events: ConflictEvent[]): string {
  return [
    "You are deduplicating and refining conflict event reports for a live news feed.",
    "Below is a JSON array of events, possibly containing near-duplicates describing the same incident from different sources.",
    "Merge near-duplicates into a single entry (keep the more specific location/headline), write each headline as one concise sentence, and set severity to one of low/medium/high/critical and confidence to a 0-100 integer reflecting how corroborated the event is.",
    "Return ONLY a JSON array of objects with exactly these fields: id, lat, lng, locationName, country, headline, source, sourceUrl, timestamp, severity, confidence. No prose, no markdown fences.",
    "",
    JSON.stringify(events),
  ].join("\n");
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}
