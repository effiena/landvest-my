"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DeleteButton from "./components/DeleteButton";
import StripeCheckout from "./StripeCheckout";
import { PLANS } from "@/lib/plans";

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


function leadMoneyValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const raw = String(value).trim().toLowerCase();
  const multiplier = raw.endsWith("million") || raw.endsWith("m")
    ? 1_000_000
    : raw.endsWith("thousand") || raw.endsWith("k")
      ? 1_000
      : 1;

  const cleaned = raw
    .replace(/rm/gi, "")
    .replace(/,/g, "")
    .replace(/million|thousand|[km]$/g, "")
    .replace(/[^0-9.]/g, "");

  const number = Number(cleaned);
  return Number.isFinite(number) && number > 0
    ? number * multiplier
    : null;
}

function getBuyerLeadPriority(buyer: any) {
  const now = Date.now();
  const created = new Date(buyer.createdAt).getTime();
  const ageDays = Number.isFinite(created)
    ? Math.max(0, (now - created) / 86_400_000)
    : 999;

  let score = 0;
  const reasons: string[] = [];

  if (buyer.status === "new") {
    score += 20;
    reasons.push("Needs first contact");
  } else if (buyer.status === "contacted") {
    score += 8;
    reasons.push("Follow-up may be needed");
  }

  if (ageDays <= 1) {
    score += 20;
    reasons.push("Received within 24 hours");
  } else if (ageDays <= 3) {
    score += 15;
    reasons.push("Recent enquiry");
  } else if (ageDays <= 7) {
    score += 10;
    reasons.push("Enquiry within 7 days");
  } else {
    score += 5;
    reasons.push("Older enquiry — review follow-up");
  }

  if (String(buyer.budget || "").trim()) {
    score += 15;
    reasons.push("Budget provided");
  }

  if (String(buyer.propertyType || "").trim()) {
    score += 10;
    reasons.push("Property type specified");
  }

  if (String(buyer.city || "").trim()) {
    score += 10;
    reasons.push("Preferred location provided");
  }

  if (
    Number(buyer.estimatedPropertyPrice) > 0 ||
    Number(buyer.estimatedLoan) > 0
  ) {
    score += 15;
    reasons.push("Financing estimate available");
  }

  if (String(buyer.requiredSize || "").trim()) {
    score += 10;
    reasons.push("Size requirement specified");
  }

  return {
    score: Math.min(100, score),
    reasons,
    ageDays,
  };
}

function getBuyerPropertyMatch(buyer: any, lands: any[]) {
  const buyerBudget = leadMoneyValue(buyer.budget);
  const buyerType = String(buyer.propertyType || "").trim().toLowerCase();
  const buyerCity = String(buyer.city || "").trim().toLowerCase();

  const ranked = lands.map((land: any) => {
    const reasons: string[] = [];
    let score = 0;

    const listingType = String(land.propertyType || "").trim().toLowerCase();
    const listingCategory = String(land.propertyCategory || "").trim().toLowerCase();
    const listingCity = String(land.city || "").trim().toLowerCase();
    const listingState = String(land.state || "").trim().toLowerCase();
    const listingLocation = String(land.location || "").trim().toLowerCase();
    const listingPrice = leadMoneyValue(land.price);

    if (
      buyerType &&
      listingType &&
      (listingType === buyerType ||
        listingCategory === buyerType ||
        listingType.includes(buyerType) ||
        buyerType.includes(listingType))
    ) {
      score += 40;
      reasons.push("Property type matches");
    }

    if (
      buyerCity &&
      (listingCity === buyerCity ||
        (listingLocation && listingLocation.includes(buyerCity)) ||
        (listingCity && buyerCity.includes(listingCity)))
    ) {
      score += 35;
      reasons.push("Location matches");
    } else if (
      buyerCity &&
      listingState &&
      buyerCity.includes(listingState)
    ) {
      score += 15;
      reasons.push("Possible state-level location match");
    }

    if (buyerBudget !== null && listingPrice !== null) {
      if (listingPrice <= buyerBudget) {
        score += 25;
        reasons.push("Asking price within stated budget");
      } else if (listingPrice <= buyerBudget * 1.1) {
        score += 10;
        reasons.push("Asking price up to 10% above budget");
      }
    }

    return { land, score, reasons };
  });

  return ranked
    .filter((item: any) => item.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 1);
}


