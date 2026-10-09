"use client";

import { useMemo, useState } from "react";
import ImageCarousel from "@/components/ImageCarousel";
import { getWhatsAppLink } from "@/lib/whatsapp";

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

export default function LandSearch({ lands }: { lands: any[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [propertyType, setPropertyType] = useState("all");
  const [state, setState] = useState("all");
  const [city, setCity] = useState("all");

  const PROPERTY_TYPES: Record<string, string[]> = {
    HOUSE: [
      "Terrace House",
      "Semi-D",
      "Bungalow",
      "Cluster House",
      "Townhouse",
    ],
    HIGH_RISE: [
      "Condominium",
      "Apartment",
      "Service Residence",
      "Flat",
    ],
    LAND: [
      "Residential Land",
      "Agricultural Land",
      "Commercial Land",
      "Industrial Land",
    ],
    COMMERCIAL: [
      "Shoplot",
      "Office",
      "Factory",
      "Warehouse",
      "Commercial Building",
    ],
  };

  const MALAYSIA_STATES = [
    "Johor",
    "Kedah",
    "Kelantan",
    "Melaka",
    "Negeri Sembilan",
    "Pahang",
    "Perak",
    "Perlis",
    "Pulau Pinang",
    "Sabah",
    "Sarawak",
    "Selangor",
    "Terengganu",
    "Kuala Lumpur",
    "Labuan",
    "Putrajaya",
  ];

  const states = MALAYSIA_STATES;

  const cities = useMemo(() => {
    const filteredByFilters = lands.filter((land) => {
      const matchesCategory =
        category === "all" ||
        land.propertyCategory === category;

      const matchesPropertyType =
        propertyType === "all" ||
        land.propertyType === propertyType;

      const matchesState =
        state === "all" ||
        land.state?.toLowerCase() === state.toLowerCase();

      return (
        matchesCategory &&
        matchesPropertyType &&
        matchesState
      );
    });

    return Array.from(
      new Set(
        filteredByFilters
          .map((land) => land.city)
          .filter(Boolean)
      )
    ).sort();
  }, [lands, category, propertyType, state]);

  const filteredLands = useMemo(() => {
    const query = search.trim().toLowerCase();

    return lands.filter((land) => {
      const searchableText = [
        land.title,
        land.location,
        land.state,
        land.city,
        land.description,
        land.propertyCategory,
        land.propertyType,
        land.acreage,
        land.price,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        query === "" || searchableText.includes(query);

      const matchesCategory =
        category === "all" ||
        land.propertyCategory === category;

      const matchesPropertyType =
        propertyType === "all" ||
        land.propertyType === propertyType;

      const matchesState =
        state === "all" ||
        land.state?.toLowerCase() === state.toLowerCase();

      const matchesCity =
        city === "all" ||
        land.city?.toLowerCase() === city.toLowerCase();

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPropertyType &&
        matchesState &&
        matchesCity
      );
    });
  }, [
    lands,
    search,
    category,
    propertyType,
    state,
    city,
  ]);

  const handleCategoryChange = (
    value: string
  ) => {
    setCategory(value);
    setPropertyType("all");
    setCity("all");
  };

  const handlePropertyTypeChange = (
    value: string
  ) => {
    setPropertyType(value);
    setCity("all");
  };

  const handleStateChange = (
    value: string
  ) => {
    setState(value);
    setCity("all");
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setPropertyType("all");
    setState("all");
    setCity("all");
  };

  const hasFilters =
    search ||
    category !== "all" ||
    propertyType !== "all" ||
    state !== "all" ||
    city !== "all";

  return (
    <>
      <style>{`
        @media (max-width: 600px) {
          .propvest-sales-category-access {
            margin-left: 12px !important;
            margin-right: 12px !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .propvest-sales-filters {
            margin-left: 12px !important;
            margin-right: 12px !important;
            padding: 12px !important;
          }
          .propvest-sales-filters input,
          .propvest-sales-filters select {
            box-sizing: border-box;
            min-height: 44px;
            min-width: 0;
            font-size: 16px !important;
          }
          .propvest-sales-results {
            margin-left: 12px !important;
            margin-right: 12px !important;
          }
          .propvest-sales-grid {
            padding-left: 12px !important;
            padding-right: 12px !important;
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
      {/* SALES CATEGORY QUICK ACCESS */}
      <section className="propvest-sales-category-access" style={styles.categoryQuickAccess}>
        {[
          {
            value: "HOUSE",
            label: "Houses",
            icon: "🏠",
          },
          {
            value: "HIGH_RISE",
            label: "High-Rise",
            icon: "🏢",
          },
          {
            value: "LAND",
            label: "Land",
            icon: "🌳",
          },
          {
            value: "COMMERCIAL",
            label: "Commercial",
            icon: "🏬",
          },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() =>
              handleCategoryChange(
                category === item.value
                  ? "all"
                  : item.value
              )
            }
            aria-pressed={category === item.value}
            style={{
              ...styles.categoryQuickButton,
              ...(category === item.value
                ? styles.categoryQuickButtonActive
                : {}),
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </section>

      {/* SEARCH & FILTER */}
      <section className="propvest-sales-filters" style={styles.filterSection}>
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔎</span>

          <input
            type="text"
            placeholder="Search property, location, state, city..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={styles.searchInput}
          />
        </div>

        {/* PROPERTY CATEGORY */}
        <select
          value={category}
          onChange={(e) =>
            handleCategoryChange(e.target.value)
          }
          style={styles.filterSelect}
        >
          <option value="all">
            🏘️ All Property Categories
          </option>

          <option value="HOUSE">
            🏠 Houses
          </option>

          <option value="HIGH_RISE">
            🏢 High-Rise
          </option>

          <option value="LAND">
            🌳 Land
          </option>

          <option value="COMMERCIAL">
            🏬 Commercial
          </option>
        </select>

        {/* PROPERTY TYPE */}
        <select
          value={propertyType}
          onChange={(e) =>
            handlePropertyTypeChange(e.target.value)
          }
          style={styles.filterSelect}
          disabled={category === "all"}
        >
          <option value="all">
            🏷️ All Property Types
          </option>

          {(category !== "all"
            ? PROPERTY_TYPES[category] || []
            : []
          ).map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>

        {/* STATE */}
        <select
          value={state}
          onChange={(e) =>
            handleStateChange(e.target.value)
          }
          style={styles.filterSelect}
        >
          <option value="all">
            🇲🇾 All States
          </option>

          {states.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>

        {/* CITY */}
        <select
          value={city}
          onChange={(e) =>
            setCity(e.target.value)
          }
          style={styles.filterSelect}
          disabled={cities.length === 0}
        >
          <option value="all">
            🏙️ All Cities
          </option>

          {cities.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            style={styles.clearButton}
          >
            Clear
          </button>
        )}
      </section>

      {/* RESULT COUNT */}
      <div className="propvest-sales-results" style={styles.resultCount}>
        Showing{" "}
        <strong>
          {filteredLands.length}
        </strong>{" "}
        of{" "}
        <strong>
          {lands.length}
        </strong>{" "}
        listings
      </div>

      {/* GRID */}
      <section className="propvest-sales-grid" style={styles.grid}>
        {filteredLands.map((land) => (
          <article
            key={land.id}
            style={styles.card}
          >
            <ImageCarousel
              images={land.images}
            />

            <div style={styles.content}>
              <h2 style={styles.cardTitle}>
                {land.title}
              </h2>

              <p style={styles.text}>
                📍 {land.location}
              </p>

              <p style={styles.text}>
                🗺️ {land.state}
                {land.city
                  ? ` • ${land.city}`
                  : ""}
              </p>

              {land.propertyType && (
                <p style={styles.text}>
                  🏷️ {land.propertyType}
                </p>
              )}

              <p style={styles.text}>
                📐 {formatLandArea(land)}
              </p>

              <p style={styles.price}>
                {formatPropertyPrice(land.price)}
              </p>

              <p style={styles.desc}>
                {land.description}
              </p>

              <a
                href={getWhatsAppLink(
                  land.whatsapp
                )}
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
          <div style={styles.emptyIcon}>
            🔍
          </div>

          <h3>
            No property listings found
          </h3>

          <p>
            Try another keyword, property type,
            state, or city.
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
  categoryQuickAccess: {
    margin: "0 40px 15px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: 12,
  },

  categoryQuickButton: {
    minHeight: 72,
    padding: "12px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    background: "#FFFFFF",
    color: "#1E3A8A",
    border: "1px solid #E2E8F0",
    borderRadius: 12,
    boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
  },

  categoryQuickButtonActive: {
    background: "#1E3A8A",
    color: "#FFFFFF",
    border: "1px solid #1E3A8A",
    boxShadow: "0 4px 12px rgba(30,58,138,0.2)",
  },

  filterSection: {
    margin: "0 40px 15px",
    padding: 15,
    background: "#fff",
    borderRadius: 12,
    boxShadow:
      "0 4px 14px rgba(0,0,0,0.06)",
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
    border:
      "1px solid #E2E8F0",
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
    color: "#000000",
    WebkitTextFillColor: "#000000",
    caretColor: "#000000",
  },

  filterSelect: {
    flex: "0 1 210px",
    height: 44,
    padding: "0 12px",
    border:
      "1px solid #E2E8F0",
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
    gridTemplateColumns:
      "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 20,
  },

  card: {
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow:
      "0 6px 18px rgba(0,0,0,0.08)",
  },

  content: {
    padding: 16,
  },

  cardTitle: {
    fontSize: 20,
    marginBottom: 10,
    color: "#000000",
    fontWeight: 700,
  },

  text: {
    color: "#000000",
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
    color: "#000000",
    lineHeight: "1.7",
    whiteSpace: "pre-line",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    textAlign: "left",
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
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
  },
};
