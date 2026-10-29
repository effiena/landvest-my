import { NextResponse } from "next/server";
import { requireYooriAI } from "@/lib/ai-lead-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_SCORE = 50;

const SEARCHES = [
  "WTB buyer wants to buy industrial land Johor Malaysia",
  '"looking to acquire" industrial land factory warehouse Johor',
  '"mencari tanah industri" OR "nak beli tanah industri" Johor',
  "WTB buyer wants oil palm estate agricultural land Malaysia",
  '"mencari tanah pertanian" OR "nak beli tanah kebun" Johor',
  "WTB development land buyer Sepang Dengkil KLIA Malaysia",
  '"looking to acquire land" KLIA Sepang Dengkil',
  '"mencari tanah untuk pembangunan" Sepang Selangor',
  "WTB commercial land property investment Johor Malaysia",
  "WTB house condominium residential property buyer Johor Malaysia",
  '"mencari rumah untuk dibeli" Johor',
  '"买地" OR "买房" Johor Malaysia property buyer',
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

  // Exclude property professionals and agent-sourced client requests.
  const agentIndicators =
    /\b(property agent|real estate agent|estate agent|property negotiator|real estate negotiator|registered estate agent|property consultant|realty agent|ejen hartanah|perunding hartanah|my clients?|our clients?|i have (?:a|an|many|several) clients?|clients? (?:is|are) looking|clients? seeking|listing agent|REN\s*#?\s*\d{3,})\b/i;

  const selfIdentifiedAgent =
    /\b(?:i am|i'm|we are|as a)\s+(?:a\s+)?(?:property|real estate|estate)\s+(?:agent|negotiator|consultant)\b/i;

  if (agentIndicators.test(text) || selfIdentifiedAgent.test(text)) return null;

  // Reject educational and SEO pages even when they mention buyers or budgets.
  const articleTitle =
    /\b(complete playbook|playbook|buying guide|buyers? guide|guide to buying|how to buy|how to choose|everything you need to know|ultimate guide|step-by-step guide|frequently asked questions|faq|market outlook|market report|property news|investment guide|property investment guide|foreign ownership rules|cost of buying|buying property as a|can foreigners buy|tips for buying)\b/i;

  const educationalContent =
    /\b(schema-ready|ai-quotable summary|frequently asked questions|in this guide|this guide explains|complete guide|buying guide|buyers? guide|ultimate guide|market outlook|market report|property news)\b/i;

  const earlyText = `${title}\n${excerpt.slice(0, 1200)}`;

  const informational =
    articleTitle.test(title) ||
    educationalContent.test(text) ||
    /\b(site selection guide|approval process|browse properties|property portal|for auction|houses? for sale|properties for sale)\b/i.test(earlyText);

  if (informational) return null;

  // Require an explicit purchase/search request.
  // "Cash buyer" or "serious buyer" alone is not sufficient evidence.
  const directBuyerIntent =
    /\b(wtb|want(?:s|ed)? to buy|looking to buy|looking to acquire|seeking to acquire|actively seeking to (?:buy|acquire)|need(?:s)? to buy|serious buyer.{0,50}(?:looking for|seeking|want(?:s)? to buy|need(?:s)? to buy)|genuine buyer.{0,50}(?:looking for|seeking|want(?:s)? to buy)|mencari untuk membeli|nak beli|ingin membeli|sedang mencari)\b|买地|买房/i.test(text);

  if (!directBuyerIntent) return null;

  const sellerPromotion =
    /\b(our listings|we have (?:the following|various|many|available)|available now for sale|land available for sale|contact us to view our|browse our properties)\b/i.test(text);

  if (sellerPromotion) return null;

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
    buyerType: /\b(company|corporate|developer|investment company|s\.?d\.?n\.?\s*bhd|berhad|investor|investment fund)\b/i.test(text)
      ? "Company / Investor (unverified)"
      : "Individual Buyer (unverified)",
    buyerConfidence: Math.min(
      95,
      60 +
      ( /\b(wtb|want(?:s|ed)? to buy|looking to buy|seeking to acquire|serious buyer|genuine buyer|cash buyer)\b/i.test(text) ? 15 : 0 ) +
      ( /\b(?:budget|rm\s?[\d,.]+|\d+\s?million|acres?|hectares?|sqft)\b/i.test(text) ? 10 : 0 )
    ),
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

    let searchesFailed = 0;

    // Four concurrent searches per batch; keep within the route time limit.
    for (let i = 0; i < SEARCHES.length; i += 4) {
      const batch = SEARCHES.slice(i, i + 4);

      const batchResults = await Promise.all(batch.map(async (query) => {
        try {
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
            return { query, results: [] as SearchResult[], failed: true };
          }

          const payload = await response.json();
          return {
            query,
            results: Array.isArray(payload.results) ? payload.results as SearchResult[] : [],
            failed: false,
          };
        } catch (error) {
          console.error("[AI Lead Discovery Preview] Search failed:", query, error);
          return { query, results: [] as SearchResult[], failed: true };
        }
      }));

      for (const batchResult of batchResults) {
        if (batchResult.failed) {
          searchesFailed += 1;
          continue;
        }

        searchesCompleted += 1;

        for (const result of batchResult.results) {
          const item = analyseResult(result, batchResult.query);
          if (!item || item.score < MIN_SCORE) continue;

          const existing = candidates.get(item.url);
          if (!existing || item.score > existing.score) {
            candidates.set(item.url, item);
          }
        }
      }
    }

    if (searchesCompleted === 0) {
      return NextResponse.json(
        { error: "All search requests failed. Check Tavily quota, API key and provider status." },
        { status: 502 }
      );
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
      searchesFailed,
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
