import Link from "next/link";

export default function MembershipPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F4F7FB",
        padding: "50px 20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 950,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#64748B",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          PROP VEST MALAYSIA
        </p>

        <h1
          style={{
            color: "#0B2A5B",
            fontSize: "clamp(32px, 7vw, 52px)",
            margin: 0,
            fontWeight: 800,
          }}
        >
          Choose Your PropVest Plan
        </h1>

        <p
          style={{
            color: "#475569",
            fontSize: 18,
            lineHeight: 1.6,
            maxWidth: 650,
            margin: "16px auto 35px",
          }}
        >
          Create your PropVest Malaysia account and choose the plan
          that suits your property and land listing needs.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
            textAlign: "left",
          }}
        >
          {/* STARTER */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              padding: 30,
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
              border: "2px solid #E2E8F0",
            }}
          >
            <div
              style={{
                color: "#0B2A5B",
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              Starter
            </div>

            <div
              style={{
                marginTop: 12,
                color: "#0B2A5B",
                fontSize: 40,
                fontWeight: 800,
              }}
            >
              FREE
            </div>

            <p
              style={{
                color: "#64748B",
                marginTop: 4,
              }}
            >
              Start listing on PropVest
            </p>

            <ul
              style={{
                marginTop: 22,
                paddingLeft: 22,
                color: "#1F2937",
                lineHeight: 2,
                fontSize: 16,
              }}
            >
              <li>2 free listings</li>
              <li>Up to 3 photos per listing</li>
              <li>Additional listings: RM3.70 each</li>
              <li>PropVest account</li>
            </ul>

            <Link
              href="/membership/register?plan=starter"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: 28,
                padding: "15px 20px",
                background: "#E2E8F0",
                color: "#0B2A5B",
                borderRadius: 9,
                textDecoration: "none",
                fontWeight: 800,
                fontSize: 17,
              }}
            >
              Become a Starter
            </Link>
          </div>

          {/* PROFESSIONAL */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              padding: 30,
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
              border: "2px solid #0B2A5B",
            }}
          >
            <div
              style={{
                color: "#0B2A5B",
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              Professional
            </div>

            <div
              style={{
                marginTop: 12,
                color: "#0B2A5B",
                fontSize: 40,
                fontWeight: 800,
              }}
            >
              RM12.90
            </div>

            <p
              style={{
                color: "#64748B",
                marginTop: 4,
              }}
            >
              per month
            </p>

            <ul
              style={{
                marginTop: 22,
                paddingLeft: 22,
                color: "#1F2937",
                lineHeight: 2,
                fontSize: 16,
              }}
            >
              <li>10 active listings</li>
              <li>Up to 20 photos per listing</li>
              <li>Additional listings: RM2.60 each</li>
              <li>Professional membership account</li>
            </ul>

            <Link
              href="/membership/register?plan=professional"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: 28,
                padding: "15px 20px",
                background: "#FACC15",
                color: "#0F172A",
                borderRadius: 9,
                textDecoration: "none",
                fontWeight: 800,
                fontSize: 17,
              }}
            >
              Become Professional
            </Link>
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: 28,
            color: "#64748B",
          }}
        >
          Already a PropVest member?{" "}
          <Link
            href="/login"
            style={{
              color: "#1E3A8A",
              fontWeight: 700,
            }}
          >
            Login
          </Link>
        </p>

        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: 10,
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
