import Anthropic from "@anthropic-ai/sdk";
import type { ConflictEvent } from "./types";

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

    if (!Array.isArray(parsed) || parsed.length === 0) {
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
