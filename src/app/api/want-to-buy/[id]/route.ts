import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = ["new", "contacted", "closed"];

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let decoded: any;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "dev_secret_key"
      );
    } catch {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const enquiryId = Number(id);

    if (!Number.isInteger(enquiryId)) {
      return NextResponse.json(
        { error: "Invalid enquiry ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const status = String(body.status || "").toLowerCase();

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const enquiry = await prisma.wantToBuy.findUnique({
      where: {
        id: enquiryId,
      },
    });

    if (!enquiry) {
      return NextResponse.json(
        { error: "Enquiry not found" },
        { status: 404 }
      );
    }

    // Only the assigned agent can update this enquiry.
    if (enquiry.assignedAgentId !== Number(decoded.id)) {
      return NextResponse.json(
        { error: "You are not authorized to update this enquiry." },
        { status: 403 }
      );
    }

    const updated = await prisma.wantToBuy.update({
      where: {
        id: enquiryId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json({
      success: true,
      enquiry: updated,
    });
  } catch (error) {
    console.error("Want To Buy status update error:", error);

    return NextResponse.json(
      {
        error: "Unable to update enquiry status.",
      },
      { status: 500 }
    );
  }
}
