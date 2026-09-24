"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        alert(
          "Registration successful! Please check your email to verify your account."
        );

        window.location.href = "/login";
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.backgroundShape1} />
      <div style={styles.backgroundShape2} />

      <div style={styles.container}>
        {/* BRANDING */}
        <div style={styles.brand}>
          <div style={styles.logo}>LV</div>

          <div>
            <div style={styles.brandName}>LandVest Malaysia</div>
            <div style={styles.tagline}>
              Property • Land • Investment
            </div>
          </div>
        </div>

        {/* REGISTER CARD */}
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>Create Your Account</h1>

            <p style={styles.subtitle}>
              Join LandVest Malaysia as a property agent
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* NAME */}
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>

              <input
                style={styles.input}
                type="text"
                placeholder="Enter your full name"
                value={form.name}
                required
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />
            </div>

            {/* EMAIL */}
            <div style={styles.field}>
              <label style={styles.label}>Email Address</label>

              <input
                style={styles.input}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                required
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
              />
            </div>

            {/* PASSWORD */}
            <div style={styles.field}>
              <label style={styles.label}>Password</label>

              <input
                style={styles.input}
                type="password"
                placeholder="Create a secure password"
                value={form.password}
                required
                minLength={6}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
              />

              <span style={styles.hint}>
                Minimum 6 characters
              </span>
            </div>

            {/* TERMS */}
            <div style={styles.terms}>
              <input
                type="checkbox"
                required
                style={styles.checkbox}
              />

              <span>
                I agree to the LandVest Malaysia terms and
                conditions.
              </span>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading
                ? "Creating Account..."
                : "Create Agent Account"}
            </button>
          </form>

          {/* LOGIN */}
          <div style={styles.loginSection}>
            <span>Already have an account?</span>

            <Link href="/login" style={styles.loginLink}>
              Sign In
            </Link>
          </div>

          {/* EMAIL VERIFICATION NOTICE */}
          <div style={styles.notice}>
            <span style={styles.noticeIcon}>✉</span>

            <div>
              <strong>Verify your email</strong>

              <p style={styles.noticeText}>
                After registration, we will send you a
                verification email before you can access
                your account.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          © {new Date().getFullYear()} LandVest Malaysia
        </div>
      </div>
    </main>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles: any = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #071b12 0%, #0b2b1c 45%, #123c29 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
    position: "relative",
    overflow: "hidden",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  backgroundShape1: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: "50%",
    background:
      "rgba(34, 197, 94, 0.08)",
    top: -180,
    right: -120,
  },

  backgroundShape2: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: "50%",
    background:
      "rgba(234, 179, 8, 0.06)",
    bottom: -150,
    left: -120,
  },

  container: {
    width: "100%",
    maxWidth: 460,
    position: "relative",
    zIndex: 2,
  },

  brand: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
    color: "#ffffff",
  },

  logo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background:
      "linear-gradient(135deg, #22c55e, #15803d)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: 20,
    color: "#ffffff",
    boxShadow:
      "0 8px 25px rgba(34,197,94,0.25)",
  },

  brandName: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: "-0.5px",
  },

  tagline: {
    fontSize: 12,
    color: "#a7c5b2",
    marginTop: 3,
  },

  card: {
    background: "#ffffff",
    borderRadius: 20,
    padding: "34px 32px",
    boxShadow:
      "0 25px 70px rgba(0,0,0,0.35)",
  },

  header: {
    textAlign: "center",
    marginBottom: 28,
  },

  title: {
    margin: 0,
    color: "#10251a",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: "-0.7px",
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 0,
    color: "#6b7280",
    fontSize: 14,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#24352b",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #d9e1dc",
    borderRadius: 9,
    fontSize: 14,
    outline: "none",
    color: "#1f2937",
    background: "#fbfdfb",
  },

  hint: {
    fontSize: 11,
    color: "#8a948e",
  },

  terms: {
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    fontSize: 12,
    lineHeight: 1.5,
    color: "#6b7280",
    marginTop: 2,
  },

  checkbox: {
    marginTop: 2,
    width: 15,
    height: 15,
    accentColor: "#16a34a",
  },

  button: {
    width: "100%",
    border: "none",
    borderRadius: 9,
    padding: "14px 18px",
    background:
      "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    boxShadow:
      "0 8px 20px rgba(22,163,74,0.25)",
    marginTop: 3,
  },

  loginSection: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 24,
    fontSize: 13,
    color: "#6b7280",
  },

  loginLink: {
    color: "#15803d",
    fontWeight: "700",
    textDecoration: "none",
  },

  notice: {
    display: "flex",
    gap: 11,
    marginTop: 24,
    padding: 14,
    borderRadius: 10,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: 12,
    lineHeight: 1.45,
  },

  noticeIcon: {
    fontSize: 20,
    lineHeight: 1,
  },

  noticeText: {
    margin: "4px 0 0",
    color: "#4b6b55",
  },

  footer: {
    textAlign: "center",
    color: "#89a897",
    fontSize: 11,
    marginTop: 20,
  },
};
