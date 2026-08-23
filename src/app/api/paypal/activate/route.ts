import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";
import { paypalRequest } from "@/lib/paypal";

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Missing subscription ID" },
        { status: 400 }
      );
    }

    // Read JWT
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
      console.error("JWT_SECRET is not configured");

      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const decoded: any = jwt.verify(token, jwtSecret);

    // Verify subscription with PayPal
    const paypalRes = await paypalRequest(
      `/v1/billing/subscriptions/${subscriptionId}`
    );

    const paypalSub = await paypalRes.json();

    if (!paypalRes.ok) {
      console.error("PayPal subscription verification failed:", paypalSub);

      return NextResponse.json(
        { error: "Unable to verify PayPal subscription" },
        { status: 400 }
      );
    }

    // Subscription must be ACTIVE
    if (paypalSub.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error: "Subscription is not active",
          paypalStatus: paypalSub.status,
        },
        { status: 400 }
      );
    }

    // Verify the subscription belongs to LandVest Professional
    const expectedPlanId = process.env.PAYPAL_PROFESSIONAL_PLAN_ID;

    if (!expectedPlanId) {
      console.error(
        "PAYPAL_PROFESSIONAL_PLAN_ID is not configured"
      );

      return NextResponse.json(
        { error: "PayPal plan configuration error" },
        { status: 500 }
      );
    }

    if (paypalSub.plan_id !== expectedPlanId) {
      console.error("Unexpected PayPal plan:", {
        received: paypalSub.plan_id,
        expected: expectedPlanId,
      });

      return NextResponse.json(
        { error: "Invalid PayPal subscription plan" },
        { status: 400 }
      );
    }

    // Save / update subscription
    await prisma.subscription.upsert({
      where: {
        agentId: decoded.id,
      },
      update: {
        paypalId: subscriptionId,
        status: "active",
        plan: "professional",
      },
      create: {
        agentId: decoded.id,
        paypalId: subscriptionId,
        status: "active",
        plan: "professional",
      },
    });

    // Upgrade agent
    await prisma.agent.update({
      where: {
        id: decoded.id,
      },
      data: {
        plan: "professional",
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error("PayPal activation error:", err);

    return NextResponse.json(
      {
        error: "Activation failed",
      },
      { status: 500 }
    );
  }
}

