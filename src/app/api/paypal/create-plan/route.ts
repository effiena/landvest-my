import { NextRequest, NextResponse } from "next/server";
import { paypalRequest } from "@/lib/paypal";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const setupKey = process.env.PAYPAL_SETUP_KEY;

    if (!setupKey) {
      return NextResponse.json(
        { error: "PayPal setup key is not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${setupKey}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (process.env.PAYPAL_MODE !== "live") {
      return NextResponse.json(
        { error: "PayPal is not in Live mode" },
        { status: 400 }
      );
    }

    if (process.env.PAYPAL_PROFESSIONAL_PLAN_ID) {
      return NextResponse.json(
        {
          error: "Professional PayPal plan already configured",
          planId: process.env.PAYPAL_PROFESSIONAL_PLAN_ID,
        },
        { status: 409 }
      );
    }

    // 1. Create Product
    const productRes = await paypalRequest(
      "/v1/catalogs/products",
      {
        method: "POST",
        body: JSON.stringify({
          name: "LandVest Professional",
          description: "Professional plan for LandVest agents",
          type: "SERVICE",
        }),
      }
    );

    const product = await productRes.json();

    if (!productRes.ok) {
      console.error("PayPal product creation failed:", product);

      return NextResponse.json(
        { error: "Failed to create PayPal product" },
        { status: 500 }
      );
    }

    // 2. Create Subscription Plan
    const planRes = await paypalRequest(
      "/v1/billing/plans",
      {
        method: "POST",
        body: JSON.stringify({
          product_id: product.id,

          name: "Professional Monthly RM8.90",

          description: "LandVest Professional - RM8.90 per month",

          billing_cycles: [
            {
              frequency: {
                interval_unit: "MONTH",
                interval_count: 1,
              },

              tenure_type: "REGULAR",
              sequence: 1,
              total_cycles: 0,

              pricing_scheme: {
                fixed_price: {
                  value: "8.90",
                  currency_code: "MYR",
                },
              },
            },
          ],

          payment_preferences: {
            auto_bill_outstanding: true,

            setup_fee: {
              value: "0",
              currency_code: "MYR",
            },

            payment_failure_threshold: 3,
          },
        }),
      }
    );

    const plan = await planRes.json();

    if (!planRes.ok) {
      console.error("PayPal plan creation failed:", plan);

      return NextResponse.json(
        {
          error: "Failed to create PayPal subscription plan",
          product,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      productId: product.id,
      planId: plan.id,
      message:
        "Live PayPal Professional plan created successfully.",
    });
  } catch (error) {
    console.error("PayPal create-plan error:", error);

    return NextResponse.json(
      {
        error: "Failed to create PayPal Professional plan",
      },
      { status: 500 }
    );
  }
}
