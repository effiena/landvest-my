import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function extractData(text: string) {
  const priceMatch = text.match(/RM\s?[\d,.]+/i);
  const ekarMatch = text.match(/(\d+(\.\d+)?)\s*ekar/i);
  const phoneMatch = text.match(/(\+?6?01[0-9\- ]{7,})/);

  return {
    title: text.split("\n")[0].slice(0, 80),
    location: text.match(/📍.*|Location:.*|Jalan.*|Sungai.*|Langkawi.*|Johor.*|Selangor.*/i)?.[0] || "Unknown",
    state: "Malaysia",
    acreage: ekarMatch ? parseFloat(ekarMatch[1]) : 0,
    price: priceMatch ? priceMatch[0] : "N/A",
    description: text.slice(0, 500),
    whatsapp: phoneMatch ? phoneMatch[0].replace(/[^\d]/g, "") : "",
  };
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    const data = extractData(text);

    const land = await prisma.land.create({
      data,
    });

    return NextResponse.json({ success: true, land });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Import failed" },
      { status: 500 }
    );
  }
}
