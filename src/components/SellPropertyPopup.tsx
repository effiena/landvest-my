"use client";

import { useEffect, useState } from "react";

const MALAYSIA_STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Penang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Kuala Lumpur",
  "Putrajaya",
  "Labuan",
];

const SHARED_AREAS = [
  "Johor Bahru",
  "Permas Jaya",
  "Johor Jaya",
  "Ulu Tiram",
  "Plentong",
];

type FormData = {
  ownerName: string;
  whatsapp: string;
  email: string;
  state: string;
  city: string;
  propertyAddress: string;
  propertyType: string;
  propertySize: string;
  expectedPrice: string;
  tenure: string;
  bumiStatus: string;
  additionalDetails: string;
  selectedAgentId: string;
};

const initialForm: FormData = {
  ownerName: "",
  whatsapp: "",
  email: "",
  state: "",
  city: "",
  propertyAddress: "",
  propertyType: "",
  propertySize: "",
  expectedPrice: "",
  tenure: "",
  bumiStatus: "",
  additionalDetails: "",
  selectedAgentId: "",
};

export default function SellPropertyPopup({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sharedArea =
    form.state === "Johor" &&
    SHARED_AREAS.some(
      (area) => area.toLowerCase() === form.city.trim().toLowerCase()
    );

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setMessage("");
      setError("");
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!sharedArea && form.selectedAgentId) {
      setForm((current) => ({
        ...current,
        selectedAgentId: "",
      }));
    }
  }, [sharedArea, form.selectedAgentId]);

  function updateField(
    field: keyof FormData,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setError("");
    setMessage("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/want-to-sell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to submit your property details."
        );
      }

      setMessage(data.message || "Your property enquiry has been submitted successfully.");
      setForm(initialForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your property details. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div style={styles.container}>
      <div style={styles.popup}>
        <button
          type="button"
          onClick={onClose}
          style={styles.close}
          aria-label="Close"
        >
          ×
        </button>

        <div style={styles.header}>
          <span style={styles.icon}>🏡</span>

          <div>
            <h2 style={styles.title}>Sell Your Property</h2>
            <p style={styles.subtitle}>
              Tell us about your property and our team will get in touch.
            </p>
          </div>
        </div>

        {message ? (
          <div style={styles.successBox}>
            <div style={styles.successTitle}>✓ Enquiry Submitted</div>
            <div style={styles.successText}>{message}</div>

            <button
              type="button"
              onClick={onClose}
              style={styles.doneButton}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={styles.sectionTitle}>Owner Details</div>

            <label style={styles.label}>
              Owner Name <span style={styles.required}>*</span>
              <input
                required
                value={form.ownerName}
                onChange={(e) =>
                  updateField("ownerName", e.target.value)
                }
                placeholder="Your full name"
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              WhatsApp <span style={styles.required}>*</span>
              <input
                required
                value={form.whatsapp}
                onChange={(e) =>
                  updateField("whatsapp", e.target.value)
                }
                placeholder="e.g. 0123456789"
                inputMode="tel"
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  updateField("email", e.target.value)
                }
                placeholder="Optional"
                style={styles.input}
              />
            </label>

            <div style={styles.sectionTitle}>Property Location</div>

            <label style={styles.label}>
              State <span style={styles.required}>*</span>
              <select
                required
                value={form.state}
                onChange={(e) =>
                  updateField("state", e.target.value)
                }
                style={styles.input}
              >
                <option value="">Select state</option>
                {MALAYSIA_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              City / Area <span style={styles.required}>*</span>
              <input
                required
                value={form.city}
                onChange={(e) =>
                  updateField("city", e.target.value)
                }
                placeholder="e.g. Johor Bahru"
                style={styles.input}
              />
            </label>

            {sharedArea && (
              <div style={styles.agentBox}>
                <div style={styles.agentTitle}>
                  Select PropVest Agent <span style={styles.required}>*</span>
                </div>

                <p style={styles.agentHint}>
                  This area is shared between Yoori and Della.
                </p>

                <div style={styles.agentOptions}>
                  <label
                    style={{
                      ...styles.agentOption,
                      ...(form.selectedAgentId === "1"
                        ? styles.agentOptionActive
                        : {}),
                    }}
                  >
                    <input
                      type="radio"
                      name="selectedAgentId"
                      value="1"
                      checked={form.selectedAgentId === "1"}
                      onChange={(e) =>
                        updateField(
                          "selectedAgentId",
                          e.target.value
                        )
                      }
                    />
                    <span>Yoori</span>
                  </label>

                  <label
                    style={{
                      ...styles.agentOption,
                      ...(form.selectedAgentId === "2"
                        ? styles.agentOptionActive
                        : {}),
                    }}
                  >
                    <input
                      type="radio"
                      name="selectedAgentId"
                      value="2"
                      checked={form.selectedAgentId === "2"}
                      onChange={(e) =>
                        updateField(
                          "selectedAgentId",
                          e.target.value
                        )
                      }
                    />
                    <span>Della</span>
                  </label>
                </div>

                {!form.selectedAgentId && (
                  <input
                    type="text"
                    required
                    value=""
                    onChange={() => {}}
                    style={styles.hiddenRequired}
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                )}
              </div>
            )}

            <label style={styles.label}>
              Full Property Address <span style={styles.required}>*</span>
              <textarea
                required
                value={form.propertyAddress}
                onChange={(e) =>
                  updateField(
                    "propertyAddress",
                    e.target.value
                  )
                }
                placeholder="House / lot number, road, taman, etc."
                rows={3}
                style={styles.textarea}
              />
            </label>

            <div style={styles.sectionTitle}>Property Details</div>

            <label style={styles.label}>
              Property Type
              <select
                value={form.propertyType}
                onChange={(e) =>
                  updateField("propertyType", e.target.value)
                }
                style={styles.input}
              >
                <option value="">Select property type</option>
                <option value="Land">Land</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Agricultural">Agricultural</option>
                <option value="Shop / Office">Shop / Office</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label style={styles.label}>
              Property Size
              <input
                value={form.propertySize}
                onChange={(e) =>
                  updateField("propertySize", e.target.value)
                }
                placeholder="e.g. 20 × 70 ft / 2 acres"
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Expected Selling Price
              <input
                value={form.expectedPrice}
                onChange={(e) =>
                  updateField("expectedPrice", e.target.value)
                }
                placeholder="e.g. RM500,000"
                inputMode="decimal"
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Tenure
              <select
                value={form.tenure}
                onChange={(e) =>
                  updateField("tenure", e.target.value)
                }
                style={styles.input}
              >
                <option value="">Select tenure</option>
                <option value="Freehold">Freehold</option>
                <option value="Leasehold">Leasehold</option>
                <option value="Malay Reserve">Malay Reserve</option>
                <option value="Unknown">Not sure</option>
              </select>
            </label>

            <label style={styles.label}>
              Bumi Status
              <select
                value={form.bumiStatus}
                onChange={(e) =>
                  updateField("bumiStatus", e.target.value)
                }
                style={styles.input}
              >
                <option value="">Select status</option>
                <option value="Bumi Lot">Bumi Lot</option>
                <option value="Non-Bumi Lot">Non-Bumi Lot</option>
                <option value="Open / Non-Bumi">Open / Non-Bumi</option>
                <option value="Unknown">Not sure</option>
              </select>
            </label>

            <label style={styles.label}>
              Additional Details
              <textarea
                value={form.additionalDetails}
                onChange={(e) =>
                  updateField(
                    "additionalDetails",
                    e.target.value
                  )
                }
                placeholder="Any other information about the property..."
                rows={4}
                style={styles.textarea}
              />
            </label>

            {error && (
              <div style={styles.errorBox}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.submitButton,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? "wait" : "pointer",
              }}
            >
              {submitting
                ? "Submitting..."
                : "Submit Property Details"}
            </button>

            <p style={styles.note}>
              By submitting, your property details will be reviewed by
              the PropVest team.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    background: "rgba(15, 23, 42, 0.55)",
    boxSizing: "border-box",
  },

  popup: {
    position: "relative",
    width: "100%",
    maxWidth: 480,
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#FFFFFF",
    borderRadius: 18,
    padding: "20px 17px 18px",
    boxSizing: "border-box",
    boxShadow: "0 18px 55px rgba(0,0,0,0.28)",
  },

  close: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    border: "none",
    borderRadius: "50%",
    background: "#F1F5F9",
    color: "#334155",
    fontSize: 21,
    lineHeight: "28px",
    cursor: "pointer",
    padding: 0,
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    paddingRight: 38,
    marginBottom: 18,
  },

  icon: {
    fontSize: 31,
    flexShrink: 0,
  },

  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    color: "#0B2A5B",
  },

  subtitle: {
    margin: "3px 0 0",
    fontSize: 12,
    lineHeight: 1.4,
    color: "#64748B",
  },

  sectionTitle: {
    margin: "16px 0 9px",
    paddingBottom: 5,
    borderBottom: "1px solid #E2E8F0",
    fontSize: 13,
    fontWeight: 800,
    color: "#0F172A",
  },

  label: {
    display: "block",
    marginBottom: 10,
    fontSize: 12,
    fontWeight: 700,
    color: "#334155",
  },

  required: {
    color: "#DC2626",
  },

  input: {
    display: "block",
    width: "100%",
    marginTop: 5,
    padding: "10px 11px",
    border: "1px solid #CBD5E1",
    borderRadius: 9,
    background: "#FFFFFF",
    color: "#0F172A",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  },

  textarea: {
    display: "block",
    width: "100%",
    marginTop: 5,
    padding: "10px 11px",
    border: "1px solid #CBD5E1",
    borderRadius: 9,
    background: "#FFFFFF",
    color: "#0F172A",
    fontSize: 13,
    lineHeight: 1.45,
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },

  agentBox: {
    margin: "4px 0 12px",
    padding: 11,
    borderRadius: 10,
    background: "#FFFBEB",
    border: "1px solid #FDE68A",
  },

  agentTitle: {
    fontSize: 12,
    fontWeight: 800,
    color: "#78350F",
  },

  agentHint: {
    margin: "3px 0 8px",
    fontSize: 11,
    color: "#92400E",
  },

  agentOptions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },

  agentOption: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 10px",
    border: "1px solid #FCD34D",
    borderRadius: 8,
    background: "#FFFFFF",
    color: "#0F172A",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },

  agentOptionActive: {
    background: "#FEF3C7",
    border: "1px solid #F59E0B",
  },

  hiddenRequired: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: "none",
  },

  submitButton: {
    width: "100%",
    marginTop: 7,
    padding: "12px 14px",
    border: "none",
    borderRadius: 10,
    background: "#0F172A",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 800,
  },

  note: {
    margin: "8px 2px 0",
    textAlign: "center",
    fontSize: 10,
    lineHeight: 1.4,
    color: "#94A3B8",
  },

  errorBox: {
    marginTop: 8,
    padding: "9px 10px",
    borderRadius: 8,
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    color: "#B91C1C",
    fontSize: 12,
    lineHeight: 1.4,
  },

  successBox: {
    padding: 15,
    borderRadius: 12,
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
  },

  successTitle: {
    marginBottom: 7,
    fontSize: 16,
    fontWeight: 800,
    color: "#166534",
  },

  successText: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "#166534",
  },

  doneButton: {
    width: "100%",
    marginTop: 14,
    padding: "11px 14px",
    border: "none",
    borderRadius: 9,
    background: "#166534",
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
};
