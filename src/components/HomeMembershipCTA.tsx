import Link from "next/link";

export default function HomeMembershipCTA() {
  return (
    <section
      style={{
        width: "100%",
        maxWidth: 1100,
        margin: "35px auto",
        padding: "28px 20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          background: "#0B2A5B",
          borderRadius: 16,
          padding: "32px 24px",
          textAlign: "center",
          boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#FFFFFF",
            fontSize: "clamp(25px, 5vw, 38px)",
            fontWeight: 800,
          }}
        >
          Want to be a PropVest Member?
        </h2>

        <p
          style={{
            margin: "12px auto 22px",
            maxWidth: 700,
            color: "#E5E7EB",
            fontSize: 17,
            lineHeight: 1.6,
          }}
        >
          Join PropVest Professional and unlock up to 10 active listings
          with up to 20 photos per listing.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/membership"
            style={{
              display: "inline-block",
              padding: "13px 22px",
              background: "#FACC15",
              color: "#0F172A",
              borderRadius: 9,
              textDecoration: "none",
              fontWeight: 800,
            }}
          >
            Upgrade to Professional — RM12.90/month
          </Link>

          <Link
            href="/contact"
            style={{
              display: "inline-block",
              padding: "13px 22px",
              background: "#FFFFFF",
              color: "#0B2A5B",
              borderRadius: 9,
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Contact Developer
          </Link>
        </div>
      </div>
    </section>
  );
}
