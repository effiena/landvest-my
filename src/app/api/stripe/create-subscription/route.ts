import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const decoded: any = jwt.verify(token, jwtSecret);

    const agent = await prisma.agent.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    if (agent.plan === "professional") {
      return NextResponse.json(
        { error: "You already have a Professional plan." },
        { status: 400 }
      );
    }

    if (agent.plan === "ceo") {
      return NextResponse.json(
        { error: "CEO accounts do not need a Professional subscription." },
        { status: 400 }
      );
    }

    const priceId = process.env.STRIPE_PROFESSIONAL_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe Professional Price ID is not configured." },
        { status: 500 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      customer_email: agent.email,

      metadata: {
        agentId: String(agent.id),
        plan: "professional",
      },

      subscription_data: {
        metadata: {
          agentId: String(agent.id),
          plan: "professional",
        },
      },

      success_url:
        `${appUrl}/admin?stripe=success&session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${appUrl}/admin?stripe=cancel`,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error(
      "Create Stripe subscription checkout error:",
      err
    );

    return NextResponse.json(
      {
        error: "Failed to create Stripe checkout session.",
      },
      { status: 500 }
    );
  }
}
