import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    // =========================
    // Parse Request Body
    // =========================
    const body = await req.json();

    const {
      title,
      location,
      state,
      acreage,
      price,
      whatsapp,
      description,
      images = [],
    } = body;

    // =========================
    // Basic Validation
    // =========================
    if (
      !title ||
      !location ||
      !state ||
      !price ||
      !whatsapp
    ) {
      return NextResponse.json(
        {
          error: "Please fill in all required fields.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // Get Login Token
    // =========================
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // =========================
    // Verify JWT
    // =========================
    let decoded: any;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "dev_secret_key"
      );
    } catch {
      return NextResponse.json(
        {
          error: "Invalid or expired session.",
        },
        {
          status: 401,
        }
      );
    }

    const agentId = decoded.id;

    // =========================
    // Find Agent
    // =========================
    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
      },
      include: {
        listings: true,
      },
    });

    if (!agent) {
      return NextResponse.json(
        {
          error: "Agent not found.",
        },
        {
          status: 404,
        }
      );
    }

    // =========================
    // Subscription Limits
    // =========================
    const listingLimit =
      agent.plan === "professional" ? 10 : 3;

    const photoLimit =
      agent.plan === "professional" ? 20 : 5;

    if (agent.listings.length >= listingLimit) {
      return NextResponse.json(
        {
          error:
            "You have reached your listing limit. Please upgrade your subscription.",
        },
        {
          status: 403,
        }
      );
    }

    if (images.length > photoLimit) {
      return NextResponse.json(
        {
          error: `Maximum ${photoLimit} photos allowed for your current plan.`,
        },
        {
          status: 403,
        }
      );
    }

    // =========================
    // Create Listing
    // =========================
    const land = await prisma.land.create({
      data: {
        agentId,

        title: title.trim(),
        location: location.trim(),
        state: state.trim(),

        acreage: Number(acreage) || 0,

        price: price.trim(),

        whatsapp: whatsapp.trim(),

        description: description?.trim() || "",

        images: {
          create: images.map(
            (url: string, index: number) => ({
              url,
              isCover: index === 0,
            })
          ),
        },
      },

      include: {
        images: true,
      },
    });

    // =========================
    // Success
    // =========================
    return NextResponse.json(
      {
        success: true,
        message: "Listing created successfully.",
        land,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Create Listing Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
