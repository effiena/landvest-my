import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const enquiryId = Number(id);

    if (!Number.isInteger(enquiryId)) {
      return NextResponse.json(
        { error: "Invalid enquiry ID." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const status = String(body.status || "").trim();

    if (!["new", "contacted", "closed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid enquiry status." },
        { status: 400 }
      );
    }

    const enquiry = await prisma.wantToSell.update({
      where: { id: enquiryId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      enquiry,
    });
  } catch (error) {
    console.error("Want To Sell status update error:", error);

    return NextResponse.json(
      { error: "Unable to update owner enquiry status." },
      { status: 500 }
    );
  }
}
