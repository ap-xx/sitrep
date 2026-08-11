import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const EN_WIKI_API = "https://en.wikipedia.org/w/api.php";
const PT_WIKI_SUMMARY_ENDPOINT = "https://pt.wikipedia.org/api/rest_v1/page/summary/";

type CountrySummaryResponse = {
  name: string | null;
  extract: string | null;
};

type LangLinksPayload = {
  query?: {
    pages?: Array<{
      langlinks?: Array<{ lang: string; title: string }>;
    }>;
  };
};

async function resolvePortugueseTitle(englishName: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query",
    titles: englishName,
    prop: "langlinks",
    lllang: "pt",
    format: "json",
    formatversion: "2",
  });

  const response = await fetch(`${EN_WIKI_API}?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as LangLinksPayload;
  const title = payload.query?.pages?.[0]?.langlinks?.[0]?.title;
  return typeof title === "string" ? title : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Missing required 'name' query parameter" }, { status: 400 });
  }

  try {
    const ptTitle = await resolvePortugueseTitle(name);

    if (!ptTitle) {
      return NextResponse.json({ name: null, extract: null } satisfies CountrySummaryResponse);
    }

    const summaryResponse = await fetch(
      `${PT_WIKI_SUMMARY_ENDPOINT}${encodeURIComponent(ptTitle)}`,
      { headers: { Accept: "application/json" } },
    );

    if (!summaryResponse.ok) {
      return NextResponse.json({ name: ptTitle, extract: null } satisfies CountrySummaryResponse);
    }

    const summaryPayload = (await summaryResponse.json()) as { extract?: string };
    return NextResponse.json({
      name: ptTitle,
      extract: summaryPayload.extract ?? null,
    } satisfies CountrySummaryResponse);
  } catch (error) {
    console.warn("Wikipedia summary fetch failed:", error);
    return NextResponse.json({ name: null, extract: null } satisfies CountrySummaryResponse);
  }
}