function DiscoveredLeadReviewPanel() {
  const [leads, setLeads] = useState<any[]>([]);
  const [status, setStatus] = useState("pending");
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busyLeadId, setBusyLeadId] = useState<number | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [discoveryMessage, setDiscoveryMessage] = useState("");
  const [previewCandidates, setPreviewCandidates] = useState<any[]>([]);
  const [selectedPreviewUrls, setSelectedPreviewUrls] = useState<string[]>([]);
  const [savingSelected, setSavingSelected] = useState(false);


  const loadLeads = async () => {
    setLoadingLeads(true);
    setLeadError("");
    try {
      const response = await fetch(
        `/api/ai-leads?status=${encodeURIComponent(status)}&limit=100`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load lead candidates.");
      }
      setLeads(Array.isArray(data.leads) ? data.leads : []);
      setNotes((current) => {
        const next = { ...current };
        for (const lead of data.leads || []) {
          if (next[lead.id] === undefined) {
            next[lead.id] = lead.reviewNotes || "";
          }
        }
        return next;
      });
    } catch (error: any) {
      setLeadError(
        error?.message ||
          "Unable to load leads. The database migration may still be pending."
      );
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => {
    void loadLeads();
  }, [status]);

  const discoverLeads = async () => {
    setDiscovering(true);
    setDiscoveryMessage("");
    setLeadError("");
    setPreviewCandidates([]);
    setSelectedPreviewUrls([]);

    try {
      const response = await fetch("/api/ai-leads/discover", {
        method: "POST",
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Discovery preview failed.");
      }

      setPreviewCandidates(Array.isArray(data.candidates) ? data.candidates : []);
      setDiscoveryMessage(
        `${data.message || "Preview completed."} Searches completed: ${data.searchesCompleted ?? 0}. Saved: ${data.saved ?? 0}.`
      );
    } catch (error: any) {
      setLeadError(error?.message || "Unable to run discovery preview.");
    } finally {
      setDiscovering(false);
    }
  };

  const saveSelectedLeads = async () => {
    const selected = previewCandidates.filter(
      (candidate) => selectedPreviewUrls.includes(candidate.url)
    );

    if (!selected.length || savingSelected) return;

    setSavingSelected(true);
    setLeadError("");

    let saved = 0;
    let duplicates = 0;
    const failedUrls: string[] = [];
    let firstError = "";

    try {
      for (const candidate of selected) {
        try {
          const response = await fetch("/api/ai-leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              sourceName: String(candidate.title || "Buyer lead").slice(0, 200),
              sourceUrl: candidate.url,
              excerpt: candidate.excerpt || "",
              city: candidate.city || null,
              propertyType: candidate.propertyType || null,
              requiredSize: candidate.requiredSize || null,
              leadScore: Number.isInteger(candidate.score) ? candidate.score : 0,
              budgetMin: null,
              budgetMax: null,
            }),
          });

          const data = await response.json().catch(() => ({}));

          if (response.status === 409) {
            duplicates += 1;
            continue;
          }

          if (!response.ok) {
            failedUrls.push(candidate.url);
            if (!firstError) {
              firstError = data.error || "A selected lead could not be saved.";
            }
            continue;
          }

          saved += 1;
        } catch {
          failedUrls.push(candidate.url);
          if (!firstError) firstError = "Network error while saving selected leads.";
        }
      }

      setSelectedPreviewUrls(failedUrls);
      setDiscoveryMessage(
        `Save complete: ${saved} saved, ${duplicates} already saved, ${failedUrls.length} failed. ` +
        (failedUrls.length
          ? "Failed items remain selected so you can retry."
          : "Saved leads are pending your review.")
      );

      if (firstError) setLeadError(firstError);
      await loadLeads();
    } finally {
      setSavingSelected(false);
    }
  };

  const reviewLead = async (
    id: number,
    nextStatus: "approved" | "dismissed" | "pending"
  ) => {
    setBusyLeadId(id);
    setLeadError("");
    try {
      const response = await fetch(`/api/ai-leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          reviewNotes: notes[id] || "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to update this lead.");
      }
      await loadLeads();
    } catch (error: any) {
      setLeadError(error?.message || "Unable to update this lead.");
    } finally {
      setBusyLeadId(null);
    }
  };

  const saveNotes = async (id: number) => {
    await reviewLead(id, leads.find((lead) => lead.id === id)?.status || "pending");
  };

  return (
    <section
      aria-label="AI Lead Discovery and Review"
      style={{
        background: "#ffffff",
        border: "1px solid #dbe3ef",
        borderRadius: 16,
        padding: 20,
        marginBottom: 22,
        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
        color: "#111827",
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        flexWrap: "wrap",
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#172554" }}>
            🔎 AI Lead Discovery &amp; Review
          </h2>
          <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
            Preview public-source buyer-intent candidates without saving. Saved candidates remain available below; no messages are sent automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void discoverLeads()}
          disabled={discovering || loadingLeads}
          style={{
            border: 0,
            borderRadius: 9,
            padding: "9px 12px",
            background: discovering || loadingLeads ? "#cbd5e1" : "#064e3b",
            color: "#ffffff",
            fontWeight: 700,
            cursor: discovering || loadingLeads ? "wait" : "pointer",
          }}
        >
          {discovering ? "Previewing…" : "Preview Leads (No Save)"}
        </button>
        <button
          type="button"
          onClick={() => void loadLeads()}
          disabled={loadingLeads}
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: 9,
            padding: "9px 12px",
            background: "#f8fafc",
            cursor: "pointer",
          }}
        >
          {loadingLeads ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      <div style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap",
        margin: "14px 0",
      }}>
        <label htmlFor="discovered-lead-status" style={{ fontSize: 13, fontWeight: 700 }}>
          Review status
        </label>
        <select
          id="discovered-lead-status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          style={{
            padding: 9,
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            background: "#fff",
            color: "#111827",
          }}
        >
          <option value="pending">Pending review</option>
          <option value="approved">Approved</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All candidates</option>
        </select>
        <span style={{ fontSize: 12, color: "#64748b" }}>
          {leads.length} candidate{leads.length === 1 ? "" : "s"}
        </span>
      </div>

      {discoveryMessage && (
        <div role="status" style={{
          background: "#ecfdf5",
          color: "#065f46",
          border: "1px solid #a7f3d0",
          borderRadius: 9,
          padding: 12,
          marginBottom: 12,
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          {discoveryMessage}
        </div>
      )}

      {previewCandidates.length > 0 && (
        <section
          aria-label="Unsaved lead preview"
          style={{
            border: "1px solid #f59e0b",
            background: "#fffbeb",
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <h3 style={{ margin: "0 0 6px", color: "#92400e", fontSize: 16 }}>
            Preview results — not saved
          </h3>
          <p style={{ margin: "0 0 12px", color: "#92400e", fontSize: 12, lineHeight: 1.5 }}>
            Search relevance is not proof of a genuine buyer. Open each original source and verify the requirement. These results have not been saved or contacted.
          </p>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}>
            <button
              type="button"
              onClick={() => {
                const allUrls = previewCandidates.map((candidate) => candidate.url);
                setSelectedPreviewUrls(
                  selectedPreviewUrls.length === allUrls.length ? [] : allUrls
                );
              }}
              disabled={savingSelected}
              style={{
                border: "1px solid #d97706",
                borderRadius: 8,
                padding: "9px 12px",
                background: "#fff",
                color: "#92400e",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {selectedPreviewUrls.length === previewCandidates.length
                ? "Clear Selection"
                : "Select All"}
            </button>

            <button
              type="button"
              onClick={() => void saveSelectedLeads()}
              disabled={savingSelected || selectedPreviewUrls.length === 0}
              style={{
                border: 0,
                borderRadius: 8,
                padding: "9px 14px",
                background:
                  savingSelected || selectedPreviewUrls.length === 0
                    ? "#cbd5e1"
                    : "#047857",
                color: "#fff",
                fontWeight: 700,
                cursor:
                  savingSelected || selectedPreviewUrls.length === 0
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {savingSelected
                ? "Saving Selected…"
                : `Save Selected Leads (${selectedPreviewUrls.length})`}
            </button>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {previewCandidates.map((candidate, index) => (
              <article
                key={`${candidate.url}-${index}`}
                style={{
                  background: "#ffffff",
                  border: "1px solid #fde68a",
                  borderRadius: 9,
                  padding: 12,
                  overflowWrap: "anywhere",
                }}
              >
                <label style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginBottom: 10,
                  color: "#92400e",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}>
                  <input
                    type="checkbox"
                    checked={selectedPreviewUrls.includes(candidate.url)}
                    disabled={savingSelected}
                    onChange={(event) => {
                      setSelectedPreviewUrls((current) =>
                        event.target.checked
                          ? current.includes(candidate.url)
                            ? current
                            : [...current, candidate.url]
                          : current.filter((url) => url !== candidate.url)
                      );
                    }}
                    style={{ marginTop: 2 }}
                  />
                  Select this lead to save
                </label>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}>
                  <strong style={{ flex: "1 1 220px", color: "#111827" }}>
                    {candidate.title}
                  </strong>
                  <span style={{
                    background: "#fef3c7",
                    color: "#92400e",
                    borderRadius: 7,
                    padding: "5px 8px",
                    fontSize: 12,
                    fontWeight: 800,
                  }}>
                    Score: {candidate.score}/100
                  </span>
                </div>
                <div style={{ marginTop: 5, color: "#475569", fontSize: 12 }}>
                  {candidate.city || "Location unspecified"} · {candidate.propertyType || "Property type unspecified"}
                  {candidate.requiredSize ? ` · ${candidate.requiredSize}` : ""}
                </div>
                <p style={{ margin: "8px 0", color: "#334155", fontSize: 13, lineHeight: 1.6 }}>
                  {candidate.excerpt}
                </p>
                <div style={{ marginBottom: 8, color: "#475569", fontSize: 12 }}>
                  Match signals: {(candidate.reasons || []).join("; ")}
                </div>
                <a
                  href={candidate.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#1d4ed8", fontSize: 13 }}
                >
                  Open original source ↗
                </a>
              </article>
            ))}
          </div>
        </section>
      )}

      {leadError && (
        <div role="alert" style={{
          background: "#fff7ed",
          color: "#9a3412",
          border: "1px solid #fed7aa",
          borderRadius: 9,
          padding: 12,
          marginBottom: 12,
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          {leadError}
          <div style={{ marginTop: 5, fontSize: 12 }}>
            If the discovered-leads migration is not applied yet, the table may not exist.
          </div>
        </div>
      )}

      {!loadingLeads && !leadError && leads.length === 0 && (
        <div style={{
          padding: 18,
          borderRadius: 10,
          background: "#f8fafc",
          color: "#64748b",
          fontSize: 13,
          lineHeight: 1.6,
        }}>
          No saved candidates in this view yet. Public-source discovery has not been connected;
          candidates will appear here once they are collected through permitted sources and saved.
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {leads.map((lead) => (
          <article key={lead.id} style={{
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 14,
            minWidth: 0,
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}>
              <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                <strong style={{ overflowWrap: "anywhere" }}>
                  {lead.sourceName}
                </strong>
                <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                  {lead.city || "Location unspecified"}
                  {" · "}
                  {lead.propertyType || "Property type unspecified"}
                </div>
              </div>
              <div style={{
                borderRadius: 9,
                background: "#eff6ff",
                color: "#1d4ed8",
                padding: "7px 10px",
                fontSize: 12,
                fontWeight: 800,
              }}>
                Score: {lead.leadScore}/100
              </div>
            </div>

            <div style={{ marginTop: 8, fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
              {lead.excerpt || "No excerpt supplied."}
            </div>

            <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>
              Budget:{" "}
              {lead.budgetMin == null && lead.budgetMax == null
                ? "Not provided"
                : `RM ${lead.budgetMin == null ? "—" : Number(lead.budgetMin).toLocaleString()} – ${lead.budgetMax == null ? "—" : Number(lead.budgetMax).toLocaleString()}`}
              {" · "}Size: {lead.requiredSize || "Not provided"}
            </div>

            <div style={{ marginTop: 8 }}>
              <a
                href={lead.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#1d4ed8", fontSize: 13, overflowWrap: "anywhere" }}
              >
                Open original source ↗
              </a>
            </div>

            <label htmlFor={`lead-notes-${lead.id}`} style={{
              display: "block",
              marginTop: 12,
              marginBottom: 5,
              fontSize: 12,
              fontWeight: 700,
            }}>
              Review notes
            </label>
            <textarea
              id={`lead-notes-${lead.id}`}
              value={notes[lead.id] ?? lead.reviewNotes ?? ""}
              onChange={(event) =>
                setNotes((current) => ({ ...current, [lead.id]: event.target.value }))
              }
              maxLength={2000}
              rows={2}
              placeholder="Add your assessment or follow-up reminder…"
              style={{
                boxSizing: "border-box",
                width: "100%",
                padding: 10,
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                resize: "vertical",
                color: "#111827",
              }}
            />

            <div style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 10,
            }}>
              <button
                type="button"
                disabled={busyLeadId === lead.id}
                onClick={() => void saveNotes(lead.id)}
                style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}
              >
                Save notes
              </button>
              <button
                type="button"
                disabled={busyLeadId === lead.id}
                onClick={() => void reviewLead(lead.id, "approved")}
                style={{ padding: "9px 12px", borderRadius: 8, border: 0, background: "#dcfce7", color: "#166534", fontWeight: 700, cursor: "pointer" }}
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busyLeadId === lead.id}
                onClick={() => void reviewLead(lead.id, "dismissed")}
                style={{ padding: "9px 12px", borderRadius: 8, border: 0, background: "#fee2e2", color: "#991b1b", fontWeight: 700, cursor: "pointer" }}
              >
                Dismiss
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function AdminClient({
  lands,
  agent,
  wantToBuy = [],
  wantToSell = [],
  contactMessages = [],
  canUseAI = false,
}: any) {

  const router = useRouter();
  const [showMobileAIReview, setShowMobileAIReview] = useState(false);
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
    propertyCategory: "",
    propertyType: "",
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
      propertyCategory: land.propertyCategory || "",
      propertyType: land.propertyType || "",
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
        min-height: 44px;
        font-size: 16px !important;
      }

      textarea {
        min-height: 100px;
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

    .propvest-inquiry-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      align-items: stretch;
      gap: 14px;
      width: 100%;
      margin: 0 0 24px;
    }

    .propvest-inquiry-tile {
      display: flex;
      justify-content: center;
      align-items: stretch;
      min-width: 0;
      width: 100%;
      margin: 0 0 24px;
    }

    .propvest-inquiry-tile button {
      width: 100% !important;
      max-width: none !important;
      min-height: 76px;
      padding: 14px 12px !important;
      border-radius: 14px !important;
      line-height: 1.4;
      overflow-wrap: anywhere;
    }

    @media (max-width: 700px) {
      .propvest-inquiry-grid {
        grid-template-columns: minmax(0, 1fr);
        gap: 10px;
      }

      .propvest-inquiry-tile button {
        min-height: 60px;
        font-size: 15px !important;
      }
    }

    .propvest-inquiry-summary-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      width: 100%;
      margin: 0 0 22px;
      align-items: stretch;
    }

    .propvest-inquiry-summary-button {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-width: 0;
      min-height: 72px;
      padding: 14px 16px;
      border-radius: 14px;
      cursor: pointer;
      font-size: 15px;
      font-weight: 800;
      line-height: 1.4;
      text-align: left;
      overflow-wrap: anywhere;
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
    }

    .propvest-inquiry-summary-button.buyer {
      border: 1px solid #BFDBFE;
      background: #EFF6FF;
      color: #1E3A8A;
    }

    .propvest-inquiry-summary-button.owner {
      border: 1px solid #BBF7D0;
      background: #F0FDF4;
      color: #166534;
    }

    .propvest-inquiry-summary-button.contact {
      border: 1px solid #C7D2FE;
      background: #EEF2FF;
      color: #0B2A5B;
    }

    .propvest-inquiry-count {
      flex: 0 0 auto;
      min-width: 28px;
      padding: 4px 9px;
      border-radius: 999px;
      color: #FFFFFF;
      font-size: 13px;
      text-align: center;
    }

    .buyer-count { background: #2563EB; }
    .owner-count { background: #16A34A; }
    .contact-count { background: #3730A3; }

    .propvest-inquiry-hidden-button {
      margin-bottom: 0 !important;
    }

    .propvest-inquiry-hidden-button > button {
      display: none !important;
    }

    @media (max-width: 700px) {
      .propvest-inquiry-summary-row {
        grid-template-columns: minmax(0, 1fr);
        gap: 10px;
      }

      .propvest-inquiry-summary-button {
        min-height: 58px;
        font-size: 15px;
      }
    }

    /* PropVest admin visual refresh */
    .propvest-admin-topbar {
      background: linear-gradient(135deg, #0B1F3A 0%, #123B52 100%) !important;
      color: #ffffff;
      padding: clamp(18px, 3vw, 28px) !important;
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 18px !important;
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
      margin: 20px auto 24px !important;
      max-width: 1400px;
      gap: 18px;
    }

    .propvest-admin-topbar h1 {
      color: #ffffff !important;
      letter-spacing: -0.03em;
      line-height: 1.15;
    }

    .propvest-admin-topbar p {
      color: #D7E4ED !important;
      line-height: 1.5;
    }

    .propvest-admin-header-right {
      gap: 12px !important;
      flex-wrap: wrap;
    }

    .propvest-admin-header-right > div:first-child {
      gap: 8px !important;
      flex-wrap: wrap;
    }

    .propvest-admin-nav-buttons {
      gap: 8px !important;
      flex-wrap: wrap;
    }

    .propvest-admin-nav-buttons a,
    .propvest-admin-nav-buttons button {
      min-height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      border-radius: 10px !important;
      transition: filter 0.15s ease, transform 0.15s ease;
    }

    .propvest-admin-nav-buttons a:hover,
    .propvest-admin-nav-buttons button:hover {
      filter: brightness(1.08);
    }

    .propvest-admin-grid {
      grid-template-columns: minmax(260px, 0.85fr) minmax(0, 1.6fr);
      gap: 22px;
    }

    .propvest-admin-listings {
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 18px;
    }

    @media (max-width: 768px) {
      .propvest-admin-topbar {
        margin: 12px 0 18px !important;
      }

      .propvest-admin-grid {
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 16px !important;
      }

      .propvest-admin-listings {
        grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)) !important;
        gap: 12px !important;
      }
    }

    @media (max-width: 480px) {
      .propvest-admin-topbar {
        padding: 16px !important;
        border-radius: 14px !important;
      }

      .propvest-admin-header-right {
        align-items: stretch;
      }

      .propvest-admin-header-right > div:first-child {
        width: 100%;
      }

      .propvest-admin-nav-buttons {
        display: grid !important;
        grid-template-columns: 1fr 1fr;
      }

      .propvest-admin-listings {
        grid-template-columns: minmax(0, 1fr) !important;
      }
    }


    /* Final mobile override: keep admin listing cards in two columns */
    @media (max-width: 768px) {
      .propvest-admin-listings {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 10px !important;
        min-width: 0;
      }

      .propvest-admin-listings > * {
        min-width: 0;
      }
    }


    .propvest-ai-mobile-open,
    .propvest-ai-mobile-overlay {
      display: none;
    }

    @media (max-width: 768px) {
      .propvest-ai-inline-panel {
        display: none !important;
      }

      .propvest-ai-mobile-open {
        display: block;
        width: 100%;
        margin: 0 0 18px;
        padding: 14px 16px;
        border: 1px solid #047857;
        border-radius: 12px;
        background: linear-gradient(135deg, #0f172a, #064e3b);
        color: #ffffff;
        font-size: 14px;
        font-weight: 750;
        text-align: left;
        cursor: pointer;
      }

      .propvest-ai-mobile-overlay {
        display: flex;
        position: fixed;
        inset: 0;
        z-index: 9999;
        padding: 10px;
        background: rgba(2, 6, 23, 0.78);
        align-items: stretch;
        justify-content: center;
      }

      .propvest-ai-mobile-dialog {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 760px;
        max-height: 100%;
        overflow-y: auto;
        overscroll-behavior: contain;
        background: #f8fafc;
        border-radius: 14px;
        padding: 10px;
      }

      .propvest-ai-mobile-dialog-header {
        position: sticky;
        top: -10px;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px;
        margin: -10px -10px 12px;
        background: #0f172a;
        color: #ffffff;
        border-radius: 12px 12px 0 0;
      }

      .propvest-ai-mobile-dialog-header button {
        flex-shrink: 0;
        padding: 8px 10px;
        border: 1px solid #64748b;
        border-radius: 8px;
        background: #ffffff;
        color: #0f172a;
        font-weight: 700;
        cursor: pointer;
      }

      .propvest-ai-mobile-dialog section[aria-label="AI Lead Discovery and Review"] {
        padding: 12px !important;
        margin-bottom: 0 !important;
      }

      .propvest-admin-listings {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 10px !important;
        min-width: 0;
      }

      .propvest-admin-listings > * {
        min-width: 0;
      }
    }

  `;

  const activeBuyerLeads = visibleWantToBuy.filter(
    (buyer: any) => buyer.status !== "closed"
  );
  const activeSellerLeads = visibleWantToSell.filter(
    (owner: any) => owner.status !== "closed"
  );
  const prioritizedBuyers = activeBuyerLeads
    .map((buyer: any) => ({
      buyer,
      priority: getBuyerLeadPriority(buyer),
      matches: getBuyerPropertyMatch(buyer, lands || []),
    }))
    .sort((a: any, b: any) => {
      if (b.priority.score !== a.priority.score) {
        return b.priority.score - a.priority.score;
      }
      return new Date(b.buyer.createdAt).getTime() -
        new Date(a.buyer.createdAt).getTime();
    })
    .slice(0, 5);

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


      {canUseAI && (
        <>
      {/* PROP VEST AI LEAD PRIORITY PANEL */}
      <section
        aria-label="PropVest AI lead priority"
        style={{
          background: "#ffffff",
          border: "1px solid #dbe3ef",
          borderRadius: 16,
          padding: 20,
          marginBottom: 22,
          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
          color: "#111827",
        }}
      >
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, color: "#172554" }}>
              ✨ PropVest Lead Priority
            </h2>
            <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>
              Rule-based prioritisation and listing suggestions for your current enquiries.
            </p>
          </div>
          <span style={{
            borderRadius: 20,
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "7px 11px",
            fontSize: 12,
            fontWeight: 700,
          }}>
            Preview · No auto-messaging
          </span>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
          gap: 10,
          marginBottom: 20,
        }}>
          {[
            { label: "Open buyer leads", value: activeBuyerLeads.length, color: "#1d4ed8" },
            { label: "Open seller leads", value: activeSellerLeads.length, color: "#15803d" },
            { label: "New buyer leads", value: activeBuyerLeads.filter((buyer: any) => buyer.status === "new").length, color: "#b45309" },
            { label: "Listings to match", value: Array.isArray(lands) ? lands.length : 0, color: "#6d28d9" },
          ].map((item) => (
            <div key={item.label} style={{
              padding: 14,
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              background: "#f8fafc",
            }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 7 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 27, fontWeight: 800, color: item.color }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ margin: "0 0 10px", fontSize: 17 }}>
          Buyer follow-up queue
        </h3>

        {prioritizedBuyers.length === 0 ? (
          <p style={{
            margin: 0,
            padding: 18,
            borderRadius: 10,
            background: "#f8fafc",
            color: "#64748b",
          }}>
            No open buyer enquiries are currently available in this dashboard.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {prioritizedBuyers.map(({ buyer, priority, matches }: any) => (
              <article key={buyer.id} style={{
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 14,
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: 12,
                alignItems: "start",
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}>
                    <strong style={{ fontSize: 15, overflowWrap: "anywhere" }}>
                      {buyer.buyerName}
                    </strong>
                    <span style={{
                      fontSize: 11,
                      borderRadius: 20,
                      padding: "4px 8px",
                      background: buyer.status === "new" ? "#fff7ed" : "#f1f5f9",
                      color: buyer.status === "new" ? "#9a3412" : "#475569",
                      fontWeight: 700,
                    }}>
                      {buyer.status || "new"}
                    </span>
                  </div>

                  <div style={{ marginTop: 7, color: "#475569", fontSize: 13 }}>
                    📍 {buyer.city || "Location not specified"}
                    {" · "}
                    {buyer.propertyType || "Property type not specified"}
                  </div>

                  <div style={{ marginTop: 4, color: "#475569", fontSize: 13 }}>
                    Budget: {buyer.budget || "Not provided"}
                  </div>

                  <div style={{
                    marginTop: 9,
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: "#64748b",
                  }}>
                    {priority.reasons.join(" · ")}
                  </div>

                  {matches.length > 0 ? (
                    <div style={{
                      marginTop: 10,
                      padding: 10,
                      borderRadius: 9,
                      background: "#f0fdf4",
                      color: "#166534",
                      fontSize: 12,
                    }}>
                      <strong>Suggested listing match · {matches[0].score}%</strong>
                      <div style={{ marginTop: 3, overflowWrap: "anywhere" }}>
                        {matches[0].land.title} — {formatPropertyPrice(matches[0].land.price)}
                      </div>
                      <div style={{ marginTop: 3, color: "#3f6212" }}>
                        {matches[0].reasons.join(" · ")}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 9, fontSize: 12, color: "#64748b" }}>
                      No strong listing match from the available details yet.
                    </div>
                  )}
                </div>

                <div style={{
                  textAlign: "center",
                  minWidth: 62,
                  borderRadius: 10,
                  background: priority.score >= 70 ? "#dcfce7" : priority.score >= 45 ? "#fef3c7" : "#f1f5f9",
                  color: priority.score >= 70 ? "#166534" : priority.score >= 45 ? "#92400e" : "#334155",
                  padding: "10px 8px",
                }}>
                  <div style={{ fontSize: 23, fontWeight: 800 }}>
                    {priority.score}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700 }}>PRIORITY</div>
                </div>
              </article>
            ))}
          </div>
        )}

        <p style={{
          margin: "14px 0 0",
          color: "#64748b",
          fontSize: 11,
          lineHeight: 1.5,
        }}>
          Scores are preliminary rules, not conversion predictions or lending decisions.
          Missing information lowers completeness, not a buyer's worth. Review details and
          approve any outreach yourself. Listing matches use only the listings available to this account.
        </p>
      </section>
        </>
      )}


      {canUseAI && (
        <>
          <div className="propvest-ai-inline-panel">
            <DiscoveredLeadReviewPanel />
          </div>

          <button
            type="button"
            className="propvest-ai-mobile-open"
            onClick={() => setShowMobileAIReview(true)}
          >
            🔎 AI Lead Discovery &amp; Review
          </button>

          {showMobileAIReview && (
            <div
              className="propvest-ai-mobile-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="AI Lead Discovery and Review"
            >
              <div className="propvest-ai-mobile-dialog">
                <div className="propvest-ai-mobile-dialog-header">
                  <strong>🔎 AI Lead Discovery &amp; Review</strong>
                  <button
                    type="button"
                    onClick={() => setShowMobileAIReview(false)}
                    aria-label="Close AI Lead Discovery and Review"
                  >
                    Close ✕
                  </button>
                </div>
                <DiscoveredLeadReviewPanel />
              </div>
            </div>
          )}
        </>
      )}

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
          {/* INQUIRY SUMMARY ROW */}
          <div className="propvest-inquiry-summary-row">
            <button
              type="button"
              className="propvest-inquiry-summary-button buyer"
              onClick={() => {
                const el = document.getElementById("buyer-inquiries-window");
                if (el) el.style.display = "flex";
              }}
            >
              <span>🛒 Buyer Inquiries</span>
              <span className="propvest-inquiry-count buyer-count">
                {visibleWantToBuy.length}
              </span>
            </button>

            <button
              type="button"
              className="propvest-inquiry-summary-button owner"
              onClick={() => {
                const el = document.getElementById("owner-inquiries-window");
                if (el) el.style.display = "flex";
              }}
            >
              <span>🏡 Owner Inquiries</span>
              <span className="propvest-inquiry-count owner-count">
                {visibleWantToSell.length}
              </span>
            </button>

            <button
              type="button"
              className="propvest-inquiry-summary-button contact"
              onClick={() => {
                const el = document.getElementById("contact-developer-window");
                if (el) el.style.display = "flex";
              }}
            >
              <span>📩 Contact Developer Messages</span>
              <span className="propvest-inquiry-count contact-count">
                {visibleContactMessages.length}
              </span>
            </button>
          </div>

          {/* BUYER INQUIRIES BUTTON + POPUP */}
          <div
            style={{
              marginBottom: 14,
              width: "100%",
            }}
          >
            <div className="propvest-inquiry-tile propvest-inquiry-hidden-button">
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
            <div className="propvest-inquiry-tile propvest-inquiry-hidden-button">
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
                              {formatPropertyPrice(owner.expectedPrice)}
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
        <div className="propvest-inquiry-tile propvest-inquiry-hidden-button">
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

            <select
              name="propertyCategory"
              value={form.propertyCategory}
              onChange={(e) => {
                setForm({
                  ...form,
                  propertyCategory: e.target.value,
                  propertyType: "",
                });
              }}
              style={styles.input}
            >
              <option value="">Select Property Category</option>
              <option value="HOUSE">🏠 House</option>
              <option value="HIGH_RISE">🏢 High-Rise</option>
              <option value="LAND">🌳 Land</option>
              <option value="COMMERCIAL">🏬 Commercial</option>
            </select>

            <select
              name="propertyType"
              value={form.propertyType}
              onChange={handleChange}
              disabled={!form.propertyCategory}
              style={styles.input}
            >
              <option value="">Select Property Type</option>

              {form.propertyCategory === "HOUSE" && (
                <>
                  <option value="Terrace House">Terrace House</option>
                  <option value="Semi-D">Semi-D</option>
                  <option value="Bungalow">Bungalow</option>
                  <option value="Cluster House">Cluster House</option>
                  <option value="Townhouse">Townhouse</option>
                </>
              )}

              {form.propertyCategory === "HIGH_RISE" && (
                <>
                  <option value="Condominium">Condominium</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Service Residence">Service Residence</option>
                  <option value="Flat">Flat</option>
                </>
              )}

              {form.propertyCategory === "LAND" && (
                <>
                  <option value="Residential Land">Residential Land</option>
                  <option value="Agricultural Land">Agricultural Land</option>
                  <option value="Commercial Land">Commercial Land</option>
                  <option value="Industrial Land">Industrial Land</option>
                </>
              )}

              {form.propertyCategory === "COMMERCIAL" && (
                <>
                  <option value="Shoplot">Shoplot</option>
                  <option value="Office">Office</option>
                  <option value="Factory">Factory</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Commercial Building">Commercial Building</option>
                </>
              )}
            </select>

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
                    propertyCategory: "",
                    propertyType: "",
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
              <p style={styles.price}>💰 {formatPropertyPrice(land.price)}</p>

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
    background: "#0B1F3A",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: "bold",
  },

  wtbEmpty: {
    padding: 20,
    background: "#F8FAFC",
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
    background: "#F8FAFC",
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
    background: "#0B1F3A",
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
    background: "#0B1F3A",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
  },

  badgeExtra: {
    background: "#059669",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
  },

  badgeYellow: {
    background: "#D1FAE5",
    color: "#065F46",
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
    color: "#0F172A",
  },

  form: { display: "flex", flexDirection: "column", gap: 8 },

  input: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #CBD5E1",
    background: "#ffffff",
    color: "#0F172A",
    WebkitTextFillColor: "#000000",
  },

  textarea: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #CBD5E1",
    minHeight: 80,
    background: "#ffffff",
    color: "#0F172A",
    WebkitTextFillColor: "#000000",
  },

  primaryBtn: {
    padding: 10,
    background: "#0B1F3A",
    color: "#fff",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
  },

  secondaryBtn: {
    padding: 10,
    background: "#F1F5F9",
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
    color: "#0F172A",
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.3,
    overflowWrap: "anywhere",
  },

  text: {
    fontSize: 13,
    color: "#0F172A",
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },

  price: {
    fontWeight: "bold",
    marginTop: 5,
    color: "#047857",
    fontSize: 16,
  },

  actions: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 10,
  },

  editBtn: {
    padding: "6px 10px",
    background: "#059669",
    color: "#ffffff",
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
    border: "1px solid #CBD5E1",
    borderRadius: 8,
    fontSize: 14,
    background: "#ffffff",
    color: "#0F172A",
    WebkitTextFillColor: "#000000",
  },

  areaSelect: {
    width: 170,
    padding: 12,
    border: "1px solid #CBD5E1",
    borderRadius: 8,
    fontSize: 14,
    background: "#ffffff",
    color: "#0F172A",
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
    background: "#0B1F3A",
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
