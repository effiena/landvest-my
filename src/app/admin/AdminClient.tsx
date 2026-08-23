"use client";

import { useState } from "react";
import DeleteButton from "./components/DeleteButton";
import PayPalUpgrade from "@/components/PayPalUpgrade";
import BuyListingCredit from "@/components/BuyListingCredit";

export default function AdminClient({ lands, agent }: any) {
  const [form, setForm] = useState({
    title: "",
    location: "",
    state: "",
    acreage: "",
    price: "",
    whatsapp: "",
    description: "",
  });

  const [files, setFiles] = useState<FileList | null>(null);
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

    console.log("Images being sent:", imageUrls.length);

    console.log("FORM =", form);
    console.log("FORM ACREAGE =", form.acreage);
    console.log("NUMBER =", Number(form.acreage));


    const res = await fetch(
      editingLand ? `/api/lands/${editingLand.id}` : "/api/lands",
      {
        method: editingLand ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          acreage: Number(form.acreage),
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
      acreage: land.acreage,
      price: land.price,
      whatsapp: land.whatsapp,
      description: land.description,
    });
  };

  return (
    <div style={styles.page}>
      {/* TOP BAR */}
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.h1}>🏡 LandVest Admin Panel</h1>
          <p style={styles.sub}>
            Manage your land listings efficiently
          </p>
        </div>

        <div style={styles.badgeBox}>
          <span style={styles.badge}>
            Plan: {agent?.plan}
          </span>
          <span style={styles.badgeYellow}>
            {lands.length} / {totalLimit}
          </span>
        </div>
      </div>


      {/* PLAN OPTIONS */}

      {agent?.plan !== "professional" && (
      <div style={styles.warning}>

      <h3>
        🎁 Upgrade to LandVest Professional
      </h3>

      <p>
        Unlock premium features for only RM8.90/month.
      </p>

      <ul>
      <li>✅ Up to 10 active listings</li>
      <li>✅ Up to 20 photos per listing</li>
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
      <div style={styles.grid}>
        {/* FORM */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            {editingLand ? "✏️ Edit Listing" : "➕ Create Listing"}
          </h2>

          <div style={styles.form}>
            <input name="title" placeholder="Title" value={form.title} onChange={handleChange} style={styles.input} />
            <input name="location" placeholder="Location" value={form.location} onChange={handleChange} style={styles.input} />
            <input name="state" placeholder="State" value={form.state} onChange={handleChange} style={styles.input} />
            <input name="acreage" placeholder="Acreage" value={form.acreage} onChange={handleChange} style={styles.input} />
            <input name="price" placeholder="Price" value={form.price} onChange={handleChange} style={styles.input} />
            <input name="whatsapp" placeholder="WhatsApp" value={form.whatsapp} onChange={handleChange} style={styles.input} />

            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              style={styles.textarea}
            />

            <input type="file" multiple onChange={(e) => setFiles(e.target.files)} />

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
                    acreage: "",
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
        <div style={styles.listings}>
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
              <p style={styles.price}>💰 {land.price}</p>

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
};
