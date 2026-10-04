"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DeleteButton from "./components/DeleteButton";
import StripeCheckout from "./StripeCheckout";
import { PLANS } from "@/lib/plans";

export default function AdminClient({
  lands,
  agent,
  wantToBuy = [],
  wantToSell = [],
  contactMessages = [],
}: any) {

  const router = useRouter();
  const [visibleWantToBuy, setVisibleWantToBuy] = useState(wantToBuy);
  const [visibleWantToSell, setVisibleWantToSell] = useState(wantToSell);
  const [visibleContactMessages, setVisibleContactMessages] =
    useState(contactMessages);

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

  const handleContactStatus = async (
    id: number,
    status: "read" | "replied" | "closed"
  ) => {
    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to update message.");
        return;
      }

      setVisibleContactMessages((current: any[]) =>
        current.map((message) =>
          message.id === id
            ? { ...message, status }
            : message
        )
      );
    } catch (error) {
      console.error(error);
      alert("Unable to update message.");
    }
  };

  const handleDeleteContact = async (id: number) => {
    if (!window.confirm("Delete this Contact Developer message?")) {
      return;
    }

    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to delete message.");
        return;
      }

      setVisibleContactMessages((current: any[]) =>
        current.filter((message) => message.id !== id)
      );
    } catch (error) {
      console.error(error);
      alert("Unable to delete message.");
    }
  };


  const [form, setForm] = useState({
    title: "",
    location: "",
    city: "",
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
  const [statusLoading, setStatusLoading] = useState<number | null>(null);

  const updateWantToBuyStatus = async (id: number, status: string) => {
    setStatusLoading(id);

    const currentBuyer = visibleWantToBuy.find(
      (item: any) => item.id === id
    );

    // Remove closed enquiry immediately from the screen
    if (status === "closed") {
      setVisibleWantToBuy((current: any[]) =>
        current.filter((item) => item.id !== id)
      );
    }

    try {
      const res = await fetch(`/api/want-to-buy/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Restore the enquiry if the database update failed
        if (status === "closed" && currentBuyer) {
          setVisibleWantToBuy((current: any[]) => {
            if (current.some((item) => item.id === id)) {
              return current;
            }

            return [...current, currentBuyer];
          });
        }

        alert(data.error || "Unable to update status.");
        return;
      }

      // For non-closed status changes, update the card locally
      if (status !== "closed") {
        setVisibleWantToBuy((current: any[]) =>
          current.map((item: any) =>
            item.id === id ? { ...item, status } : item
          )
        );
      }
    } catch {
      // Restore the enquiry if the request failed
      if (status === "closed" && currentBuyer) {
        setVisibleWantToBuy((current: any[]) => {
          if (current.some((item) => item.id === id)) {
            return current;
          }

          return [...current, currentBuyer];
        });
      }

      alert("Unable to update enquiry status.");
    } finally {
      setStatusLoading(null);
    }
  };

  const updateWantToSellStatus = async (id: number, status: string) => {
    const currentOwner = visibleWantToSell.find(
      (item: any) => item.id === id
    );

    if (status === "closed") {
      setVisibleWantToSell((current: any[]) =>
        current.filter((item) => item.id !== id)
      );
    }

    try {
      const res = await fetch(`/api/want-to-sell/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (status === "closed" && currentOwner) {
          setVisibleWantToSell((current: any[]) => {
            if (current.some((item) => item.id === id)) {
              return current;
            }

            return [...current, currentOwner];
          });
        }

        alert(data.error || "Unable to update owner enquiry.");
        return;
      }

      if (status !== "closed") {
        setVisibleWantToSell((current: any[]) =>
          current.map((item: any) =>
            item.id === id ? { ...item, status } : item
          )
        );
      }
    } catch {
      if (status === "closed" && currentOwner) {
        setVisibleWantToSell((current: any[]) => {
          if (current.some((item: any) => item.id === id)) {
            return current;
          }

          return [...current, currentOwner];
        });
      }

      alert("Unable to update owner enquiry.");
    }
  };

  // PLAN LOGIC


  const planConfig =
    PLANS[agent?.plan as keyof typeof PLANS] || PLANS.starter;

  const baseLimit = planConfig.listings;

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

    const photoLimit = planConfig.photos;


    if (!editingLand && !canCreate) {

      const extraPrice =
        agent?.plan === "ceo"
          ? "Free"
          : `RM${planConfig.extraListingPrice.toFixed(2)}`;


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
      city: land.city || "",
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

      .propvest-admin-topbar {
        flex-direction: column !important;
        align-items: stretch !important;
      }

      .propvest-admin-header-right {
        justify-content: flex-start !important;
        width: 100% !important;
      }

      .propvest-admin-nav-buttons {
        width: 100% !important;
      }

      .propvest-admin-nav-buttons a,
      .propvest-admin-nav-buttons button {
        flex: 1 !important;
        text-align: center !important;
      }
    }
  `;

  return (
    <>
    <style>{responsiveStyles}</style>
    <div style={styles.page}>
    {/* TOP BAR */}
    <div className="propvest-admin-topbar" style={styles.topBar}>
      <div>
        <h1 style={styles.h1}>
          Welcome, {agent?.name} 👋
        </h1>

        <p style={styles.sub}>
          PropVest {planConfig.name} Member · Manage your land listings efficiently
        </p>
      </div>

      <div className="propvest-admin-header-right" style={styles.headerRight}>
        <div style={styles.badgeBox}>
          <span style={styles.badge}>
            Plan: {agent?.plan}
          </span>

          <span style={styles.badgeYellow}>
            Listings: {lands.length} / {totalLimit}
          </span>

          {extraListings > 0 && (
            <span style={styles.badgeExtra}>
              Extra Listings: {extraListings}
            </span>
          )}
        </div>

        <div className="propvest-admin-nav-buttons" style={styles.navButtons}>
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


      {/* PLAN SUMMARY */}

      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          padding: 20,
          marginBottom: 20,
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          color: "#111827",
        }}
      >
        <h2 style={{ margin: "0 0 10px", color: "#111827" }}>
          {planConfig.name} Plan
        </h2>

        <div style={{ display: "grid", gap: 6 }}>
          <div>
            📋 Included listings: <strong>{planConfig.listings}</strong>
          </div>

          <div>
            📸 Photos per listing: <strong>{planConfig.photos}</strong>
          </div>

          <div>
            ➕ Additional listing:{" "}
            <strong>
              {agent?.plan === "ceo"
                ? "Free"
                : `RM${planConfig.extraListingPrice.toFixed(2)}`}
            </strong>
          </div>

          {agent?.plan === "professional" && (
            <div>
              💳 Membership: <strong>RM12.90/month</strong>
            </div>
          )}
        </div>
      </div>

      {/* PLAN OPTIONS */}

      {agent?.plan !== "professional" && agent?.plan !== "ceo" && (
      <div style={styles.warning}>

      <h3>
        🎁 Upgrade to PropVest Professional
      </h3>

      <p>
        Unlock premium features for only RM12.90/month.
      </p>

      <ul>
      <li>✅ 10 active listings</li>
      <li>✅ 20 photos per listing</li>
      <li>✅ Better exposure</li>
      </ul>

      <StripeCheckout type="subscription" />

      <div style={{ marginTop: "12px" }}>
      </div>

      </div>
      )}


      {/* EXTRA LISTING PURCHASE */}

      {agent?.plan !== "ceo" && (
      <div style={{
        background:"#fff7ed",
        padding:15,
        borderRadius:8,
        marginBottom:15,
        color:"#000000"
      }}>

      <h3 style={{
        color:"#000000",
        marginTop:0
      }}>
      ➕ Need More Listings?
      </h3>


      <p style={{ color:"#000000" }}>
        Current Plan: <b>{agent?.plan}</b>
      </p>


      <p style={{ color:"#000000" }}>
        Additional listing price:
      </p>


      <ul style={{ color:"#000000" }}>

      <li style={{ color:"#000000" }}>
        {agent?.plan === "ceo"
          ? "CEO: Free"
          : `${planConfig.name}: RM${planConfig.extraListingPrice.toFixed(2)} / listing`}
      </li>

      </ul>


      <StripeCheckout
        type="listing"
        quantity={1}
      />



      </div>
      )}





      {(agent?.name?.trim().toLowerCase() === "yoori" ||
        agent?.name?.trim().toLowerCase() === "della") && (
        <>
          {/* BUYER INQUIRIES BUTTON + POPUP */}
          <div
            style={{
              marginBottom: 14,
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <button
              type="button"
              onClick={() => {
                const buyerWindow = document.getElementById(
                  "buyer-inquiries-window"
                );

                if (buyerWindow) {
                  buyerWindow.style.display = "flex";
                }
              }}
              style={{
                width: "100%",
                maxWidth: 650,
                padding: "18px 24px",
                borderRadius: 14,
                border: "1px solid #BFDBFE",
                background: "#EFF6FF",
                color: "#1E3A8A",
                cursor: "pointer",
                fontSize: 17,
                fontWeight: 800,
                boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
              }}
            >
              🛒 Buyer Inquiries
              <span
                style={{
                  marginLeft: 10,
                  background: "#2563EB",
                  color: "#FFFFFF",
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 13,
                }}
              >
                {visibleWantToBuy.length}
              </span>
            </button>

            <div
              id="buyer-inquiries-window"
              style={{
                display: "none",
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(15, 23, 42, 0.65)",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 850,
                  maxHeight: "90vh",
                  overflowY: "auto",
                  background: "#FFFFFF",
                  borderRadius: 18,
                  padding: 28,
                  boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 15,
                    marginBottom: 22,
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        color: "#1E3A8A",
                        fontSize: 23,
                      }}
                    >
                      🛒 Buyer Inquiries
                    </h2>
                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#64748B",
                      }}
                    >
                      Buyer enquiries assigned to {agent?.name}.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const buyerWindow = document.getElementById(
                        "buyer-inquiries-window"
                      );

                      if (buyerWindow) {
                        buyerWindow.style.display = "none";
                      }
                    }}
                    style={{
                      border: "none",
                      background: "#F1F5F9",
                      color: "#334155",
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      cursor: "pointer",
                      fontSize: 20,
                      fontWeight: 800,
                    }}
                  >
                    ×
                  </button>
                </div>

                {visibleWantToBuy.length === 0 ? (
                  <div
                    style={{
                      padding: 30,
                      textAlign: "center",
                      background: "#F8FAFC",
                      borderRadius: 12,
                      color: "#64748B",
                    }}
                  >
                    No Buyer Inquiries yet.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: 16,
                    }}
                  >
                    {visibleWantToBuy.map((buyer: any) => (
                      <div
                        key={buyer.id}
                        style={styles.wtbCard}
                      >
                        <div style={styles.wtbCardTop}>
                          <div>
                            <h3 style={styles.wtbBuyer}>
                              👤 {buyer.buyerName}
                            </h3>

                            <p style={styles.wtbMeta}>
                              📅{" "}
                              {new Date(buyer.createdAt).toLocaleString(
                                "en-MY",
                                {
                                  timeZone: "Asia/Kuala_Lumpur",
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  hour12: true,
                                }
                              )}
                            </p>
                          </div>

                          <div style={styles.wtbStatusActions}>
                            <select
                              value={buyer.status || "new"}
                              disabled={statusLoading === buyer.id}
                              onChange={(e) =>
                                updateWantToBuyStatus(
                                  buyer.id,
                                  e.target.value
                                )
                              }
                              style={styles.wtbStatusSelect}
                            >
                              <option value="new">🆕 New</option>
                              <option value="contacted">
                                📞 Contacted
                              </option>
                              <option value="closed">✅ Closed</option>
                            </select>

                            <button
                              type="button"
                              title="Close inquiry"
                              aria-label={`Close inquiry from ${buyer.buyerName}`}
                              disabled={statusLoading === buyer.id}
                              onClick={() =>
                                updateWantToBuyStatus(
                                  buyer.id,
                                  "closed"
                                )
                              }
                              style={styles.wtbCloseButton}
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        <div style={styles.wtbGrid}>
                          <div style={styles.wtbGridItem}>
                            <strong style={styles.wtbLabel}>
                              📱 WhatsApp
                            </strong>
                            <p style={styles.wtbValue}>
                              {buyer.whatsapp}
                            </p>
                          </div>

                          <div>
                            <strong>📍 Preferred Area</strong>
                            <p>{buyer.city}</p>
                          </div>

                          <div>
                            <strong>🏠 Property / Land Type</strong>
                            <p>
                              {buyer.propertyType || "Not specified"}
                            </p>
                          </div>

                          <div>
                            <strong>📐 Required Size</strong>
                            <p>
                              {buyer.requiredSize || "Not specified"}
                            </p>
                          </div>

                          <div>
                            <strong>💰 Budget</strong>
                            <p>{buyer.budget || "Not specified"}</p>
                          </div>

                          <div>
                            <strong>📊 CTOS / CCRIS</strong>
                            <p>
                              {buyer.ctosCcrisStatus ||
                                "Not provided"}
                            </p>
                          </div>

                        </div>

                        {buyer.additionalRequirements && (
                          <div style={styles.wtbRequirements}>
                            <strong style={styles.wtbLabel}>
                              📝 Additional Requirements
                            </strong>
                            <p style={styles.wtbValue}>
                              {buyer.additionalRequirements}
                            </p>
                          </div>
                        )}

                        <div style={styles.wtbActions}>
                          <a
                            href={`https://wa.me/${String(
                              buyer.whatsapp
                            ).replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.wtbWhatsapp}
                          >
                            💬 Contact Buyer
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* OWNER INQUIRIES BUTTON + POPUP */}
          <div
            style={{
              marginBottom: 28,
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <button
              type="button"
              onClick={() => {
                const ownerWindow = document.getElementById(
                  "owner-inquiries-window"
                );

                if (ownerWindow) {
                  ownerWindow.style.display = "flex";
                }
              }}
              style={{
                width: "100%",
                maxWidth: 650,
                padding: "18px 24px",
                borderRadius: 14,
                border: "1px solid #BBF7D0",
                background: "#F0FDF4",
                color: "#166534",
                cursor: "pointer",
                fontSize: 17,
                fontWeight: 800,
                boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
              }}
            >
              🏡 Owner Inquiries
              <span
                style={{
                  marginLeft: 10,
                  background: "#16A34A",
                  color: "#FFFFFF",
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 13,
                }}
              >
                {visibleWantToSell.length}
              </span>
            </button>
            </div>

            <div
              id="owner-inquiries-window"
              style={{
                display: "none",
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(15, 23, 42, 0.65)",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 850,
                  maxHeight: "90vh",
                  overflowY: "auto",
                  background: "#FFFFFF",
                  borderRadius: 18,
                  padding: 28,
                  boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 15,
                    marginBottom: 22,
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        color: "#166534",
                        fontSize: 23,
                      }}
                    >
                      🏡 Owner Inquiries
                    </h2>
                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#64748B",
                      }}
                    >
                      Property owners who want to sell.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const ownerWindow = document.getElementById(
                        "owner-inquiries-window"
                      );

                      if (ownerWindow) {
                        ownerWindow.style.display = "none";
                      }
                    }}
                    style={{
                      border: "none",
                      background: "#F1F5F9",
                      color: "#334155",
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      cursor: "pointer",
                      fontSize: 20,
                      fontWeight: 800,
                    }}
                  >
                    ×
                  </button>
                </div>

                {visibleWantToSell.length === 0 ? (
                  <div
                    style={{
                      padding: 30,
                      textAlign: "center",
                      background: "#F8FAFC",
                      borderRadius: 12,
                      color: "#64748B",
                    }}
                  >
                    No Owner Inquiries yet.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: 16,
                    }}
                  >
                    {visibleWantToSell.map((owner: any) => (
                      <div
                        key={owner.id}
                        style={{
                          border: "1px solid #E2E8F0",
                          borderRadius: 14,
                          padding: 20,
                          background: "#FFFFFF",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 15,
                            flexWrap: "wrap",
                            marginBottom: 16,
                          }}
                        >
                          <div>
                            <h3
                              style={{
                                margin: 0,
                                color: "#166534",
                                fontSize: 18,
                              }}
                            >
                              👤 {owner.ownerName}
                            </h3>

                            <p
                              style={{
                                margin: "6px 0 0",
                                color: "#64748B",
                                fontSize: 13,
                              }}
                            >
                              📅{" "}
                              {new Date(
                                owner.createdAt
                              ).toLocaleString("en-MY", {
                                timeZone: "Asia/Kuala_Lumpur",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: true,
                              })}
                            </p>
                          </div>

                          <select
                            value={owner.status || "new"}
                            onChange={(e) =>
                              updateWantToSellStatus(
                                owner.id,
                                e.target.value
                              )
                            }
                            style={{
                              padding: "8px 10px",
                              borderRadius: 8,
                              border: "1px solid #CBD5E1",
                              background: "#FFFFFF",
                              color: "#334155",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <option value="new">🆕 New</option>
                            <option value="contacted">
                              📞 Contacted
                            </option>
                            <option value="closed">✅ Closed</option>
                          </select>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              padding: 14,
                              background: "#F8FAFC",
                              borderRadius: 10,
                            }}
                          >
                            <strong>📱 WhatsApp</strong>
                            <p style={{ margin: "5px 0 0" }}>
                              {owner.whatsapp || "Not provided"}
                            </p>
                          </div>

                          <div
                            style={{
                              padding: 14,
                              background: "#F8FAFC",
                              borderRadius: 10,
                            }}
                          >
                            <strong>🗺️ State</strong>
                            <p style={{ margin: "5px 0 0" }}>
                              {owner.state || "Not provided"}
                            </p>
                          </div>

                          <div
                            style={{
                              padding: 14,
                              background: "#F8FAFC",
                              borderRadius: 10,
                            }}
                          >
                            <strong>📍 City / Area</strong>
                            <p style={{ margin: "5px 0 0" }}>
                              {owner.city || "Not provided"}
                            </p>
                          </div>

                          <div
                            style={{
                              padding: 14,
                              background: "#F8FAFC",
                              borderRadius: 10,
                              gridColumn: "1 / -1",
                            }}
                          >
                            <strong>🏠 Full Property Address</strong>
                            <p
                              style={{
                                margin: "5px 0 0",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {owner.propertyAddress ||
                                "Not provided"}
                            </p>
                          </div>

                          <div
                            style={{
                              padding: 14,
                              background: "#F8FAFC",
                              borderRadius: 10,
                            }}
                          >
                            <strong>🏡 Property Type</strong>
                            <p style={{ margin: "5px 0 0" }}>
                              {owner.propertyType ||
                                "Not specified"}
                            </p>
                          </div>

                          <div
                            style={{
                              padding: 14,
                              background: "#F8FAFC",
                              borderRadius: 10,
                            }}
                          >
                            <strong>📐 Property Size</strong>
                            <p style={{ margin: "5px 0 0" }}>
                              {owner.propertySize ||
                                "Not specified"}
                            </p>
                          </div>

                          <div
                            style={{
                              padding: 14,
                              background: "#F8FAFC",
                              borderRadius: 10,
                            }}
                          >
                            <strong>💰 Expected Price</strong>
                            <p style={{ margin: "5px 0 0" }}>
                              {owner.expectedPrice ||
                                "Not specified"}
                            </p>
                          </div>

                          <div
                            style={{
                              padding: 14,
                              background: "#F8FAFC",
                              borderRadius: 10,
                            }}
                          >
                            <strong>📜 Tenure</strong>
                            <p style={{ margin: "5px 0 0" }}>
                              {owner.tenure || "Not specified"}
                            </p>
                          </div>

                          <div
                            style={{
                              padding: 14,
                              background: "#F8FAFC",
                              borderRadius: 10,
                            }}
                          >
                            <strong>🌱 Bumi Status</strong>
                            <p style={{ margin: "5px 0 0" }}>
                              {owner.bumiStatus ||
                                "Not specified"}
                            </p>
                          </div>
                        </div>

                        {owner.additionalDetails && (
                          <div
                            style={{
                              marginTop: 12,
                              padding: 14,
                              background: "#F8FAFC",
                              borderRadius: 10,
                            }}
                          >
                            <strong>📝 Additional Details</strong>
                            <p
                              style={{
                                margin: "5px 0 0",
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.6,
                              }}
                            >
                              {owner.additionalDetails}
                            </p>
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                            marginTop: 16,
                          }}
                        >
                          <a
                            href={`https://wa.me/${String(
                              owner.whatsapp
                            ).replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "10px 16px",
                              borderRadius: 9,
                              background: "#16A34A",
                              color: "#FFFFFF",
                              textDecoration: "none",
                              fontWeight: 800,
                            }}
                          >
                            💬 Contact Owner
                          </a>

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </>
      )}

      {/* CONTACT DEVELOPER MESSAGES */}
      {(agent?.name?.trim().toLowerCase() === "yoori" ||
        agent?.name?.trim().toLowerCase() === "della") && (
        <div
          style={{
            marginBottom: 28,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={() => {
              const messageWindow = document.getElementById(
                "contact-developer-window"
              );

              if (messageWindow) {
                messageWindow.style.display = "flex";
              }
            }}
            style={{
              width: "100%",
              maxWidth: 650,
              padding: "18px 24px",
              borderRadius: 14,
              border: "1px solid #C7D2FE",
              background: "#EEF2FF",
              color: "#0B2A5B",
              cursor: "pointer",
              fontSize: 17,
              fontWeight: 800,
              boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
            }}
          >
            📩 Contact Developer Messages
            <span
              style={{
                marginLeft: 10,
                background: "#3730A3",
                color: "#FFFFFF",
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 13,
              }}
            >
              {visibleContactMessages.length}
            </span>
          </button>

          <div
            id="contact-developer-window"
            style={{
              display: "none",
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(15, 23, 42, 0.65)",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 850,
                maxHeight: "90vh",
                overflowY: "auto",
                background: "#FFFFFF",
                borderRadius: 18,
                padding: 28,
                boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 15,
                  marginBottom: 22,
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color: "#0B2A5B",
                      fontSize: 23,
                    }}
                  >
                    📩 Contact Developer Messages
                  </h2>
                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "#64748B",
                    }}
                  >
                    Questions, feedback, suggestions and problem reports.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const messageWindow = document.getElementById(
                      "contact-developer-window"
                    );

                    if (messageWindow) {
                      messageWindow.style.display = "none";
                    }
                  }}
                  style={{
                    border: "none",
                    background: "#F1F5F9",
                    color: "#334155",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: 20,
                    fontWeight: 800,
                  }}
                >
                  ×
                </button>
              </div>

              {visibleContactMessages.length === 0 ? (
                <div
                  style={{
                    padding: 30,
                    textAlign: "center",
                    background: "#F8FAFC",
                    borderRadius: 12,
                    color: "#64748B",
                  }}
                >
                  No Contact Developer messages yet.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 16,
                  }}
                >
                  {visibleContactMessages.map((contact: any) => (
                    <div
                      key={contact.id}
                      style={{
                        border: "1px solid #E2E8F0",
                        borderRadius: 14,
                        padding: 20,
                        background: "#FFFFFF",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 15,
                          flexWrap: "wrap",
                          marginBottom: 14,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              color: "#0B2A5B",
                              fontWeight: 800,
                              fontSize: 17,
                            }}
                          >
                            {contact.name}
                          </div>

                          <div
                            style={{
                              color: "#475569",
                              marginTop: 4,
                            }}
                          >
                            📧 {contact.email}
                          </div>
                        </div>

                        <span
                          style={{
                            background:
                              contact.status === "new"
                                ? "#FEF3C7"
                                : contact.status === "replied"
                                  ? "#DCFCE7"
                                  : contact.status === "closed"
                                    ? "#E2E8F0"
                                    : "#DBEAFE",
                            color:
                              contact.status === "new"
                                ? "#92400E"
                                : contact.status === "replied"
                                  ? "#166534"
                                  : contact.status === "closed"
                                    ? "#475569"
                                    : "#1E40AF",
                            padding: "6px 12px",
                            borderRadius: 999,
                            fontWeight: 700,
                            textTransform: "capitalize",
                          }}
                        >
                          {contact.status}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "inline-block",
                          background: "#F1F5F9",
                          color: "#334155",
                          padding: "5px 10px",
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 13,
                          marginBottom: 12,
                        }}
                      >
                        🏷️ {contact.subject}
                      </div>

                      <div
                        style={{
                          background: "#F8FAFC",
                          borderRadius: 10,
                          padding: 15,
                          color: "#1E293B",
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                          marginBottom: 12,
                        }}
                      >
                        {contact.message}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                          flexWrap: "wrap",
                          marginTop: 12,
                        }}
                      >
                        <div
                          style={{
                            color: "#64748B",
                            fontSize: 13,
                          }}
                        >
                          🕐{" "}
                          {new Date(contact.createdAt).toLocaleString("en-MY", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          {contact.status === "new" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleContactStatus(contact.id, "read")
                              }
                              style={{
                                border: "none",
                                background: "#2563EB",
                                color: "#FFFFFF",
                                padding: "8px 14px",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontWeight: 700,
                              }}
                            >
                              ✓ Mark as Read
                            </button>
                          )}

                          {contact.status !== "new" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteContact(contact.id)
                              }
                              style={{
                                border: "none",
                                background: "#DC2626",
                                color: "#FFFFFF",
                                padding: "8px 14px",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontWeight: 700,
                              }}
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTENT GRID */}
      <div className="propvest-admin-grid" style={styles.grid}>
        {/* FORM */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            {editingLand ? "✏️ Edit Listing" : "➕ Create Listing"}
          </h2>

          <div className="propvest-admin-form" style={styles.form}>
            <input name="title" placeholder="Title" value={form.title} onChange={handleChange} style={styles.input} />
            <input name="location" placeholder="Location" value={form.location} onChange={handleChange} style={styles.input} />
            <input name="city" placeholder="City" value={form.city} onChange={handleChange} style={styles.input} />
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
                accept="image/*"
                multiple
                onChange={(e) => setFiles(e.target.files)}
                style={styles.hiddenFileInput}
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
                    city: "",
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
              {land.city && <p style={styles.text}>🏙️ {land.city}</p>}
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
  wtbSection: {
    background: "#ffffff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },

  wtbHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 15,
    flexWrap: "wrap",
  },

  wtbTitle: {
    margin: 0,
    color: "#0b1f3a",
  },

  wtbSub: {
    margin: "5px 0 0",
    color: "#334155",
    fontSize: 14,
  },

  wtbCount: {
    background: "#1E3A8A",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: "bold",
  },

  wtbEmpty: {
    padding: 20,
    background: "#f4f6fb",
    borderRadius: 8,
    color: "#1E293B",
  },

  wtbList: {
    display: "grid",
    gap: 15,
  },

  wtbCard: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: 16,
    background: "#ffffff",
    color: "#111827",
  },

  wtbCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 15,
  },

  wtbBuyer: {
    margin: 0,
    color: "#111827",
  },

  wtbMeta: {
    margin: "5px 0 0",
    color: "#475569",
    fontSize: 12,
  },

  wtbStatusActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  wtbCloseButton: {
    width: 34,
    height: 34,
    border: "1px solid #CBD5E1",
    borderRadius: 8,
    background: "#FFFFFF",
    color: "#DC2626",
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  wtbStatusSelect: {
    background: "#FACC15",
    color: "#111827",
    padding: "6px 10px",
    borderRadius: 15,
    border: "1px solid #e5b800",
    fontSize: 12,
    fontWeight: "bold",
    cursor: "pointer",
  },

  wtbGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 12,
  },

  wtbGridItem: {
    background: "#ffffff",
    padding: 10,
    borderRadius: 7,
    color: "#111827",
  },

  wtbRequirements: {
    marginTop: 15,
    padding: 12,
    background: "#ffffff",
    borderRadius: 8,
    color: "#111827",
  },

  wtbLabel: {
    display: "block",
    color: "#0F172A",
    fontWeight: 700,
    fontSize: 14,
  },

  wtbValue: {
    margin: "6px 0 0",
    color: "#1E293B",
    fontSize: 14,
    lineHeight: 1.5,
  },

  wtbActions: {
    marginTop: 15,
    display: "flex",
    gap: 10,
  },

  wtbWhatsapp: {
    display: "inline-block",
    padding: "9px 14px",
    background: "#16a34a",
    color: "#fff",
    borderRadius: 7,
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: 14,
  },

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

  h1: {
    margin: 0,
    color: "#0F172A",
    fontSize: 28,
    fontWeight: 800,
  },
  sub: {
    color: "#334155",
    fontSize: 15,
    fontWeight: 500,
  },

  badgeBox: { display: "flex", gap: 10 },

  badge: {
    background: "#111",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
  },

  badgeExtra: {
    background: "#0F766E",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
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

  cardTitle: {
    marginBottom: 10,
    color: "#000000",
  },

  form: { display: "flex", flexDirection: "column", gap: 8 },

  input: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ddd",
    background: "#ffffff",
    color: "#000000",
    WebkitTextFillColor: "#000000",
  },

  textarea: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ddd",
    minHeight: 80,
    background: "#ffffff",
    color: "#000000",
    WebkitTextFillColor: "#000000",
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

  title: {
    margin: "10px 0 5px",
    color: "#000000",
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.3,
    overflowWrap: "anywhere",
  },

  text: {
    fontSize: 13,
    color: "#000000",
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },

  price: {
    fontWeight: "bold",
    marginTop: 5,
    color: "#1E3A8A",
    fontSize: 16,
  },

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
    background: "#ffffff",
    color: "#000000",
    WebkitTextFillColor: "#000000",
  },

  areaSelect: {
    width: 170,
    padding: 12,
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    background: "#ffffff",
    color: "#000000",
  },

  hiddenFileInput: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
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
