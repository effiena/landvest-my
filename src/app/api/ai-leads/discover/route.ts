import { NextResponse } from "next/server";
import { requireYooriAI } from "@/lib/ai-lead-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_SCORE = 50;

const SEARCHES = [
  "WTB buyer wants to buy industrial land Johor Malaysia",
  "WTB development land buyer Sepang Dengkil KLIA Malaysia",
  "WTB buyer wants oil palm estate agricultural land Malaysia",
  "WTB house condominium property buyer Johor Malaysia",
];

type SearchResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
};

const BLOCKED_DOMAINS = [
  "propertygenie.com.my",
  "iproperty.com.my",
  "propertyguru.com.my",
  "mudah.my",
  "edgeprop.my",
  "theedgemalaysia.com",
  "bloomberg.com",
  "scmp.com",
  "malaysialand.com",
];

function analyseResult(result: SearchResult, query: string) {
  const title = (result.title || "").trim();
  const url = (result.url || "").trim();
  const excerpt = (result.content || "").trim().slice(0, 2500);

  if (!title || !url || !excerpt) return null;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  if (
    !["http:", "https:"].includes(parsedUrl.protocol) ||
    parsedUrl.username ||
    parsedUrl.password
  ) return null;

  const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");
  if (BLOCKED_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
    return null;
  }

  const text = `${title}\n${excerpt}`;
  const lower = text.toLowerCase();

  // Require direct buyer/agent-represented buyer intent; generic "looking for"
  // alone is insufficient because seller advertisements often use that phrase.
  const explicitIntent =
    /\b(wtb|want(?:s|ed)? to buy|looking to buy|seeking to acquire|buyer(?:s)?\s+(?:(?:is|are)\s+)?(?:actively\s+)?(?:looking|seeking|wants?\s+to buy)|client\s+(?:is\s+)?(?:actively\s+)?looking|serious buyer|genuine buyer|cash buyer|requirement for)\b/i.test(text);

  if (!explicitIntent) return null;

  // Reject generic articles and obvious inventory promotions.
  const informational =
    /\b(how to choose|site selection guide|approval process|everything you need to know|market outlook|property news|for auction|houses? for sale|properties for sale|browse properties|property portal)\b/i.test(
      `${title}\n${excerpt.slice(0, 700)}`
    );

  const sellerPromotion =
    /\b(our listings|we have (?:the following|various|many|available)|available now for sale|land available for sale|contact us to view our|browse our properties)\b/i.test(text);

  if (informational || sellerPromotion) return null;

  const propertyMatch =
    /\b(industrial land|industrial property|factory|warehouse|development land|commercial land|oil palm|plantation|agricultural land|residential|house|condominium|condo|high-rise|property|real estate)\b/i.test(text);

  if (!propertyMatch) return null;

  const locations = [
    ["Johor", /\bjohor\b/i],
    ["Sepang", /\bsepang\b/i],
    ["KLIA", /\bklia\b/i],
    ["Dengkil", /\bdengkil\b/i],
    ["Selangor", /\bselangor\b/i],
    ["Kajang", /\bkajang\b/i],
    ["Semenyih", /\bsemenyih\b/i],
  ] as const;

  const matchedLocation = locations.find(([, pattern]) => pattern.test(text));
  if (!matchedLocation) return null;

  const reasons = ["explicit buyer-intent wording", "property requirement identified", `target location: ${matchedLocation[0]}`];
  let score = 35 + 20 + 15;

  if (/\b(acres?|hectares?|hectare|sq\.?\s*ft|sqft|budget|rm\s?[\d,.]+|\d+\s?million|million|million ringgit)\b/i.test(text)) {
    score += 10;
    reasons.push("possible size or budget details");
  }

  if (typeof result.score === "number" && result.score >= 0.7) {
    score += 5;
    reasons.push("strong search relevance");
  }

  let propertyType = "Property";
  if (/industrial land|industrial property|factory|warehouse/i.test(lower)) propertyType = "Industrial";
  else if (/oil palm|plantation|agricultural land/i.test(lower)) propertyType = "Agricultural / Estate";
  else if (/development land/i.test(lower)) propertyType = "Development Land";
  else if (/commercial land/i.test(lower)) propertyType = "Commercial Land";
  else if (/residential|house|condominium|condo|high-rise/i.test(lower)) propertyType = "Residential";

  const sizeMatch = text.match(
    /\b\d[\d,.]*\s*(?:-\s*\d[\d,.]*\s*)?(?:acres?|hectares?|ha|sq\.?\s*ft|sqft|square feet)\b/i
  );

  return {
    title: title.slice(0, 200),
    url: parsedUrl.toString(),
    excerpt,
    score: Math.min(100, score),
    reasons,
    city: matchedLocation[0],
    propertyType,
    requiredSize: sizeMatch?.[0]?.slice(0, 120) || null,
    query,
  };
}

export async function POST() {
  try {
    const auth = await requireYooriAI();
    if (!auth.authorized) return auth.response;

    const apiKey = process.env.TAVILY_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Tavily is not configured. Add TAVILY_API_KEY to the server environment." },
        { status: 503 }
      );
    }

    const candidates = new Map<string, NonNullable<ReturnType<typeof analyseResult>>>();
    let searchesCompleted = 0;

    for (const query of SEARCHES) {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: "basic",
          max_results: 5,
          include_answer: false,
          include_raw_content: false,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        console.error("[AI Lead Discovery Preview] Provider status:", response.status);
        return NextResponse.json(
          { error: "Search provider request failed. Check the API key, quota and provider status." },
          { status: 502 }
        );
      }

      const payload = await response.json();
      const results: SearchResult[] = Array.isArray(payload.results) ? payload.results : [];
      searchesCompleted += 1;

      for (const result of results) {
        const item = analyseResult(result, query);
        if (!item || item.score < MIN_SCORE) continue;

        const existing = candidates.get(item.url);
        if (!existing || item.score > existing.score) {
          candidates.set(item.url, item);
        }
      }
    }

    const preview = [...candidates.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    // SAFETY: preview-only endpoint. Intentionally no Prisma import or database writes.
    return NextResponse.json({
      success: true,
      mode: "preview-only",
      saved: 0,
      searchesCompleted,
      candidatesFound: preview.length,
      candidates: preview,
      message: preview.length
        ? `Preview found ${preview.length} candidate(s). Nothing was saved. Verify the original posts before considering contact.`
        : "Search completed; no candidates met the strict preview criteria. Nothing was saved.",
    });
  } catch (error) {
    console.error("[AI Lead Discovery Preview] Scan error:", error);
    return NextResponse.json(
      { error: "Preview failed. Check server logs and Tavily configuration." },
      { status: 500 }
    );
  }
}
