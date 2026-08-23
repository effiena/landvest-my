"use client";

import { useState } from "react";

export default function BuyListingCredit({
  plan,
}: {
  plan: string;
}) {
  const [loading, setLoading] =
    useState(false);

  const price =
    plan === "professional"
      ? "1.70"
      : "2.90";

  const buyListing = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/paypal/create-listing-order",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            quantity: 1,
          }),
        }
      );

      const data =
        await res.json();

      if (
        !res.ok ||
        !data.approvalUrl
      ) {
        throw new Error(
          data.error ||
            "Failed to create PayPal order"
        );
      }

      window.location.href =
        data.approvalUrl;

    } catch (error) {
      console.error(
        "PayPal listing error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to start PayPal payment."
      );

      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 20,
        padding: 15,
        background: "#fff",
        borderRadius: 8,
      }}
    >
      <h4>
        Buy 1 Extra Listing
      </h4>

      <p>
        Price:{" "}
        <b>RM {price}</b>
      </p>

      <button
        type="button"
        onClick={buyListing}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px 20px",
          border: "none",
          borderRadius: 25,
          background: "#ffc439",
          color: "#111",
          fontWeight: 700,
          fontSize: 16,
          cursor: loading
            ? "not-allowed"
            : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading
          ? "Redirecting to PayPal..."
          : `Pay RM ${price} with PayPal`}
      </button>
    </div>
  );
}
