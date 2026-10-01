"use client";

import { Suspense, useState } from "react";
import Link from "next/link";

function MembershipRegisterForm() {
  const [form, setForm] = useState({
    name: "",
    agency: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    plan: "starter" | "professional"
  ) => {
    setLoading(true);
    setError("");

    try {
      const registerResponse = await fetch(
        "/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            plan,
          }),
        }
      );

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(
          registerData.error ||
            "Unable to create your account."
        );
      }

      const loginResponse = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        }
      );

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(
          loginData.error ||
            "Account created, but login failed."
        );
      }

      // STARTER:
      // Account is created as Starter and goes directly to the dashboard.
      if (plan === "starter") {
        window.location.href = "/admin";
        return;
      }

      // PROFESSIONAL:
      // Account remains Starter until Stripe payment succeeds.
      const stripeResponse = await fetch(
        "/api/stripe/create-subscription",
        {
          method: "POST",
        }
      );

      const stripeData = await stripeResponse.json();

      if (!stripeResponse.ok) {
        throw new Error(
          stripeData.error ||
            "Unable to start Stripe Checkout."
        );
      }

      if (!stripeData.url) {
        throw new Error(
          "Stripe Checkout URL was not returned."
        );
      }

      // Send the new Professional applicant to Stripe.
      window.location.href = stripeData.url;
    } catch (error) {
      console.error("Registration error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );

      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#ffffff",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>
            🏠
          </div>

          <h1
            style={{
              margin: 0,
              color: "#111827",
              fontSize: 28,
            }}
          >
            Create Your PropVest Account
          </h1>

          <p
            style={{
              color: "#6b7280",
              marginTop: 10,
              lineHeight: 1.6,
            }}
          >
            Enter your details, then choose your membership plan.
          </p>
        </div>

        {error && (
          <div
            style={{
              marginTop: 20,
              padding: 12,
              borderRadius: 8,
              background: "#fee2e2",
              color: "#991b1b",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <form
          style={{
            marginTop: 24,
            display: "grid",
            gap: 16,
          }}
        >
          <div>
            <label style={labelStyle}>Full Name</label>

            <input
              type="text"
              required
              value={form.name}
              placeholder="Your full name"
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  name: e.target.value,
                }))
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Agency</label>

            <input
              type="text"
              required
              value={form.agency}
              placeholder="Your agency name"
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  agency: e.target.value,
                }))
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Email</label>

            <input
              type="email"
              required
              value={form.email}
              placeholder="you@example.com"
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  email: e.target.value,
                }))
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>

            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              placeholder="At least 6 characters"
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  password: e.target.value,
                }))
              }
              style={inputStyle}
            />
          </div>

          {/* PLAN CHOICES */}
          <div
            style={{
              marginTop: 8,
              color: "#111827",
              fontSize: 18,
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Choose Your Plan
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit("starter")}
            style={{
              width: "100%",
              padding: "16px 20px",
              border: "2px solid #0B2A5B",
              borderRadius: 10,
              background: "#0B2A5B",
              color: "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontWeight: 800,
              fontSize: 17,
            }}
          >
            {loading
              ? "Creating Account..."
              : "Become a Starter — FREE"}
          </button>

          <div
            style={{
              textAlign: "center",
              color: "#64748B",
              fontSize: 14,
              marginTop: -5,
            }}
          >
            2 free listings · Up to 3 photos per listing
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit("professional")}
            style={{
              width: "100%",
              padding: "16px 20px",
              border: "2px solid #FACC15",
              borderRadius: 10,
              background: "#FACC15",
              color: "#0F172A",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontWeight: 800,
              fontSize: 17,
            }}
          >
            {loading
              ? "Processing..."
              : "Become Professional — RM12.90/month"}
          </button>

          <div
            style={{
              textAlign: "center",
              color: "#64748B",
              fontSize: 14,
              marginTop: -5,
            }}
          >
            10 active listings · Up to 20 photos per listing
          </div>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: 22,
            color: "#64748B",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "#1E3A8A",
              fontWeight: 700,
            }}
          >
            Login
          </Link>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 12,
          }}
        >
          <Link
            href="/membership"
            style={{
              color: "#1E3A8A",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            ← Back to Membership
          </Link>
        </div>
      </div>
    </main>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontWeight: 600,
  color: "#111827",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "12px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 15,
  color: "#111827",
  background: "#ffffff",
  outline: "none",
};


export default function MembershipRegisterPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            background: "#f4f7fb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
          }}
        >
          <div
            style={{
              color: "#0B2A5B",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Loading...
          </div>
        </main>
      }
    >
      <MembershipRegisterForm />
    </Suspense>
  );
}
