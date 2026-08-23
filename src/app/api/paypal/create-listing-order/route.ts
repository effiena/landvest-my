import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";
import { paypalRequest } from "@/lib/paypal";

export async function POST(req: NextRequest) {
  try {
    const { quantity } = await req.json();

    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty < 1) {
      return NextResponse.json(
        { error: "Invalid quantity" },
        { status: 400 }
      );
    }

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

    // SERVER-CONTROLLED PRICING
    const pricePerListing =
      agent.plan === "professional"
        ? 1.70
        : 2.90;

    const total = (
      pricePerListing * qty
    ).toFixed(2);

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const response =
      await paypalRequest(
        "/v2/checkout/orders",
        {
          method: "POST",

          body: JSON.stringify({
            intent: "CAPTURE",

            purchase_units: [
              {
                amount: {
                  currency_code: "MYR",
                  value: total,
                },

                description:
                  `${qty} LandVest extra listing` +
                  `${qty > 1 ? "s" : ""}`,
              },
            ],

            application_context: {
              brand_name:
                "LandVest Malaysia",

              user_action:
                "PAY_NOW",

              return_url:
                `${appUrl}/admin?paypal=success`,

              cancel_url:
                `${appUrl}/admin?paypal=cancel`,
            },
          }),
        }
      );

    const order =
      await response.json();

    if (!response.ok) {
      console.error(
        "PayPal order error:",
        order
      );

      return NextResponse.json(
        {
          error:
            order.message ||
            "PayPal failed to create order",
        },
        { status: 500 }
      );
    }

    await prisma.listingCreditPurchase.create({
      data: {
        agentId: agent.id,
        credits: qty,
        amount: Number(total),
        paypalOrderId: order.id,
        status: "pending",
      },
    });

    const approvalLink =
      order.links?.find(
        (link: any) =>
          link.rel === "approve"
      );

    if (!approvalLink?.href) {
      console.error(
        "PayPal approval URL missing:",
        order
      );

      return NextResponse.json(
        {
          error:
            "PayPal approval link missing",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      approvalUrl:
        approvalLink.href,
    });

  } catch (err) {
    console.error(
      "Create PayPal listing order error:",
      err
    );

    return NextResponse.json(
      {
        error:
          "Failed to create PayPal order",
      },
      { status: 500 }
    );
  }
}
