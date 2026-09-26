"use client";

import { useMemo, useState } from "react";
import ImageCarousel from "@/components/ImageCarousel";

function formatLandArea(land: any) {
  const value = land.areaValue ?? land.acreage ?? 0;
  const unit = land.areaUnit ?? "acre";

  if (unit === "psf") {
    return `${Number(value).toLocaleString()} PSF`;
  }

  if (unit === "hektar") {
    return `${Number(value).toLocaleString()} Hektar`;
  }

  return `${Number(value).toLocaleString()} Acres`;
}

function formatPrice(price: string) {
  const raw = String(price ?? "").trim();

  if (!raw) return "";

  const withoutRM = raw.replace(/^RM\s*/i, "").trim();
  const numeric = Number(withoutRM.replace(/,/g, ""));

  if (Number.isFinite(numeric)) {
    return `RM ${numeric.toLocaleString("en-MY")}`;
  }

  return `RM ${withoutRM}`;
}

export default function LandSearch({ lands }: { lands: any[] }) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("all");

  const locations = useMemo(() => {
    return Array.from(
      new Set(
        lands
          .map((land) => land.location)
          .filter(Boolean)
      )
    ).sort();
  }, [lands]);

  const filteredLands = useMemo(() => {
    const query = search.trim().toLowerCase();

    return lands.filter((land) => {
      const searchableText = [
        land.title,
        land.location,
        land.state,
        land.description,
        land.acreage,
        land.price,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        query === "" || searchableText.includes(query);

      const matchesLocation =
        location === "all" ||
        land.location?.toLowerCase() === location.toLowerCase();

      return matchesSearch && matchesLocation;
    });
  }, [lands, search, location]);

  const clearFilters = () => {
    setSearch("");
    setLocation("all");
  };

  return (
    <>
      {/* SEARCH & FILTER */}
      <section style={styles.filterSection}>
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔎</span>

          <input
            type="text"
            placeholder="Search land, location, state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={styles.locationSelect}
        >
          <option value="all">📍 All Locations</option>

          {locations.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        {(search || location !== "all") && (
          <button
            onClick={clearFilters}
            style={styles.clearButton}
          >
            Clear
          </button>
        )}
      </section>

      {/* RESULT COUNT */}
      <div style={styles.resultCount}>
        Showing <strong>{filteredLands.length}</strong> of{" "}
        <strong>{lands.length}</strong> listings
      </div>

      {/* GRID */}
      <section style={styles.grid}>
        {filteredLands.map((land) => (
          <article key={land.id} style={styles.card}>
            <ImageCarousel images={land.images} />

            <div style={styles.content}>
              <h2 style={styles.cardTitle}>{land.title}</h2>

              <p style={styles.text}>📍 {land.location}</p>
              <p style={styles.text}>🗺  {land.state}</p>
              <p style={styles.text}>🌾 {formatLandArea(land)}</p>

              <p style={styles.price}>RM {land.price.replace(/^RM\s*/i, "")}</p>

              <p style={styles.desc}>{land.description}</p>

              <a
                href={`https://wa.me/${land.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.whatsapp}
              >
                WhatsApp Agent
              </a>
            </div>
          </article>
        ))}
      </section>

      {/* NO RESULTS */}
      {filteredLands.length === 0 && (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🔍</div>

          <h3>No land listings found</h3>

          <p>
            Try another keyword or location.
          </p>

          <button
            onClick={clearFilters}
            style={styles.emptyButton}
          >
            Clear Filters
          </button>
        </div>
      )}
    </>
  );
}

const styles: any = {
  filterSection: {
    margin: "0 40px 15px",
    padding: 15,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },

  searchBox: {
    flex: "1 1 320px",
    minWidth: 240,
    display: "flex",
    alignItems: "center",
    background: "#F4F7FB",
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    padding: "0 12px",
  },

  searchIcon: {
    fontSize: 17,
  },

  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    padding: "12px 10px",
    fontSize: 15,
  },

  locationSelect: {
    flex: "0 1 240px",
    height: 44,
    padding: "0 12px",
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    background: "#F4F7FB",
    color: "#0F172A",
    fontSize: 14,
    cursor: "pointer",
  },

  clearButton: {
    height: 44,
    padding: "0 16px",
    background: "#E2E8F0",
    color: "#0F172A",
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
  },

  resultCount: {
    margin: "0 40px 15px",
    color: "#64748B",
    fontSize: 14,
  },

  grid: {
    padding: "0 40px 60px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 20,
  },

  card: {
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
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
    padding: 60,
    color: "#64748B",
  },

  emptyIcon: {
    fontSize: 40,
  },

  emptyButton: {
    marginTop: 10,
    padding: "10px 16px",
    background: "#1E3A8A",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};
