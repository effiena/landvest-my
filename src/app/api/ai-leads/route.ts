import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireYooriAI } from "@/lib/ai-lead-auth";

export const runtime = "nodejs";

const MAX_EXCERPT_LENGTH = 5000;

export async function GET(req: NextRequest) {
  try {
    const auth = await requireYooriAI();
    if (!auth.authorized) return auth.response;

    const requestedStatus = req.nextUrl.searchParams.get("status") || "pending";
    const allowedStatuses = ["pending", "approved", "dismissed", "all"];

    if (!allowedStatuses.includes(requestedStatus)) {
      return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
    }

    const rawLimit = Number(req.nextUrl.searchParams.get("limit") || 50);
    const limit = Number.isInteger(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 50;

    const leads = await prisma.discoveredLead.findMany({
      where: requestedStatus === "all" ? {} : { status: requestedStatus },
      orderBy: [{ leadScore: "desc" }, { discoveredAt: "desc" }],
      take: limit,
    });

    return NextResponse.json({ success: true, leads, count: leads.length });
  } catch (error) {
    console.error("[AI Leads] List error:", error);
    return NextResponse.json({ error: "Unable to load discovered leads." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireYooriAI();
    if (!auth.authorized) return auth.response;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const sourceName = typeof body.sourceName === "string" ? body.sourceName.trim() : "";
    const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
    const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : null;

    if (!sourceName || sourceName.length > 200) {
      return NextResponse.json({ error: "Source name is required (maximum 200 characters)." }, { status: 400 });
    }

    if (!sourceUrl || sourceUrl.length > 2048) {
      return NextResponse.json({ error: "A valid public source URL is required." }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      return NextResponse.json({ error: "Invalid source URL." }, { status: 400 });
    }

    if (
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      parsedUrl.username ||
      parsedUrl.password ||
      ["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname.toLowerCase())
    ) {
      return NextResponse.json({ error: "Only public HTTP or HTTPS source URLs are allowed." }, { status: 400 });
    }

    if (excerpt && excerpt.length > MAX_EXCERPT_LENGTH) {
      return NextResponse.json({ error: "Excerpt is too long (maximum 5000 characters)." }, { status: 400 });
    }

    const optionalText = (value: unknown, max: number) =>
      typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

    const optionalBudget = (value: unknown) => {
      if (value === null || value === undefined || value === "") return null;
      const n = Number(value);
      return Number.isFinite(n) && n >= 0 ? n : NaN;
    };

    const budgetMin = optionalBudget(body.budgetMin);
    const budgetMax = optionalBudget(body.budgetMax);

    if (Number.isNaN(budgetMin) || Number.isNaN(budgetMax)) {
      return NextResponse.json({ error: "Budgets must be non-negative numbers." }, { status: 400 });
    }

    if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) {
      return NextResponse.json({ error: "Minimum budget cannot exceed maximum budget." }, { status: 400 });
    }

    const score = body.leadScore === undefined ? 0 : Number(body.leadScore);
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      return NextResponse.json({ error: "Lead score must be an integer from 0 to 100." }, { status: 400 });
    }

    const lead = await prisma.discoveredLead.create({
      data: {
        sourceName,
        sourceUrl: parsedUrl.toString(),
        excerpt: excerpt || null,
        city: optionalText(body.city, 120),
        propertyType: optionalText(body.propertyType, 120),
        budgetMin,
        budgetMax,
        requiredSize: optionalText(body.requiredSize, 120),
        leadScore: score,
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "This source URL has already been saved." }, { status: 409 });
    }

    console.error("[AI Leads] Create error:", error);
    return NextResponse.json({ error: "Unable to save lead candidate." }, { status: 500 });
  }
}
