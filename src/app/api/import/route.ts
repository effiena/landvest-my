import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function extractData(text: string) {
  const priceMatch = text.match(/RM\s?[\d,.]+/i);
  const ekarMatch = text.match(/(\d+(\.\d+)?)\s*ekar/i);
  const phoneMatch = text.match(/(\+?6?01[0-9\- ]{7,})/);

  return {
    title: text.split("\n")[0].slice(0, 80),
    location:
      text.match(
        /📍.*|Location:.*|Jalan.*|Sungai.*|Langkawi.*|Johor.*|Selangor.*/i
      )?.[0] || "Unknown",
    state: "Malaysia",
    acreage: ekarMatch ? parseFloat(ekarMatch[1]) : 0,
    price: priceMatch ? priceMatch[0] : "N/A",
    description: text.slice(0, 500),
    whatsapp: phoneMatch
      ? phoneMatch[0].replace(/[^\d]/g, "")
      : "",
  };
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { success: false, error: "Text is required" },
        { status: 400 }
      );
    }

    // Get logged-in agent from JWT cookie
    const cookieHeader = req.headers.get("cookie") || "";

    const token = cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let decoded: any;

    try {
      decoded = verifyToken(token);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const agentId = Number(decoded.id);

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: "Invalid agent" },
        { status: 401 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 401 }
      );
    }

    const data = extractData(text);

    const land = await prisma.land.create({
      data: {
        ...data,
        agentId,
      },
    });

    return NextResponse.json({
      success: true,
      land,
    });
  } catch (err) {
    console.error("Import failed:", err);

    return NextResponse.json(
      { success: false, error: "Import failed" },
      { status: 500 }
    );
  }
}
