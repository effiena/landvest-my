import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireYooriAI } from "@/lib/ai-lead-auth";

export const runtime = "nodejs";

const ALLOWED_STATUSES = ["pending", "approved", "dismissed"];

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireYooriAI();
    if (!auth.authorized) return auth.response;

    const { id } = await context.params;
    const leadId = Number(id);

    if (!Number.isInteger(leadId) || leadId <= 0) {
      return NextResponse.json({ error: "Invalid lead ID." }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const status = typeof body.status === "string" ? body.status.trim().toLowerCase() : "";
    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Status must be pending, approved, or dismissed." },
        { status: 400 }
      );
    }

    const reviewNotes =
      typeof body.reviewNotes === "string" ? body.reviewNotes.trim() : undefined;

    if (reviewNotes !== undefined && reviewNotes.length > 2000) {
      return NextResponse.json({ error: "Review notes cannot exceed 2000 characters." }, { status: 400 });
    }

    const existing = await prisma.discoveredLead.findUnique({ where: { id: leadId } });
    if (!existing) {
      return NextResponse.json({ error: "Lead candidate not found." }, { status: 404 });
    }

    const lead = await prisma.discoveredLead.update({
      where: { id: leadId },
      data: {
        status,
        reviewedAt: status === "pending" ? null : new Date(),
        ...(reviewNotes !== undefined ? { reviewNotes: reviewNotes || null } : {}),
      },
    });

    // Approval only updates the review status. It never sends outreach.
    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("[AI Leads] Review error:", error);
    return NextResponse.json({ error: "Unable to update lead review." }, { status: 500 });
  }
}
