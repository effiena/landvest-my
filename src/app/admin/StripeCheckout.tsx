"use client";

import { useState } from "react";

type StripeCheckoutProps = {
  type: "subscription" | "listing";
  quantity?: number;
};

export default function StripeCheckout({
  type,
  quantity = 1,
}: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    try {
      setLoading(true);

      const endpoint =
        type === "subscription"
          ? "/api/stripe/create-subscription"
          : "/api/stripe/create-listing-checkout";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        ...(type === "listing"
          ? {
              body: JSON.stringify({
                quantity,
              }),
            }
          : {}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to start Stripe Checkout."
        );
      }

      if (!data.url) {
        throw new Error(
          "Stripe Checkout URL was not returned."
        );
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Stripe Checkout error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to start Stripe Checkout."
      );

      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      style={{
        width: "100%",
        padding: "12px 18px",
        border: "none",
        borderRadius: "8px",
        background: "#0b1f3a",
        color: "#ffffff",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        fontWeight: 700,
        fontSize: "16px",
      }}
    >
      {loading
        ? "Redirecting to Stripe..."
        : type === "subscription"
          ? "Upgrade with Stripe — RM12.90/month"
          : `Buy ${quantity} Listing${quantity > 1 ? "s" : ""} with Stripe`}
    </button>
  );
}
