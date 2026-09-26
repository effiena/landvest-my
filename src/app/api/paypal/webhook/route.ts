import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paypalRequest } from "@/lib/paypal";

async function verifyPayPalWebhook(
  req: NextRequest,
  body: string
) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!webhookId) {
    throw new Error("PAYPAL_WEBHOOK_ID is not configured");
  }

  const transmissionId =
    req.headers.get("paypal-transmission-id");

  const transmissionTime =
    req.headers.get("paypal-transmission-time");

  const certUrl =
    req.headers.get("paypal-cert-url");

  const transmissionSig =
    req.headers.get("paypal-transmission-sig");

  const authAlgo =
    req.headers.get("paypal-auth-algo");

  if (
    !transmissionId ||
    !transmissionTime ||
    !certUrl ||
    !transmissionSig ||
    !authAlgo
  ) {
    return false;
  }

  const verifyResponse = await paypalRequest(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }),
    }
  );

  const result = await verifyResponse.json();

  if (!verifyResponse.ok) {
    console.error(
      "PayPal webhook verification failed:",
      result
    );

    return false;
  }

  return result.verification_status === "SUCCESS";
}

function getSubscriptionId(event: any) {
  return (
    event?.resource?.id ||
    event?.resource?.billing_agreement_id ||
    null
  );
}

