"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // check cookie token (simple frontend check)
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="));

    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    window.location.href = "/";
  };

  return (
    <nav style={styles.nav}>
      {/* LEFT LOGO */}
      <Link href="/" style={styles.logo}>
        🌾 LandVest
      </Link>

      {/* RIGHT BUTTONS */}
      <div style={styles.right}>
        {!isLoggedIn ? (
          <>
            <Link href="/login" style={styles.btn}>
              Login
            </Link>

            <Link href="/register" style={styles.btnOutline}>
              Register
            </Link>
          </>
        ) : (
          <>
            <Link href="/admin" style={styles.btn}>
              Dashboard
            </Link>

            <button onClick={handleLogout} style={styles.logout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

/* ================= STYLES ================= */
const styles: any = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 24px",
    background: "#0F172A",
    color: "white",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },

  logo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FACC15",
    textDecoration: "none",
  },

  right: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },

  btn: {
    background: "#FACC15",
    color: "#0F172A",
    padding: "8px 14px",
    borderRadius: 6,
    fontWeight: "bold",
    textDecoration: "none",
  },

  btnOutline: {
    border: "1px solid #FACC15",
    color: "#FACC15",
    padding: "8px 14px",
    borderRadius: 6,
    textDecoration: "none",
  },

  logout: {
    background: "transparent",
    border: "1px solid #fff",
    color: "white",
    padding: "8px 14px",
    borderRadius: 6,
    cursor: "pointer",
  },
};
