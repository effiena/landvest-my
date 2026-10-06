import { prisma } from "@/lib/prisma";
import { getWhatsAppLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

function formatPropertyPrice(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not specified";
  }

  const cleaned = String(value)
    .replace(/^RM\s*/i, "")
    .replace(/,/g, "")
    .trim();

  const number = Number(cleaned);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return `RM ${number.toLocaleString("en-MY", {
    maximumFractionDigits: 0,
  })}`;
}

export default async function ListingsPage() {
  const lands = await prisma.land.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main style={{ padding: 24 }}>
      <h1>PropVest Listings</h1>

      <div style={{ display: "grid", gap: 16 }}>
        {lands.map((land) => (
          <div
            key={land.id}
            style={{
              border: "1px solid #ddd",
              padding: 16,
              borderRadius: 10,
            }}
          >
            <h2>{land.title}</h2>
            <p>{land.location} • {land.state}</p>
            <p>Acreage: {land.acreage}</p>
            <p><b>{formatPropertyPrice(land.price)}</b></p>

            <p style={{ marginTop: 8 }}>{land.description}</p>

            <a
              href={getWhatsAppLink(land.whatsapp)}
              target="_blank"
              style={{
                display: "inline-block",
                marginTop: 10,
                padding: "8px 12px",
                background: "green",
                color: "white",
                borderRadius: 6,
              }}
            >
              Contact Agent
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
