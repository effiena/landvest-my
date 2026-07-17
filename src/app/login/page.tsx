"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    console.log("LOGIN RESPONSE:", data); // 🔥 IMPORTANT DEBUG

    if (!res.ok) {
      alert(data.error || "Login failed");
      setLoading(false);
      return;
    }

    if (data.token) {
      document.cookie = `token=${data.token}; path=/; max-age=604800`;

      console.log("REDIRECTING...");

      router.push("/admin");
    } else {
      alert("No token received");
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }

  setLoading(false);
};





  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Agent Login</h1>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}

/* ===== STYLES ===== */
const styles: any = {
  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0b1f3a",
  },

  card: {
    width: 360,
    padding: 24,
    borderRadius: 12,
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
  },

  title: {
    marginBottom: 20,
    color: "#0b1f3a",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  input: {
    padding: 12,
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 14,
  },

  button: {
    padding: 12,
    background: "#f5c542",
    border: "none",
    borderRadius: 6,
    fontWeight: "bold",
    color: "#0b1f3a",
    cursor: "pointer",
  },
};
