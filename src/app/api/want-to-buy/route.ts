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
      buyerName,
      whatsapp,
      city,
      propertyType,
      requiredSize,
      budget,
      netIncome,
      creditCardBalance,
      monthlyLoanRepayment,
      ctosCcrisStatus,
      loanTenure,
      interestRate,
      maxDsr,
      availableMonthly,
      estimatedLoan,
      estimatedPropertyPrice,
      additionalRequirements,
      selectedAgentId,
    } = body;

    if (!buyerName?.trim() || !whatsapp?.trim() || !city?.trim()) {
      return NextResponse.json(
        { error: "Name, WhatsApp and preferred area are required." },
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

    if (!assignedAgent) {
      return NextResponse.json(
        { error: "We could not assign an agent for this area. Please contact us." },
        { status: 400 }
      );
    }

    const enquiry = await prisma.wantToBuy.create({
      data: {
        buyerName: buyerName.trim(),
        whatsapp: whatsapp.trim(),
        city: city.trim(),
        propertyType: propertyType?.trim() || null,
        requiredSize: requiredSize?.trim() || null,
        budget: budget?.trim() || null,
        // Store net income in the existing basicSalary database field.
        basicSalary:
          netIncome !== "" && netIncome != null
            ? Number(netIncome)
            : null,

        // Store total estimated existing monthly commitments.
        // Credit card commitment is estimated at 5% of outstanding balance.
        bankCommitment:
          (Number(creditCardBalance) || 0) * 0.05 +
          (Number(monthlyLoanRepayment) || 0),
        ctosCcrisStatus: ctosCcrisStatus?.trim() || null,
        loanTenure:
          loanTenure !== "" && loanTenure != null
            ? Number(loanTenure)
            : null,
        interestRate:
          interestRate !== "" && interestRate != null
            ? Number(interestRate)
            : null,
        maxDsr:
          maxDsr !== "" && maxDsr != null ? Number(maxDsr) : null,
        availableMonthly:
          availableMonthly !== "" && availableMonthly != null
            ? Number(availableMonthly)
            : null,
        estimatedLoan:
          estimatedLoan !== "" && estimatedLoan != null
            ? Number(estimatedLoan)
            : null,
        estimatedPropertyPrice:
          estimatedPropertyPrice !== "" && estimatedPropertyPrice != null
            ? Number(estimatedPropertyPrice)
            : null,
        additionalRequirements:
          additionalRequirements?.trim() || null,
        assignedAgentId: assignedAgent.id,
      },
    });

    return NextResponse.json({
      success: true,
      id: enquiry.id,
      assignedAgent: assignedAgent.name,
      message: `Your enquiry has been submitted to ${assignedAgent.name}.`,
    });
  } catch (error) {
    console.error("Want To Buy error:", error);

    return NextResponse.json(
      { error: "Unable to submit your enquiry. Please try again." },
      { status: 500 }
    );
  }
}
