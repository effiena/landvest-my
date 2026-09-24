"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DeleteButton from "./components/DeleteButton";
import PayPalUpgrade from "@/components/PayPalUpgrade";
import BuyListingCredit from "@/components/BuyListingCredit";

export default function AdminClient({ lands, agent }: any) {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    location: "",
    state: "",
    areaValue: "",
    areaUnit: "acre",
    price: "",
    whatsapp: "",
    description: "",
  });

  const [files, setFiles] = useState<FileList | null>(null);
  const [editingLand, setEditingLand] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const baseLimit = agent?.plan === "professional" ? 10 : 3;
  const extraListings = agent?.extraListings || 0;
  const totalLimit = baseLimit + extraListings;
  const canCreate = lands.length < totalLimit;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files) return [];

    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();

      formData.append("file", files[i]);
      formData.append("upload_preset", "landvest-my");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/ntzbhkdp/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (data.secure_url) {
        urls.push(data.secure_url);
      }
    }

    return urls;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const photoLimit =
      agent?.plan === "professional" ? 20 : 3;

    if (!editingLand && !canCreate) {
      const extraPrice =
        agent?.plan === "professional"
          ? "RM1.70"
          : "RM2.90";

      alert(
        `You have reached your ${agent.plan} plan limit (${totalLimit} listings).\n\nAdditional listing is available at ${extraPrice} per listing.`
      );

      return;
    }

    if (files && files.length > photoLimit) {
      alert(
        `Your ${agent.plan} plan allows only ${photoLimit} photos per listing.`
      );

      return;
    }

    setLoading(true);

    try {
      const imageUrls = await uploadImages(files);

      const res = await fetch(
        editingLand
          ? `/api/lands/${editingLand.id}`
          : "/api/lands",
        {
          method: editingLand ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            areaValue: Number(form.areaValue),
            areaUnit: form.areaUnit,
            acreage: Number(form.areaValue) || 0,
            images: imageUrls,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Something went wrong.");
        return;
      }

      alert(
        data.message || "Listing saved successfully."
      );

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while saving the listing.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (land: any) => {
    setEditingLand(land);

    setForm({
      title: land.title || "",
      location: land.location || "",
      state: land.state || "",
      areaValue:
        land.areaValue ?? land.acreage ?? "",
      areaUnit:
        land.areaUnit ?? "acre",
      price: land.price || "",
      whatsapp: land.whatsapp || "",
      description: land.description || "",
    });

    setFiles(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCancel = () => {
    setEditingLand(null);

    setForm({
      title: "",
      location: "",
      state: "",
      areaValue: "",
      areaUnit: "acre",
      price: "",
      whatsapp: "",
      description: "",
    });

    setFiles(null);
  };

  const formatLandArea = (land: any) => {
    const value =
      land.areaValue ?? land.acreage ?? 0;

    const unit =
      land.areaUnit ?? "acre";

    if (unit === "psf") {
      return `${Number(value).toLocaleString()} PSF`;
    }

    if (unit === "hektar") {
      return `${Number(value).toLocaleString()} Hektar`;
    }

    return `${Number(value).toLocaleString()} Acres`;
  };

  return (
    <div style={styles.page}>
      {/* TOP BAR */}
      <div style={styles.topBar}>
        <div style={styles.brandSection}>
          <h1 style={styles.h1}>
            PropVest Agent Dashboard
          </h1>

          <p style={styles.sub}>
            Manage your land listings efficiently
          </p>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.badgeBox}>
            <span style={styles.badge}>
              Plan: {agent?.plan}
            </span>

            <span style={styles.badgeYellow}>
              {lands.length} / {totalLimit}
            </span>
          </div>

          <div style={styles.navButtons}>
            <Link
              href="/"
              style={styles.homeBtn}
            >
              🏠 Home
            </Link>

            <button
              onClick={handleLogout}
              style={styles.logoutBtn}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* UPGRADE */}
      {agent?.plan !== "professional" && (
        <div style={styles.warning}>
          <h3 style={styles.warningTitle}>
            🎁 Upgrade to PropVest Professional
          </h3>

          <p>
            Unlock premium features for only RM8.90/month.
          </p>

          <ul style={styles.featureList}>
            <li>✅ Up to 10 active listings</li>
            <li>✅ Up to 20 photos per listing</li>
            <li>✅ Better exposure</li>
          </ul>

          <PayPalUpgrade />
        </div>
      )}

      {/* EXTRA LISTINGS */}
      <div style={styles.extraBox}>
        <h3 style={styles.sectionTitle}>
          ➕ Need More Listings?
        </h3>

        <p>
          Current Plan: <b>{agent?.plan}</b>
        </p>

        <p>
          Additional listing price:
        </p>

        <ul style={styles.featureList}>
          <li>
            {agent?.plan === "professional"
              ? "Professional: RM1.70 / listing"
              : "Starter: RM2.90 / listing"}
          </li>
        </ul>

        <BuyListingCredit
          plan={agent?.plan}
        />
      </div>

      {/* MAIN GRID */}
      <div style={styles.grid}>
        {/* FORM */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            {editingLand
              ? "✏️ Edit Listing"
              : "➕ Create Listing"}
          </h2>

          <div style={styles.form}>
            <input
              name="title"
              placeholder="Title"
              value={form.title}
              onChange={handleChange}
              style={styles.input}
            />

            <input
              name="location"
              placeholder="Location"
              value={form.location}
              onChange={handleChange}
              style={styles.input}
            />

            <input
              name="state"
              placeholder="State"
              value={form.state}
              onChange={handleChange}
              style={styles.input}
            />

            {/* AREA */}
            <div style={styles.areaRow}>
              <input
                name="areaValue"
                type="number"
                step="any"
                placeholder="Land Area"
                value={form.areaValue}
                onChange={handleChange}
                style={styles.areaInput}
              />

              <select
                name="areaUnit"
                value={form.areaUnit}
                onChange={handleChange}
                style={styles.areaSelect}
              >
                <option value="acre">
                  Acres / Ekar
                </option>

                <option value="psf">
                  PSF
                </option>

                <option value="hektar">
                  Hektar
                </option>
              </select>
            </div>

            <input
              name="price"
              placeholder="Price"
              value={form.price}
              onChange={handleChange}
              style={styles.input}
            />

            <input
              name="whatsapp"
              placeholder="WhatsApp"
              value={form.whatsapp}
              onChange={handleChange}
              style={styles.input}
            />

            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              style={styles.textarea}
            />

            {/* PHOTO UPLOAD */}
            <div style={styles.fileUpload}>
              <label
                htmlFor="photo-upload"
                style={styles.chooseFileBtn}
              >
                📷 Choose File
              </label>

              <input
                id="photo-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) =>
                  setFiles(e.target.files)
                }
                style={{ display: "none" }}
              />

              <span style={styles.fileName}>
                {files && files.length > 0
                  ? `${files.length} file${
                      files.length > 1
                        ? "s"
                        : ""
                    } chosen`
                  : "No file chosen"}
              </span>
            </div>

            {/* SAVE */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                ...styles.primaryBtn,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading
                ? "Saving..."
                : editingLand
                ? "Update Listing"
                : "Create Listing"}
            </button>

            {/* CANCEL */}
            {editingLand && (
              <button
                onClick={handleCancel}
                style={styles.secondaryBtn}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* LISTINGS */}
        <div style={styles.listingsSection}>
          <h2 style={styles.mobileListingTitle}>
            📋 Your Listings
          </h2>

          <div style={styles.listings}>
            {lands.map((land: any) => (
              <div
                key={land.id}
                style={styles.listCard}
              >
                {/* IMAGE */}
                <div style={styles.imgRow}>
                  {land.images?.length ? (
                    land.images.map((img: any) => (
                      <img
                        key={img.id}
                        src={img.url}
                        alt={land.title}
                        style={styles.img}
                      />
                    ))
                  ) : (
                    <div style={styles.noImg}>
                      No Image
                    </div>
                  )}
                </div>

                {/* INFO */}
                <h3 style={styles.title}>
                  {land.title}
                </h3>

                <p style={styles.text}>
                  📍 {land.location}
                </p>

                <p style={styles.text}>
                  🗺 {land.state}
                </p>

                <p style={styles.areaText}>
                  🌾 {formatLandArea(land)}
                </p>

                <p style={styles.price}>
                  💰 {land.price}
                </p>

                {/* ACTIONS */}
                <div style={styles.actions}>
                  <button
                    onClick={() =>
                      handleEdit(land)
                    }
                    style={styles.editBtn}
                  >
                    ✏️ Edit
                  </button>

                  <DeleteButton id={land.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= DESIGN ================= */

const styles: any = {
  page: {
    padding: "20px",
    background: "#f4f6fb",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 20,
    flexWrap: "wrap",
  },

  brandSection: {
    minWidth: 0,
    flex: "1 1 300px",
  },

  h1: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.2,
  },

  sub: {
    color: "#666",
    marginTop: 8,
    marginBottom: 0,
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  badgeBox: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  badge: {
    background: "#111",
    color: "#fff",
    padding: "7px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold",
  },

  badgeYellow: {
    background: "#FACC15",
    padding: "7px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold",
  },

  navButtons: {
    display: "flex",
    gap: 8,
  },

  homeBtn: {
    padding: "9px 14px",
    background: "#1E3A8A",
    color: "#fff",
    borderRadius: 7,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: "bold",
  },

  logoutBtn: {
    padding: "9px 14px",
    background: "#DC2626",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "bold",
  },

  warning: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },

  warningTitle: {
    marginTop: 0,
  },

  featureList: {
    paddingLeft: 20,
    marginBottom: 12,
  },

  extraBox: {
    background: "#fff7ed",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },

  sectionTitle: {
    marginTop: 0,
    marginBottom: 8,
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(280px, 1fr) minmax(0, 2fr)",
    gap: 20,
    alignItems: "start",
  },

  card: {
    background: "#fff",
    padding: 18,
    borderRadius: 12,
    boxSizing: "border-box",
    width: "100%",
  },

  cardTitle: {
    marginTop: 0,
    marginBottom: 15,
    fontSize: 20,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    width: "100%",
  },

  input: {
    padding: 12,
    borderRadius: 7,
    border: "1px solid #ddd",
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  },

  textarea: {
    padding: 12,
    borderRadius: 7,
    border: "1px solid #ddd",
    minHeight: 110,
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "Arial, sans-serif",
  },

  areaRow: {
    display: "flex",
    gap: 8,
    width: "100%",
  },

  areaInput: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    border: "1px solid #ddd",
    borderRadius: 7,
    fontSize: 14,
    boxSizing: "border-box",
  },

  areaSelect: {
    width: 145,
    maxWidth: "42%",
    padding: 12,
    border: "1px solid #ddd",
    borderRadius: 7,
    fontSize: 14,
    background: "#fff",
    boxSizing: "border-box",
  },

  fileUpload: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    padding: "4px 0",
  },

  chooseFileBtn: {
    display: "inline-block",
    padding: "10px 15px",
    background: "#111",
    color: "#fff",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "bold",
  },

  fileName: {
    fontSize: 13,
    color: "#666",
    wordBreak: "break-word",
  },

  primaryBtn: {
    padding: 12,
    background: "#111",
    color: "#fff",
    borderRadius: 7,
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "bold",
    width: "100%",
  },

  secondaryBtn: {
    padding: 12,
    background: "#eee",
    color: "#333",
    borderRadius: 7,
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    width: "100%",
  },

  listingsSection: {
    minWidth: 0,
    width: "100%",
  },

  mobileListingTitle: {
    marginTop: 0,
    marginBottom: 12,
    fontSize: 20,
  },

  listings: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 15,
  },

  listCard: {
    background: "#fff",
    borderRadius: 10,
    padding: 10,
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "hidden",
  },

  imgRow: {
    display: "flex",
    gap: 5,
    overflowX: "auto",
    width: "100%",
    paddingBottom: 3,
  },

  img: {
    width: 70,
    height: 70,
    objectFit: "cover",
    borderRadius: 6,
    flexShrink: 0,
  },

  noImg: {
    padding: 20,
    color: "#999",
    background: "#f5f5f5",
    borderRadius: 6,
    width: "100%",
    textAlign: "center",
    boxSizing: "border-box",
  },

  title: {
    margin: "10px 0 6px",
    fontSize: 16,
    lineHeight: 1.3,
    overflowWrap: "anywhere",
  },

  text: {
    fontSize: 13,
    color: "#555",
    margin: "5px 0",
    overflowWrap: "anywhere",
  },

  areaText: {
    fontSize: 13,
    color: "#166534",
    fontWeight: "bold",
    margin: "6px 0",
  },

  price: {
    fontWeight: "bold",
    marginTop: 7,
    overflowWrap: "anywhere",
  },

  actions: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 12,
  },

  editBtn: {
    padding: "8px 12px",
    background: "#FACC15",
    color: "#111",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
    flex: 1,
  },
};

/* ================= MOBILE ================= */

if (typeof document !== "undefined") {
  const styleId = "propvest-admin-responsive";

  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");

    style.id = styleId;

    style.innerHTML = `
      @media (max-width: 768px) {
        body {
          margin: 0;
          overflow-x: hidden;
        }

        .propvest-admin-mobile {
          width: 100%;
        }
      }

      @media (max-width: 600px) {
        input,
        textarea,
        select,
        button {
          font-size: 16px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }
}
