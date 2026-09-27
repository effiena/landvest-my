"use client";

import { useState } from "react";
import { getWhatsAppLink } from "@/lib/whatsapp";

export default function SellPropertyPopup() {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <div style={styles.container}>
      <div style={styles.popup}>
        <button
          onClick={() => setOpen(false)}
          style={styles.close}
          aria-label="Close"
        >
          ×
        </button>

        <div style={styles.header}>
          <span style={styles.icon}>🏡</span>

          <div>
            <h2 style={styles.title}>
              Sell Your Property?
            </h2>

            <p style={styles.subtitle}>
              Have land or property to sell?
            </p>
          </div>
        </div>

        <p style={styles.text}>
          Connect with a PropVest agent to discuss
          your property listing.
        </p>

        <div style={styles.heading}>
          Available Agents
        </div>

        <div style={styles.agents}>
          <a
            href={getWhatsAppLink("0109688408")}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.agent}
          >
            <span style={styles.agentName}>Yoori</span>
            <span style={styles.whatsapp}>WhatsApp</span>
          </a>

          <a
            href={getWhatsAppLink("01113204880")}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.agent}
          >
            <span style={styles.agentName}>Della</span>
            <span style={styles.whatsapp}>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    position: "fixed",
    right: 14,
    bottom: 14,
    left: 14,
    zIndex: 9999,
    display: "flex",
    justifyContent: "flex-end",
    pointerEvents: "none",
  },

  popup: {
    position: "relative",
    width: "100%",
    maxWidth: 390,
    background: "#FFFFFF",
    borderRadius: 16,
    padding: "17px 16px 15px",
    boxSizing: "border-box",
    boxShadow: "0 10px 35px rgba(0,0,0,0.20)",
    border: "1px solid #E2E8F0",
    pointerEvents: "auto",
  },

  close: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 28,
    height: 28,
    border: "none",
    borderRadius: "50%",
    background: "#F1F5F9",
    color: "#334155",
    fontSize: 20,
    lineHeight: "26px",
    cursor: "pointer",
    padding: 0,
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    paddingRight: 30,
  },

  icon: {
    fontSize: 30,
    flexShrink: 0,
  },

  title: {
    margin: 0,
    fontSize: "clamp(18px, 5vw, 22px)",
    fontWeight: 800,
    color: "#0B2A5B",
  },

  subtitle: {
    margin: "2px 0 0",
    fontSize: 13,
    color: "#64748B",
  },

  text: {
    margin: "10px 0 12px",
    fontSize: 13,
    lineHeight: 1.45,
    color: "#475569",
  },

  heading: {
    marginBottom: 7,
    fontSize: 12,
    fontWeight: 700,
    color: "#0F172A",
  },

  agents: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },

  agent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
    padding: "9px 11px",
    background: "#0F172A",
    color: "#FFFFFF",
    borderRadius: 9,
    textDecoration: "none",
  },

  agentName: {
    fontSize: 13,
    fontWeight: 700,
  },

  whatsapp: {
    fontSize: 11,
    color: "#FACC15",
    fontWeight: 700,
  },
};
