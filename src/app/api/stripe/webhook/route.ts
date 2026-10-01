import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");

    return NextResponse.json(
      { error: "Webhook configuration error" },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error(
      "Stripe webhook signature verification failed:",
      err
    );

    return NextResponse.json(
      { error: "Invalid Stripe webhook signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      // =====================================================
      // CHECKOUT COMPLETED
      // =====================================================

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // ---------------------------------------------------
        // Extra listing credits
        // ---------------------------------------------------

        if (session.mode === "payment") {
          if (session.payment_status !== "paid") {
            console.log(
              "Stripe listing checkout completed but payment is not paid:",
              session.id
            );

            break;
          }

          const purchaseId =
            session.metadata?.purchaseId;

          if (!purchaseId) {
            console.error(
              "Missing purchaseId in Stripe session metadata:",
              session.id
            );

            break;
          }

          const purchase =
            await prisma.listingCreditPurchase.findUnique({
              where: {
                id: Number(purchaseId),
              },
            });

          if (!purchase) {
            console.error(
              "Listing credit purchase not found:",
              purchaseId
            );

            break;
          }

          // Idempotency:
          // Do not grant credits more than once.
          if (purchase.status === "paid") {
            console.log(
              "Listing credit purchase already processed:",
              purchase.id
            );

            break;
          }

          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id || null;

          await prisma.$transaction([
            prisma.listingCreditPurchase.update({
              where: {
                id: purchase.id,
              },
              data: {
                status: "paid",
                stripeSessionId: session.id,
                stripePaymentId: paymentIntentId,
              },
            }),

            prisma.agent.update({
              where: {
                id: purchase.agentId,
              },
              data: {
                extraListings: {
                  increment: purchase.credits,
                },
              },
            }),
          ]);

          console.log(
            "Stripe listing credits activated:",
            {
              purchaseId: purchase.id,
              agentId: purchase.agentId,
              credits: purchase.credits,
            }
          );

          break;
        }

        // ---------------------------------------------------
        // Professional subscription
        // ---------------------------------------------------

        if (session.mode === "subscription") {
          const agentId =
            session.metadata?.agentId;

          if (!agentId) {
            console.error(
              "Missing agentId in subscription metadata:",
              session.id
            );

            break;
          }

          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id;

          if (!subscriptionId) {
            console.error(
              "Missing Stripe subscription ID:",
              session.id
            );

            break;
          }

          const subscription =
            await stripe.subscriptions.retrieve(
              subscriptionId
            );

          const customerId =
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer.id;

          await prisma.subscription.upsert({
            where: {
              agentId: Number(agentId),
            },

            create: {
              agentId: Number(agentId),
              stripeSubscriptionId:
                subscription.id,
              stripeCustomerId:
                customerId,
              status: subscription.status,
              plan: "professional",
              startedAt: new Date(
                subscription.start_date * 1000
              ),
            },

            update: {
              stripeSubscriptionId:
                subscription.id,
              stripeCustomerId:
                customerId,
              status: subscription.status,
              plan: "professional",
              startedAt: new Date(
                subscription.start_date * 1000
              ),
            },
          });

          if (
            subscription.status === "active" ||
            subscription.status === "trialing"
          ) {
            await prisma.agent.update({
              where: {
                id: Number(agentId),
              },

              data: {
                plan: "professional",
                listingLimit: 10,
              },
            });
          }

          console.log(
            "Stripe Professional subscription processed:",
            {
              agentId,
              subscriptionId,
              status: subscription.status,
            }
          );

          break;
        }

        break;
      }

      // =====================================================
      // SUBSCRIPTION UPDATED
      // =====================================================

      case "customer.subscription.updated": {
        const subscription =
          event.data.object as Stripe.Subscription;

        const agentId =
          subscription.metadata?.agentId;

        if (!agentId) {
          console.error(
            "Missing agentId in subscription metadata:",
            subscription.id
          );

          break;
        }

        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await prisma.subscription.upsert({
          where: {
            agentId: Number(agentId),
          },

          create: {
            agentId: Number(agentId),
            stripeSubscriptionId:
              subscription.id,
            stripeCustomerId:
              customerId,
            status: subscription.status,
            plan: "professional",
            startedAt: new Date(
              subscription.start_date * 1000
            ),
          },

          update: {
            stripeSubscriptionId:
              subscription.id,
            stripeCustomerId:
              customerId,
            status: subscription.status,
            plan: "professional",
          },
        });

        if (
          subscription.status === "active" ||
          subscription.status === "trialing"
        ) {
          await prisma.agent.update({
            where: {
              id: Number(agentId),
            },

            data: {
              plan: "professional",
              listingLimit: 10,
            },
          });
        }

        console.log(
          "Stripe subscription updated:",
          {
            agentId,
            subscriptionId: subscription.id,
            status: subscription.status,
          }
        );

        break;
      }

      // =====================================================
      // SUBSCRIPTION DELETED
      // =====================================================

      case "customer.subscription.deleted": {
        const subscription =
          event.data.object as Stripe.Subscription;

        const agentId =
          subscription.metadata?.agentId;

        if (!agentId) {
          console.error(
            "Missing agentId in deleted subscription metadata:",
            subscription.id
          );

          break;
        }

        await prisma.subscription.updateMany({
          where: {
            agentId: Number(agentId),
          },

          data: {
            status: "canceled",
            plan: "starter",
            expiresAt: new Date(),
          },
        });

        await prisma.agent.update({
          where: {
            id: Number(agentId),
          },

          data: {
            plan: "starter",
            listingLimit: 2,
          },
        });

        console.log(
          "Stripe Professional subscription canceled:",
          {
            agentId,
            subscriptionId: subscription.id,
          }
        );

        break;
      }

      // =====================================================
      // INVOICE PAID
      // =====================================================

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;

        console.log(
          "Stripe invoice paid:",
          {
            invoiceId: invoice.id,
            customerId:
              typeof invoice.customer === "string"
                ? invoice.customer
                : invoice.customer?.id || null,
          }
        );

        break;
      }

      // =====================================================
      // INVOICE PAYMENT FAILED
      // =====================================================

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        console.error(
          "Stripe invoice payment failed:",
          {
            invoiceId: invoice.id,
            customerId:
              typeof invoice.customer === "string"
                ? invoice.customer
                : invoice.customer?.id || null,
          }
        );

        break;
      }

      default:
        console.log(
          "Unhandled Stripe event:",
          event.type
        );
    }

    return NextResponse.json({
      received: true,
    });
  } catch (err) {
    console.error(
      "Stripe webhook processing error:",
      err
    );

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
