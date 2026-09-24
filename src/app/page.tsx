import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import LandSearch from "@/components/LandSearch";

export default async function Home() {
  const lands = await prisma.land.findMany({
    include: { images: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={styles.page}>
      <Navbar />

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.hero}>
          <h1 style={styles.heroTitle}>
            PropVest Malaysia
          </h1>


          <p style={styles.heroSubtitle}>
            Discover Home. Explores Land. Unlock Opportunities.
          </p>
        </div>

        <div style={styles.actions}>
          <Link href="/login" style={styles.btnDark}>Login</Link>
          <Link href="/register" style={styles.btnYellow}>Register</Link>
          <Link href="/admin" style={styles.btnBlue}>Dashboard</Link>
        </div>
      </section>

    <LandSearch lands={lands} />
    </main>
  );
}

/* ================= STYLES ================= */

const styles: any = {
  page: {
    background: "#F4F7FB",
    minHeight: "100vh",
  },

  /* HERO */
hero: {
  textAlign: "center",
  padding: "45px 20px 30px",
  width: "100%",
  boxSizing: "border-box",
},

  title: {
    fontSize: 42,
    fontWeight: 800,
    color: "#0F172A",
  },

  subtitle: {
    fontSize: 18,
    color: "#475569",
    marginTop: 10,
  },

  actions: {
    marginTop: 20,
    display: "flex",
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  btnDark: {
    padding: "10px 16px",
    background: "#0F172A",
    color: "#fff",
    borderRadius: 8,
    textDecoration: "none",
  },

  btnYellow: {
    padding: "10px 16px",
    background: "#FACC15",
    color: "#0F172A",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: "bold",
  },

  btnBlue: {
    padding: "10px 16px",
    background: "#1E3A8A",
    color: "#fff",
    borderRadius: 8,
    textDecoration: "none",
  },

  /* GRID */
  grid: {
    padding: "0 40px 60px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 20,
  },

  /* CARD */
  card: {
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
  },

  image: {
    width: "100%",
    height: 220,
    objectFit: "cover",
  },

  noImage: {
    height: 220,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#E5E7EB",
    color: "#64748B",
  },

  content: {
    padding: 16,
  },

  cardTitle: {
    fontSize: 20,
    marginBottom: 10,
  },

  text: {
    color: "#475569",
    fontSize: 14,
  },

  price: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E3A8A",
  },

  desc: {
    marginTop: 12,
    fontSize: 15,
    color: "#475569",
    lineHeight: "1.8",
    whiteSpace: "pre-line",
    textAlign: "justify",
  },


  whatsapp: {
    display: "inline-block",
    marginTop: 14,
    background: "#0F172A",
    color: "#FACC15",
    padding: "10px 14px",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: "bold",
  },

  empty: {
    textAlign: "center",
    padding: 50,
    color: "#64748B",
  },

heroTitle: {
  margin: 0,
  fontSize: "clamp(34px, 8vw, 58px)",
  fontWeight: 800,
  lineHeight: 1.1,
  letterSpacing: "-1.5px",
  textAlign: "center",
  color: "#0B2A5B",
},

heroSubtitle: {
  marginTop: 10,
  marginBottom: 0,
  fontSize: "clamp(15px, 3vw, 20px)",
  color: "#666",
},
};
