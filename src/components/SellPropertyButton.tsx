"use client";

import { useState } from "react";
import SellPropertyPopup from "@/components/SellPropertyPopup";

export default function SellPropertyButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={styles.button}
      >
        I Want To Sell
      </button>

      <SellPropertyPopup
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const styles: any = {
  button: {
    padding: "10px 16px",
    background: "#FACC15",
    color: "#0F172A",
    border: "none",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 14,
    whiteSpace: "nowrap",
  },
};
