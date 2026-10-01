import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

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

    if (agent.plan === "ceo") {
      return NextResponse.json(
        { error: "CEO accounts do not need to purchase listing credits." },
        { status: 400 }
      );
    }

    const pricePerListing =
      agent.plan === "professional"
        ? 2.60
        : 3.70;

    const totalAmount = Number(
      (pricePerListing * qty).toFixed(2)
    );

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const purchase =
      await prisma.listingCreditPurchase.create({
        data: {
          agentId: agent.id,
          credits: qty,
          amount: totalAmount,
          status: "pending",
        },
      });

    try {
      const session =
        await stripe.checkout.sessions.create({
          mode: "payment",

          line_items: [
            {
              price_data: {
                currency: "myr",

                product_data: {
                  name: `${qty} Extra Listing${qty > 1 ? "s" : ""}`,
                  description:
                    `Additional PropVest listing credit${qty > 1 ? "s" : ""}`,
                },

                unit_amount:
                  Math.round(
                    pricePerListing * 100
                  ),
              },

              quantity: qty,
            },
          ],

          metadata: {
            purchaseId: String(purchase.id),
            agentId: String(agent.id),
            credits: String(qty),
            plan: agent.plan,
          },

          success_url:
            `${appUrl}/admin?stripe=listing-success&session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${appUrl}/admin?stripe=listing-cancel`,
        });

      await prisma.listingCreditPurchase.update({
        where: {
          id: purchase.id,
        },

        data: {
          stripeSessionId: session.id,
        },
      });

      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
      });

    } catch (stripeError) {
      await prisma.listingCreditPurchase.update({
        where: {
          id: purchase.id,
        },

        data: {
          status: "failed",
        },
      });

      throw stripeError;
    }

  } catch (err) {
    console.error(
      "Create Stripe listing checkout error:",
      err
    );

    return NextResponse.json(
      {
        error:
          "Failed to create Stripe listing checkout.",
      },
      { status: 500 }
    );
  }
}
