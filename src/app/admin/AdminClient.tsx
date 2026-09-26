"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DeleteButton from "./components/DeleteButton";
import PayPalUpgrade from "@/components/PayPalUpgrade";
import BuyListingCredit from "@/components/BuyListingCredit";

export default function AdminClient({ lands, agent }: any) {

  const router = useRouter();

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
  const [importText, setImportText] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [editingLand, setEditingLand] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // PLAN LOGIC


  const baseLimit = agent?.plan === "professional" ? 10 : 3;

  const extraListings = agent?.extraListings || 0;

  const totalLimit = baseLimit + extraListings;

  const canCreate = lands.length < totalLimit;
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
        { method: "POST", body: formData }
      );

      const data = await res.json();
      if (data.secure_url) urls.push(data.secure_url);
    }

    return urls;
  };


  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const photoLimit = agent?.plan === "professional" ? 20 : 3;


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

    const imageUrls = await uploadImages(files);

    const res = await fetch(
      editingLand ? `/api/lands/${editingLand.id}` : "/api/lands",
      {
        method: editingLand ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          areaValue: Number(form.areaValue),
          areaUnit: form.areaUnit,
          acreage: Number(form.areaValue) || 0,
          images: imageUrls,
        }),
      }
    );


    setLoading(false);

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Something went wrong.");
      return;
    }

    alert(data.message || "Listing saved successfully.");

    window.location.reload();

  };
  const handleEdit = (land: any) => {
    setEditingLand(land);
    setForm({
      title: land.title,
      location: land.location,
      state: land.state,
      areaValue: land.areaValue ?? land.acreage ?? "",
      areaUnit: land.areaUnit ?? "acre",
      price: land.price,
      whatsapp: land.whatsapp,
      description: land.description,
    });
  };

  const responsiveStyles = `
    .propvest-admin-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 20px;
      align-items: start;
    }

    .propvest-admin-listings {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 15px;
    }

    @media (max-width: 768px) {
      .propvest-admin-grid {
        grid-template-columns: 1fr !important;
        gap: 15px !important;
      }

      .propvest-admin-listings {
        grid-template-columns: 1fr !important;
        gap: 12px !important;
      }
    }

    @media (max-width: 480px) {
      .propvest-admin-grid,
      .propvest-admin-listings {
        width: 100%;
      }

      input,
      textarea,
      select {
        box-sizing: border-box;
        max-width: 100%;
      }

      .propvest-area-row {
        display: grid !important;
        grid-template-columns: 1fr 110px !important;
        gap: 8px !important;
      }
    }
  `;

  return (
    <>
    <style>{responsiveStyles}</style>
    <div style={styles.page}>
    {/* TOP BAR */}
    <div style={styles.topBar}>
      <div>
        <h1 style={styles.h1}>PropVest Agent Dashboard</h1>
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
          <Link href="/" style={styles.homeBtn}>
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


      {/* PLAN OPTIONS */}

      {agent?.plan !== "professional" && (
      <div style={styles.warning}>

      <h3>
        🎁 Upgrade to PropVest Professional
      </h3>

      <p>
        Unlock premium features for only RM8.90/month.
      </p>

      <ul>
      <li>✅ 10 active listings</li>
      <li>✅ 20 photos per listing</li>
      <li>✅ Better exposure</li>
      </ul>

      <PayPalUpgrade />

      </div>
      )}


      {/* EXTRA LISTING PURCHASE */}

      <div style={{
        background:"#fff7ed",
        padding:15,
        borderRadius:8,
        marginBottom:15
      }}>

      <h3>
      ➕ Need More Listings?
      </h3>


      <p>
        Current Plan: <b>{agent?.plan}</b>
      </p>


      <p>
        Additional listing price:
      </p>


      <ul>

      <li>
      {agent?.plan === "professional"
        ? "Professional: RM1.70 / listing"
        : "Starter: RM2.90 / listing"}
      </li>

      </ul>


      {/* Next component */}
      <BuyListingCredit
        plan={agent?.plan}
      />


      </div>





      {/* CONTENT GRID */}
      <div className="propvest-admin-grid" style={styles.grid}>
        {/* FORM */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            {editingLand ? "✏️ Edit Listing" : "➕ Create Listing"}
          </h2>

          <div style={styles.form}>
            <input name="title" placeholder="Title" value={form.title} onChange={handleChange} style={styles.input} />
            <input name="location" placeholder="Location" value={form.location} onChange={handleChange} style={styles.input} />
            <input name="state" placeholder="State" value={form.state} onChange={handleChange} style={styles.input} />
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
                <option value="acre">Acres / Ekar</option>
                <option value="psf">PSF</option>
                <option value="hektar">Hektar</option>
              </select>
            </div>

            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontWeight: 700,
                  color: "#0b1f3a",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              >
                RM
              </span>

              <input
                name="price"
                placeholder="0"
                value={String(form.price || "").replace(/^RM\s*/i, "")}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/^RM\s*/i, "")
                    .replace(/[^0-9.,]/g, "");

                  setForm({
                    ...form,
                    price: value,
                  });
                }}
                style={{
                  ...styles.input,
                  paddingLeft: 42,
                }}
              />
            </div>
            <input name="whatsapp" placeholder="WhatsApp" value={form.whatsapp} onChange={handleChange} style={styles.input} />

            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              style={styles.textarea}
            />

            <div style={styles.fileUpload}>
              <label htmlFor="photo-upload" style={styles.chooseFileBtn}>
                Choose File
              </label>

              <input
                id="photo-upload"
                type="file"
                multiple
                onChange={(e) => setFiles(e.target.files)}
                style={{ display: "none" }}
              />

              <span style={styles.fileName}>
                {files && files.length > 0
                  ? `${files.length} file${files.length > 1 ? "s" : ""} chosen`
                  : "No file chosen"}
              </span>
            </div>


            <button
              onClick={handleSubmit}
              disabled={loading}
              style={styles.primaryBtn}
            >
              {loading ? "Saving..." : editingLand ? "Update Listing" : "Create Listing"}
            </button>

            {editingLand && (
              <button
                onClick={() => {
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
                }}
                style={styles.secondaryBtn}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* LISTINGS */}
        <div className="propvest-admin-listings" style={styles.listings}>
          {lands.map((land: any) => (
            <div key={land.id} style={styles.listCard}>
              {/* IMAGE */}
              <div style={styles.imgRow}>
                {land.images?.length ? (
                  land.images.map((img: any) => (
                    <img key={img.id} src={img.url} style={styles.img} />
                  ))
                ) : (
                  <div style={styles.noImg}>No Image</div>
                )}
              </div>

              {/* INFO */}
              <h3 style={styles.title}>{land.title}</h3>
              <p style={styles.text}>📍 {land.location}</p>
              <p style={styles.text}>🗺 {land.state}</p>
              <p style={styles.price}>💰 RM {String(land.price).replace(/^RM\s*/i, "")}</p>

              {/* ACTIONS */}
              <div style={styles.actions}>
                <button onClick={() => handleEdit(land)} style={styles.editBtn}>
                  Edit
                </button>

                <DeleteButton id={land.id} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}

/* ================= DESIGN ================= */
const styles: any = {
  page: {
    padding: 25,
    background: "#f4f6fb",
    minHeight: "100vh",
    fontFamily: "Arial",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 15,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  navButtons: {
    display: "flex",
    gap: 8,
  },

  homeBtn: {
    padding: "8px 14px",
    background: "#1E3A8A",
    color: "#fff",
    borderRadius: 7,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: "bold",
  },

  logoutBtn: {
    padding: "8px 14px",
    background: "#DC2626",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "bold",
  },

  h1: { margin: 0 },
  sub: { color: "#666" },

  badgeBox: { display: "flex", gap: 10 },

  badge: {
    background: "#111",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
  },

  badgeYellow: {
    background: "#FACC15",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
  },

  warning: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: 20,
  },

  card: {
    background: "#fff",
    padding: 15,
    borderRadius: 10,
  },

  cardTitle: { marginBottom: 10 },

  form: { display: "flex", flexDirection: "column", gap: 8 },

  input: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ddd",
  },

  textarea: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ddd",
    minHeight: 80,
  },

  primaryBtn: {
    padding: 10,
    background: "#111",
    color: "#fff",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
  },

  secondaryBtn: {
    padding: 10,
    background: "#eee",
    borderRadius: 6,
    border: "none",
  },

  listings: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 15,
  },

  listCard: {
    background: "#fff",
    borderRadius: 10,
    padding: 10,
  },

  imgRow: {
    display: "flex",
    gap: 5,
    overflowX: "auto",
  },

  img: {
    width: 60,
    height: 60,
    objectFit: "cover",
    borderRadius: 6,
  },

  noImg: {
    padding: 20,
    color: "#999",
  },

  title: { margin: "10px 0 5px" },
  text: { fontSize: 13, color: "#555" },
  price: { fontWeight: "bold", marginTop: 5 },

  actions: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 10,
  },

  editBtn: {
    padding: "6px 10px",
    background: "#FACC15",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },

  areaRow: {
    display: "flex",
    gap: 10,
    width: "100%",
  },

  areaInput: {
    flex: 1,
    padding: 12,
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
  },

  areaSelect: {
    width: 170,
    padding: 12,
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    background: "#fff",
  },

  fileUpload: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  chooseFileBtn: {
    display: "inline-block",
    padding: "10px 16px",
    background: "#111",
    color: "#fff",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "bold",
  },

  fileName: {
    fontSize: 14,
    color: "#666",
  },


};
