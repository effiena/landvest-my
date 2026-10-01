import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = body.name?.trim();
    const agency = body.agency?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const requestedPlan = body.plan?.toLowerCase();

    console.log("Registration field check:", {
      hasName: Boolean(name),
      hasAgency: Boolean(agency),
      hasEmail: Boolean(email),
      hasPassword: Boolean(password),
      requestedPlan: requestedPlan || "(missing)",
    });

    if (!name || !agency || !email || !password || !requestedPlan) {
      return NextResponse.json(
        {
          error:
            "Name, agency, email, password and membership plan are required.",
        },
        { status: 400 }
      );
    }

    if (!["starter", "professional"].includes(requestedPlan)) {
      return NextResponse.json(
        {
          error: "Please select Starter or Professional.",
        },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          error: "Please enter your full name.",
        },
        { status: 400 }
      );
    }

    if (agency.length < 2) {
      return NextResponse.json(
        {
          error: "Please enter your agency name.",
        },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          error: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error: "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.agent.findUnique({
      where: {
        email,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "Email already registered.",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Every newly registered account starts as Starter.
    // Professional access is granted only after Stripe payment succeeds.
    const agent = await prisma.agent.create({
      data: {
        name,
        agency,
        email,
        password: hashedPassword,

        plan: "starter",
        listingLimit: 2,
        extraListings: 0,
        role: "agent",

        // Temporary: skip WhatsApp OTP verification.
        emailVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        requestedPlan === "professional"
          ? "Account created. Continue to Stripe Checkout."
          : "Registration successful.",
      selectedPlan: requestedPlan,
      agent: {
        id: agent.id,
        name: agent.name,
        agency: agent.agency,
        email: agent.email,
        plan: agent.plan,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        error: "Registration failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
