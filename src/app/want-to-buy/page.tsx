"use client";

import { useMemo, useState } from "react";

const SHARED_AREAS = [
  "Johor Bahru",
  "Permas Jaya",
  "Johor Jaya",
  "Ulu Tiram",
  "Plentong",
];

const WEST_AREAS = [
  "Iskandar Puteri",
  "Gelang Patah",
  "Skudai",
  "Senai",
  "Kulai",
  "Pontian",
  "Benut",
  "Rengit",
  "Batu Pahat",
  "Kluang",
  "Muar",
  "Tangkak",
  "Segamat",
];

const EAST_AREAS = [
  "Pasir Gudang",
  "Masai",
  "Kota Tinggi",
  "Bandar Penawar",
  "Desaru",
  "Pengerang",
  "Mersing",
];

function money(value: number) {
  return `RM ${value.toLocaleString("en-MY", {
    maximumFractionDigits: 0,
  })}`;
}

export default function WantToBuyPage() {
  const [form, setForm] = useState({
    buyerName: "",
    whatsapp: "",
    city: "",
    propertyType: "",
    requiredSize: "",
    budget: "",
    netIncome: "",
    monthlyLoanRepayment: "",
    ctosCcrisStatus: "",
    additionalRequirements: "",
    selectedAgentId: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const areaType = useMemo(() => {
    if (SHARED_AREAS.includes(form.city)) return "shared";
    if (WEST_AREAS.includes(form.city)) return "west";
    if (EAST_AREAS.includes(form.city)) return "east";
    return "";
  }, [form.city]);

  const loan = useMemo(() => {
    const basicSalary = Number(form.netIncome) || 0;
    const bankCommitment =
      Number(form.monthlyLoanRepayment) || 0;

    // OD Legacy loan eligibility formula
    // A = Basic Salary × 60%
    // B = A − Bank Commitment
    // C = B × 200
    // C = Estimated Bank Loan Amount
    const a = basicSalary * 0.6;
    const b = Math.max(0, a - bankCommitment);
    const c = b * 200;

    return {
      dsr: a,
      monthlyLoanRepayment: bankCommitment,
      available: b,
      estimatedLoan: c,
      propertyPrice: c / 0.9,
    };
  }, [
    form.netIncome,
    form.monthlyLoanRepayment,
  ]);

  const update = (name: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.buyerName || !form.whatsapp || !form.city) {
      setError("Please complete your name, WhatsApp and preferred area.");
      return;
    }

    if (areaType === "shared" && !form.selectedAgentId) {
      setError("Please choose Yoori or Della for this area.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/want-to-buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          maxDsr: 60,
          availableMonthly: loan.available,
          estimatedLoan: loan.estimatedLoan,
          estimatedPropertyPrice: loan.propertyPrice,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to submit your enquiry.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Unable to submit your enquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main style={styles.page}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✅</div>

          <h1 style={styles.successTitle}>
            Enquiry Submitted
          </h1>

          <p style={styles.successMessage}>
            Thank you. Our property consultant will contact you through
            WhatsApp regarding your requirements.
          </p>

          <button
            type="button"
            onClick={() => window.location.href = "/"}
            style={styles.primary}
          >
            Back to PropVest
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.hero}>
          <div style={styles.badge}>PROPVEST MALAYSIA</div>
          <h1 style={styles.heroTitle}>Want To Buy?</h1>
          <p style={styles.heroDescription}>
            Tell us what property or land you are looking for and our
            consultant will help match your requirements.
          </p>
        </div>

        <form onSubmit={submit}>
          <section style={styles.card}>
            <h2>👤 Buyer Information</h2>

            <label style={styles.label}>Name *</label>
            <input
              value={form.buyerName}
              onChange={(e) => update("buyerName", e.target.value)}
              placeholder="Your name"
              style={styles.input}
            />

            <label style={styles.label}>WhatsApp *</label>
            <input
              value={form.whatsapp}
              onChange={(e) => update("whatsapp", e.target.value)}
              placeholder="e.g. 60123456789"
              style={styles.input}
            />

            <label style={styles.label}>
              Monthly Net Income (After Tax / EPF / SOCSO) (RM)
            </label>
            <input
              type="number"
              min="0"
              value={form.netIncome}
              onChange={(e) => update("netIncome", e.target.value)}
              placeholder="e.g. 5000"
              style={styles.input}
            />

            <label style={styles.label}>
              Existing Monthly Loan Repayment (RM)
            </label>
            <input
              type="number"
              min="0"
              value={form.monthlyLoanRepayment}
              onChange={(e) =>
                update("monthlyLoanRepayment", e.target.value)
              }
              placeholder="e.g. 1500"
              style={styles.input}
            />

            <label style={styles.label}>CTOS / CCRIS Status</label>
            <select
              value={form.ctosCcrisStatus}
              onChange={(e) => update("ctosCcrisStatus", e.target.value)}
              style={styles.input}
            >
              <option value="">Select status</option>
              <option>Healthy</option>
              <option>Not Healthy</option>
              <option>Prefer not to say</option>
            </select>
          </section>

          <section style={styles.card}>
            <h2>🏠 Property Requirement</h2>

            <label style={styles.label}>Preferred City / Area *</label>
            <select
              value={form.city}
              onChange={(e) => {
                update("city", e.target.value);
                update("selectedAgentId", "");
              }}
              style={styles.input}
            >
              <option value="">Select area</option>
              <optgroup label="Shared — Choose Yoori or Della">
                {SHARED_AREAS.map((area) => (
                  <option key={area}>{area}</option>
                ))}
              </optgroup>
              <optgroup label="West — Yoori">
                {WEST_AREAS.map((area) => (
                  <option key={area}>{area}</option>
                ))}
              </optgroup>
              <optgroup label="East — Della">
                {EAST_AREAS.map((area) => (
                  <option key={area}>{area}</option>
                ))}
              </optgroup>
            </select>

            {areaType === "west" && (
              <div style={styles.assignment}>
                Assigned Agent: <strong>Yoori</strong>
              </div>
            )}

            {areaType === "east" && (
              <div style={styles.assignment}>
                Assigned Agent: <strong>Della</strong>
              </div>
            )}

            {areaType === "shared" && (
              <>
                <label style={styles.label}>Choose Agent *</label>
                <select
                  value={form.selectedAgentId}
                  onChange={(e) =>
                    update("selectedAgentId", e.target.value)
                  }
                  style={styles.input}
                >
                  <option value="">Choose Yoori or Della</option>
                  <option value="11">Yoori</option>
                  <option value="12">Della</option>
                </select>
              </>
            )}

            <label style={styles.label}>Property / Land Type</label>
            <input
              value={form.propertyType}
              onChange={(e) => update("propertyType", e.target.value)}
              placeholder="e.g. Land, Terrace, Semi-D, Commercial"
              style={styles.input}
            />

            <label style={styles.label}>Required Size</label>
            <input
              value={form.requiredSize}
              onChange={(e) => update("requiredSize", e.target.value)}
              placeholder="e.g. 2,000 sqft / 5 acres"
              style={styles.input}
            />

            <label style={styles.label}>Budget</label>
            <input
              value={form.budget}
              onChange={(e) => update("budget", e.target.value)}
              placeholder="e.g. RM500,000"
              style={styles.input}
            />

            <label style={styles.label}>Additional Requirements</label>
            <textarea
              value={form.additionalRequirements}
              onChange={(e) =>
                update("additionalRequirements", e.target.value)
              }
              placeholder="Tell us anything else you need..."
              style={styles.textarea}
            />
          </section>

          {error && <div style={styles.error}>{error}</div>}

          <button disabled={loading} type="submit" style={styles.submit}>
            {loading ? "Submitting..." : "Submit Want To Buy Enquiry"}
          </button>

          <p style={styles.privacy}>
            Your net income, loan repayment and CTOS/CCRIS information is private
            and only used by the assigned property consultant for enquiry
            assessment.
          </p>
        </form>
      </div>
    </main>
  );
}

const styles: any = {
  successCard: {
    maxWidth: 600,
    margin: "80px auto",
    padding: "40px 28px",
    background: "#ffffff",
    borderRadius: 16,
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
    color: "#111827",
  },

  successIcon: {
    fontSize: 50,
    lineHeight: 1,
    marginBottom: 20,
  },

  successTitle: {
    margin: "0 0 12px",
    color: "#111827",
    fontSize: 30,
    fontWeight: 800,
  },

  successMessage: {
    margin: "0 auto",
    maxWidth: 500,
    color: "#374151",
    fontSize: 16,
    lineHeight: 1.7,
  },

  page: {
    minHeight: "100vh",
    background: "#f4f6fb",
    padding: "30px 16px 60px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: 760,
    margin: "0 auto",
  },
  hero: {
    textAlign: "center",
    marginBottom: 25,
    color: "#111827",

  },
  heroTitle: {
    color: "#111827",
    fontSize: 34,
    fontWeight: 800,
    margin: "14px 0 8px",
  },

  heroDescription: {
    color: "#374151",
    fontSize: 16,
    lineHeight: 1.6,
    margin: 0,
  },

  badge: {
    display: "inline-block",
    background: "#111827",
    color: "#FACC15",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold",
  },
  card: {
    background: "#fff",
    padding: 22,
    borderRadius: 14,
    marginBottom: 18,
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    color: "#111827",
  },
  label: {
    display: "block",
    marginTop: 12,
    marginBottom: 5,
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: 11,
    border: "1px solid #d1d5db",
    borderRadius: 8,
    background: "#fff",
    color: "#111827",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: 100,
    padding: 11,
    border: "1px solid #d1d5db",
    borderRadius: 8,
    background: "#fff",
    color: "#111827",
  },
  assignment: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    background: "#fef3c7",
    color: "#92400e",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  calculator: {
    marginTop: 18,
    display: "grid",
    gap: 10,
  },
  note: {
    fontSize: 13,
    color: "#6b7280",
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  submit: {
    width: "100%",
    padding: 14,
    border: "none",
    borderRadius: 9,
    background: "#FACC15",
    color: "#111827",
    fontWeight: "bold",
    fontSize: 16,
    cursor: "pointer",
  },
  primary: {
    marginTop: 15,
    padding: "12px 20px",
    border: "none",
    borderRadius: 8,
    background: "#FACC15",
    fontWeight: "bold",
    cursor: "pointer",
  },
  privacy: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 12,
    marginTop: 12,
  },
};
