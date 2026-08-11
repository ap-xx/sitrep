import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const WIKI_SUMMARY_ENDPOINT = "https://en.wikipedia.org/api/rest_v1/page/summary/";

type CountrySummaryResponse = {
  extract: string | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Missing required 'name' query parameter" }, { status: 400 });
  }

  try {
    const response = await fetch(`${WIKI_SUMMARY_ENDPOINT}${encodeURIComponent(name)}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return NextResponse.json({ extract: null } satisfies CountrySummaryResponse);
    }

    const payload = (await response.json()) as { extract?: string };
    return NextResponse.json({
      extract: payload.extract ?? null,
    } satisfies CountrySummaryResponse);
  } catch (error) {
    console.warn("Wikipedia summary fetch failed:", error);
    return NextResponse.json({ extract: null } satisfies CountrySummaryResponse);
  }
}