function getNextBillingDate(event: any) {
  const nextBillingTime =
    event?.resource?.billing_info?.next_billing_time;

  if (!nextBillingTime) {
    return null;
  }

  const date = new Date(nextBillingTime);

  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(req: NextRequest) {
  try {
    // PayPal requires the raw request body for webhook verification.
    const body = await req.text();

    if (!body) {
      return NextResponse.json(
        { error: "Empty webhook body" },
        { status: 400 }
      );
    }

    // Verify that the webhook actually came from PayPal.
    const verified = await verifyPayPalWebhook(req, body);

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid PayPal webhook signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    console.log(
      "PayPal webhook:",
      event.event_type,
      event.id
    );

    const eventType = event.event_type;

    // --------------------------------------------------
    // SUBSCRIPTION ACTIVATED
    // --------------------------------------------------

    if (
      eventType ===
      "BILLING.SUBSCRIPTION.ACTIVATED"
    ) {
      const subscriptionId =
        getSubscriptionId(event);

      if (!subscriptionId) {
        return NextResponse.json({
          received: true,
          ignored: true,
          reason: "Missing subscription ID",
        });
      }

      const expectedPlanId =
        process.env.PAYPAL_PROFESSIONAL_PLAN_ID;

      if (
        expectedPlanId &&
        event.resource?.plan_id !== expectedPlanId
      ) {
        console.error(
          "Ignoring subscription with unexpected plan:",
          event.resource?.plan_id
        );

        return NextResponse.json({
          received: true,
          ignored: true,
        });
      }

      const subscription =
        await prisma.subscription.findFirst({
          where: {
            paypalId: subscriptionId,
          },
        });

      if (!subscription) {
        console.error(
          "No local subscription found for PayPal ID:",
          subscriptionId
        );

        return NextResponse.json({
          received: true,
          ignored: true,
          reason: "Subscription not found",
        });
      }

      const nextBilling =
        getNextBillingDate(event);

      await prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: "active",
          plan: "professional",
          startedAt:
            subscription.startedAt ||
            new Date(),
          expiresAt:
            nextBilling ||
            subscription.expiresAt,
        },
      });

      await prisma.agent.update({
        where: {
          id: subscription.agentId,
        },
        data: {
          plan: "professional",
        },
      });

      return NextResponse.json({
        received: true,
        processed: true,
        action: "subscription_activated",
      });
    }

    // --------------------------------------------------
    // SUBSCRIPTION PAYMENT COMPLETED
    // --------------------------------------------------

    if (
      eventType ===
        "BILLING.SUBSCRIPTION.PAYMENT.COMPLETED" ||
      eventType ===
        "PAYMENT.SALE.COMPLETED"
    ) {
      const subscriptionId =
        getSubscriptionId(event);

      if (!subscriptionId) {
        return NextResponse.json({
          received: true,
          ignored: true,
        });
      }

      const subscription =
        await prisma.subscription.findFirst({
          where: {
            paypalId: subscriptionId,
          },
        });

      if (!subscription) {
        console.error(
          "Payment received for unknown subscription:",
          subscriptionId
        );

        return NextResponse.json({
          received: true,
          ignored: true,
        });
      }

      const nextBilling =
        getNextBillingDate(event);

      await prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: "active",
          plan: "professional",
          expiresAt:
            nextBilling ||
            subscription.expiresAt,
        },
      });

      await prisma.agent.update({
        where: {
          id: subscription.agentId,
        },
        data: {
          plan: "professional",
        },
      });

      return NextResponse.json({
        received: true,
        processed: true,
        action: "payment_completed",
      });
    }

    // --------------------------------------------------
    // SUBSCRIPTION CANCELLED
    // --------------------------------------------------

    if (
      eventType ===
      "BILLING.SUBSCRIPTION.CANCELLED"
    ) {
      const subscriptionId =
        getSubscriptionId(event);

      if (!subscriptionId) {
        return NextResponse.json({
          received: true,
          ignored: true,
        });
      }

      const subscription =
        await prisma.subscription.findFirst({
          where: {
            paypalId: subscriptionId,
          },
        });

      if (!subscription) {
        return NextResponse.json({
          received: true,
          ignored: true,
        });
      }

      await prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: "cancelled",
          plan: "starter",
        },
      });

      await prisma.agent.update({
        where: {
          id: subscription.agentId,
        },
        data: {
          plan: "starter",
        },
      });

      return NextResponse.json({
        received: true,
        processed: true,
        action: "subscription_cancelled",
      });
    }

    // --------------------------------------------------
    // SUBSCRIPTION SUSPENDED
    // --------------------------------------------------

    if (
      eventType ===
      "BILLING.SUBSCRIPTION.SUSPENDED"
    ) {
      const subscriptionId =
        getSubscriptionId(event);

      if (!subscriptionId) {
        return NextResponse.json({
          received: true,
          ignored: true,
        });
      }

      const subscription =
        await prisma.subscription.findFirst({
          where: {
            paypalId: subscriptionId,
          },
        });

      if (!subscription) {
        return NextResponse.json({
          received: true,
          ignored: true,
        });
      }

      await prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: "suspended",
        },
      });

      return NextResponse.json({
        received: true,
        processed: true,
        action: "subscription_suspended",
      });
    }

    // --------------------------------------------------
    // SUBSCRIPTION EXPIRED
    // --------------------------------------------------

    if (
      eventType ===
      "BILLING.SUBSCRIPTION.EXPIRED"
    ) {
      const subscriptionId =
        getSubscriptionId(event);

      if (!subscriptionId) {
        return NextResponse.json({
          received: true,
          ignored: true,
        });
      }

      const subscription =
        await prisma.subscription.findFirst({
          where: {
            paypalId: subscriptionId,
          },
        });

      if (!subscription) {
        return NextResponse.json({
          received: true,
          ignored: true,
        });
      }

      await prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: "expired",
          plan: "starter",
        },
      });

      await prisma.agent.update({
        where: {
          id: subscription.agentId,
        },
        data: {
          plan: "starter",
        },
      });

      return NextResponse.json({
        received: true,
        processed: true,
        action: "subscription_expired",
      });
    }

    // --------------------------------------------------
    // PAYMENT FAILED
    // --------------------------------------------------

    if (
      eventType ===
      "BILLING.SUBSCRIPTION.PAYMENT.FAILED"
    ) {
      const subscriptionId =
        getSubscriptionId(event);

      if (subscriptionId) {
        const subscription =
          await prisma.subscription.findFirst({
            where: {
              paypalId: subscriptionId,
            },
          });

        if (subscription) {
          await prisma.subscription.update({
            where: {
              id: subscription.id,
            },
            data: {
              status: "payment_failed",
            },
          });
        }
      }

      return NextResponse.json({
        received: true,
        processed: true,
        action: "payment_failed",
      });
    }

    // --------------------------------------------------
    // OTHER PAYPAL EVENTS
    // --------------------------------------------------

    return NextResponse.json({
      received: true,
      processed: false,
      eventType,
    });
  } catch (error) {
    console.error(
      "PayPal webhook error:",
      error
    );

    return NextResponse.json(
      {
        error: "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}
