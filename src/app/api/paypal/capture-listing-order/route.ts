import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";
import { paypalRequest } from "@/lib/paypal";

export async function POST(req: NextRequest) {
  try {
    const { orderID } = await req.json();

    if (!orderID) {
      return NextResponse.json(
        { error: "Missing PayPal order ID" },
        { status: 400 }
      );
    }

    // Authenticate user
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

    const decoded: any = jwt.verify(
      token,
      jwtSecret
    );

    const agent =
      await prisma.agent.findUnique({
        where: {
          id: decoded.id,
        },
        select: {
          id: true,
        },
      });

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Find purchase created before PayPal approval
    const purchase =
      await prisma.listingCreditPurchase.findUnique({
        where: {
          paypalOrderId: orderID,
        },
      });

    if (!purchase) {
      return NextResponse.json(
        {
          error:
            "Purchase record not found",
        },
        { status: 404 }
      );
    }

    // Make sure this order belongs to this agent
    if (purchase.agentId !== agent.id) {
      return NextResponse.json(
        {
          error:
            "Unauthorized purchase",
        },
        { status: 403 }
      );
    }

    // Prevent double credit
    if (purchase.status === "completed") {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        creditsAdded: 0,
      });
    }

    // Capture PayPal order
    const captureRes =
      await paypalRequest(
        `/v2/checkout/orders/${orderID}/capture`,
        {
          method: "POST",
        }
      );

    const capture =
      await captureRes.json();

    if (!captureRes.ok) {
      console.error(
        "PayPal capture failed:",
        capture
      );

      return NextResponse.json(
        {
          error:
            capture.message ||
            "PayPal payment failed",
        },
        { status: 400 }
      );
    }

    if (capture.status !== "COMPLETED") {
      return NextResponse.json(
        {
          error:
            "Payment was not completed",
          status: capture.status,
        },
        { status: 400 }
      );
    }

    // Read actual PayPal captured amount
    const captureUnit =
      capture.purchase_units?.[0];

    const paypalAmount =
      captureUnit
        ?.payments
        ?.captures?.[0]
        ?.amount;

    const expectedAmount =
      purchase.amount.toFixed(2);

    if (
      !paypalAmount ||
      paypalAmount.currency_code !== "MYR" ||
      paypalAmount.value !== expectedAmount
    ) {
      console.error(
        "Invalid PayPal amount:",
        {
          received: paypalAmount,
          expected: expectedAmount,
        }
      );

      return NextResponse.json(
        {
          error:
            "Invalid payment amount",
        },
        { status: 400 }
      );
    }

    // Add credits and complete purchase atomically
    await prisma.$transaction([
      prisma.listingCreditPurchase.update({
        where: {
          id: purchase.id,
        },
        data: {
          status: "completed",
        },
      }),

      prisma.agent.update({
        where: {
          id: agent.id,
        },
        data: {
          extraListings: {
            increment:
              purchase.credits,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      creditsAdded:
        purchase.credits,
      amount:
        expectedAmount,
    });

  } catch (err) {
    console.error(
      "Capture listing payment error:",
      err
    );

    return NextResponse.json(
      {
        error:
          "Failed to capture PayPal payment",
      },
      { status: 500 }
    );
  }
}
