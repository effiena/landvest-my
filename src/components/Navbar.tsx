"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="));

    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    window.location.href = "/";
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav style={styles.nav}>
      {/* LOGO */}
      <Link
        href="/"
        onClick={closeMenu}
        style={styles.logoButton}
      >
        PropVest
      </Link>

      {/* MOBILE MENU BUTTON */}
      <button
        className="propvest-navbar-menu"
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
        style={styles.menuButton}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* NAVIGATION */}
      <div
        className={`propvest-navbar-links ${menuOpen ? "propvest-mobile-nav" : ""}`}
        style={styles.right}
      >
        <Link
          href="/want-to-buy"
          onClick={closeMenu}
          style={styles.wtbBtn}
        >
          Want To Buy
        </Link>

        <Link
          href="/membership"
          onClick={closeMenu}
          style={styles.memberBtn}
        >
          ⭐ Be a PropVest Member
        </Link>

        {!isLoggedIn ? (
          <Link
            href="/login"
            onClick={closeMenu}
            style={styles.btn}
          >
            Login
          </Link>
        ) : (
          <>
            <Link
              href="/admin"
              onClick={closeMenu}
              style={styles.btn}
            >
              Dashboard
            </Link>

            <button
              onClick={handleLogout}
              style={styles.logout}
            >
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
    background: "#F4F7FB",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    boxSizing: "border-box",
    width: "100%",
  },

  logoButton: {
    padding: "8px 16px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.7)",
    border: "1px solid #CBD5E1",
    color: "#0F172A",
    fontWeight: 800,
    fontSize: 20,
    textDecoration: "none",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },

  right: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  mobileOpen: {
    display: "flex",
  },

  menuButton: {
    display: "none",
    background: "#1E3A8A",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 8,
    width: 42,
    height: 42,
    fontSize: 22,
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
  },

  wtbBtn: {
    background: "#1E3A8A",
    color: "#FFFFFF",
    padding: "9px 13px",
    borderRadius: 7,
    fontWeight: "bold",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },

  memberBtn: {
    background: "#16A34A",
    color: "#FFFFFF",
    padding: "9px 13px",
    borderRadius: 7,
    fontWeight: "bold",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },

  btn: {
    background: "#FACC15",
    color: "#0F172A",
    padding: "9px 15px",
    borderRadius: 7,
    fontWeight: "bold",
    textDecoration: "none",
    whiteSpace: "nowrap",
    border: "none",
  },

  logout: {
    background: "#FACC15",
    border: "none",
    color: "#0F172A",
    padding: "9px 15px",
    borderRadius: 7,
    cursor: "pointer",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
};

if (typeof document !== "undefined") {
  const styleId = "propvest-navbar-mobile-style";

  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;

    style.textContent = `
      @media (max-width: 768px) {
        .propvest-navbar-menu {
          display: none !important;
        }

        @media (max-width: 768px) {
          .propvest-navbar-menu {
            display: flex !important;
          }

          .propvest-navbar-links {
            display: none !important;
          }

          .propvest-navbar-links.propvest-mobile-nav {
            display: flex !important;
            position: absolute;
            top: 70px;
            left: 12px;
            right: 12px;
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 14px;
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 14px;
            box-shadow: 0 12px 30px rgba(0,0,0,0.12);
          }

          .propvest-navbar-links a,
          .propvest-navbar-links button {
            width: 100%;
            box-sizing: border-box;
            text-align: center;
          }
        }
      }
    `;

    document.head.appendChild(style);
  }
}
