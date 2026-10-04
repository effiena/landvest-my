import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SHARED_AREAS = [
  "Johor Bahru",
  "Permas Jaya",
  "Johor Jaya",
  "Ulu Tiram",
  "Plentong",
];

const WEST_AREAS = [
  "Iskandar Puteri",
  "Gelang Patah",
  "Skudai",
  "Senai",
  "Kulai",
  "Pontian",
  "Benut",
  "Rengit",
  "Batu Pahat",
  "Kluang",
  "Muar",
  "Tangkak",
  "Segamat",
];

const EAST_AREAS = [
  "Pasir Gudang",
  "Masai",
  "Kota Tinggi",
  "Bandar Penawar",
  "Desaru",
  "Pengerang",
  "Mersing",
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

async function findAgent(name: string) {
  return prisma.agent.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      ownerName,
      whatsapp,
      email,
      state,
      city,
      propertyAddress,
      propertyType,
      propertySize,
      expectedPrice,
      tenure,
      bumiStatus,
      additionalDetails,
      selectedAgentId,
    } = body;

    if (
      !ownerName?.trim() ||
      !whatsapp?.trim() ||
      !state?.trim() ||
      !city?.trim() ||
      !propertyAddress?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Owner name, WhatsApp, state, city and property address are required.",
        },
        { status: 400 }
      );
    }

    const cityNormalized = normalize(city);

    let assignedAgent: any = null;

    if (SHARED_AREAS.map(normalize).includes(cityNormalized)) {
      if (!selectedAgentId) {
        return NextResponse.json(
          { error: "Please choose an agent for this area." },
          { status: 400 }
        );
      }

      const yoori = await findAgent("Yoori");
      const della = await findAgent("Della");

      const allowedIds = [yoori?.id, della?.id].filter(Boolean);

      if (!allowedIds.includes(Number(selectedAgentId))) {
        return NextResponse.json(
          { error: "Invalid agent selection." },
          { status: 400 }
        );
      }

      assignedAgent = await prisma.agent.findUnique({
        where: { id: Number(selectedAgentId) },
      });
    } else if (WEST_AREAS.map(normalize).includes(cityNormalized)) {
      assignedAgent = await findAgent("Yoori");
    } else if (EAST_AREAS.map(normalize).includes(cityNormalized)) {
      assignedAgent = await findAgent("Della");
    }

    const enquiry = await prisma.wantToSell.create({
      data: {
        ownerName: ownerName.trim(),
        whatsapp: whatsapp.trim(),
        email: email?.trim() || null,
        state: state.trim(),
        city: city.trim(),
        propertyAddress: propertyAddress.trim(),
        propertyType: propertyType?.trim() || null,
        propertySize: propertySize?.trim() || null,
        expectedPrice: expectedPrice?.trim() || null,
        tenure: tenure?.trim() || null,
        bumiStatus: bumiStatus?.trim() || null,
        additionalDetails: additionalDetails?.trim() || null,
        assignedAgentId: assignedAgent?.id ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      id: enquiry.id,
      assignedAgent: assignedAgent?.name ?? null,
      message: assignedAgent
        ? `Your property enquiry has been submitted to ${assignedAgent.name}.`
        : "Your property enquiry has been submitted successfully.",
    });
  } catch (error) {
    console.error("Want To Sell error:", error);

    return NextResponse.json(
      {
        error: "Unable to submit your property details. Please try again.",
      },
      { status: 500 }
    );
  }
}
