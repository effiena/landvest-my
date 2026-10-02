 "use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "General Question",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to send your message.");
      }

      setSuccess(
        "Thank you! Your message has been sent to the PropVest development team."
      );

      setForm({
        name: "",
        email: "",
        subject: "General Question",
        message: "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send your message. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F4F7FB",
        padding: "60px 20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 650,
          margin: "0 auto",
          background: "#FFFFFF",
          borderRadius: 16,
          padding: 35,
          boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
          textAlign: "left",
        }}
      >
        <h1
          style={{
            color: "#0B2A5B",
            marginTop: 0,
            textAlign: "center",
          }}
        >
          Contact Developer
        </h1>

        <p
          style={{
            color: "#475569",
            lineHeight: 1.7,
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          Have a question about PropVest Malaysia, membership, listings, or
          the platform? Send us a message and the development team will
          receive it.
        </p>

        {success && (
          <div
            style={{
              background: "#ECFDF5",
              border: "1px solid #86EFAC",
              color: "#166534",
              padding: 14,
              borderRadius: 10,
              marginBottom: 20,
              lineHeight: 1.5,
              fontWeight: 600,
            }}
          >
            {success}
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              color: "#991B1B",
              padding: 14,
              borderRadius: 10,
              marginBottom: 20,
              lineHeight: 1.5,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              marginBottom: 7,
              color: "#0F172A",
              fontWeight: 700,
            }}
          >
            Name
          </label>

          <input
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                name: e.target.value,
              }))
            }
            placeholder="Your name"
            maxLength={100}
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              marginBottom: 18,
              border: "1px solid #CBD5E1",
              borderRadius: 9,
              color: "#0F172A",
              background: "#FFFFFF",
              fontSize: 15,
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: 7,
              color: "#0F172A",
              fontWeight: 700,
            }}
          >
            Email
          </label>

          <input
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                email: e.target.value,
              }))
            }
            placeholder="you@example.com"
            maxLength={150}
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              marginBottom: 18,
              border: "1px solid #CBD5E1",
              borderRadius: 9,
              color: "#0F172A",
              background: "#FFFFFF",
              fontSize: 15,
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: 7,
              color: "#0F172A",
              fontWeight: 700,
            }}
          >
            Message Type
          </label>

          <select
            value={form.subject}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                subject: e.target.value,
              }))
            }
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              marginBottom: 18,
              border: "1px solid #CBD5E1",
              borderRadius: 9,
              color: "#0F172A",
              background: "#FFFFFF",
              fontSize: 15,
            }}
          >
            <option value="General Question">General Question</option>
            <option value="Feedback">Feedback</option>
            <option value="Report a Problem">Report a Problem</option>
            <option value="Suggestion">Suggestion</option>
          </select>

          <label
            style={{
              display: "block",
              marginBottom: 7,
              color: "#0F172A",
              fontWeight: 700,
            }}
          >
            Message
          </label>

          <textarea
            value={form.message}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                message: e.target.value,
              }))
            }
            placeholder="Write your question or feedback here..."
            maxLength={5000}
            required
            rows={7}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              marginBottom: 20,
              border: "1px solid #CBD5E1",
              borderRadius: 9,
              color: "#0F172A",
              background: "#FFFFFF",
              fontSize: 15,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 20px",
              background: loading ? "#94A3B8" : "#FACC15",
              color: "#0F172A",
              border: "none",
              borderRadius: 9,
              fontWeight: 800,
              fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link
            href="/"
            style={{
              color: "#1E3A8A",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            ← Back to PropVest
          </Link>
        </div>
      </div>
    </main>
  );
}
