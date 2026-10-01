import Link from "next/link";

export default function ContactPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F4F7FB",
        padding: "60px 20px",
        textAlign: "center",
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
        }}
      >
        <h1
          style={{
            color: "#0B2A5B",
            marginTop: 0,
          }}
        >
          Contact Developer
        </h1>

        <p
          style={{
            color: "#475569",
            lineHeight: 1.7,
          }}
        >
          Have a question about PropVest Malaysia, membership,
          listings, or the platform?
        </p>

        <p
          style={{
            color: "#64748B",
            lineHeight: 1.7,
          }}
        >
          Please contact the PropVest development team for
          assistance.
        </p>

        <Link
          href="/membership"
          style={{
            display: "inline-block",
            marginTop: 15,
            padding: "13px 22px",
            background: "#FACC15",
            color: "#0F172A",
            borderRadius: 9,
            textDecoration: "none",
            fontWeight: 800,
          }}
        >
          View Professional Membership
        </Link>

        <br />

        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: 20,
            color: "#1E3A8A",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          ← Back to PropVest
        </Link>
      </div>
    </main>
  );
}
