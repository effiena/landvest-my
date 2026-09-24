"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showVerification, setShowVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [verified, setVerified] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      console.log("LOGIN RESPONSE:", data);

      if (!res.ok) {
        if (
          res.status === 403 &&
          data.error ===
            "Please verify your WhatsApp number before logging in."
        ) {
          setShowVerification(true);
          setOtpMessage(
            "Please verify your WhatsApp number to continue."
          );
        } else {
          alert(data.error || "Login failed");
        }

        setLoading(false);
        return;
      }

      console.log("LOGIN SUCCESS");
      console.log("Redirecting to admin...");

      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    setOtpLoading(true);
    setOtpMessage("");

    try {
      const res = await fetch(
        "/api/auth/send-whatsapp-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setOtpMessage(data.error || "Unable to send OTP.");
        return;
      }

      if (data.developmentCode) {
        setOtpMessage(
          `Development OTP: ${data.developmentCode}`
        );
      } else {
        setOtpMessage(
          "A 6-digit verification code has been sent to your WhatsApp."
        );
      }
    } catch (error) {
      console.error("OTP error:", error);
      setOtpMessage(
        "Unable to send OTP. Please try again."
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setOtpMessage("Please enter the 6-digit OTP.");
      return;
    }

    setOtpLoading(true);
    setOtpMessage("");

    try {
      const res = await fetch(
        "/api/auth/verify-whatsapp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            code: otp,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setOtpMessage(
          data.error || "Verification failed."
        );
        return;
      }

      setVerified(true);
      setOtpMessage(
        "WhatsApp verified successfully. You can now log in."
      );
    } catch (error) {
      console.error("Verification error:", error);
      setOtpMessage(
        "Verification failed. Please try again."
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const continueLogin = async () => {
    setShowVerification(false);
    setOtp("");
    setOtpMessage("");

    // Login again after verification.
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
            required
            autoComplete="email"
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
            autoComplete="current-password"
          />

          <button
            style={styles.button}
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>

      {showVerification && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <button
              style={styles.close}
              onClick={() =>
                setShowVerification(false)
              }
            >
              ×
            </button>

            <div style={styles.icon}>📱</div>

            <h2 style={styles.modalTitle}>
              Verify WhatsApp Number
            </h2>

            <p style={styles.modalText}>
              Your WhatsApp number must be verified
              before you can access your PropVest
              account.
            </p>

            <button
              style={styles.sendButton}
              onClick={sendOtp}
              disabled={otpLoading}
            >
              {otpLoading
                ? "Sending..."
                : "Send OTP"}
            </button>

            <input
              style={styles.otpInput}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) =>
                setOtp(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
            />

            {!verified ? (
              <button
                style={styles.verifyButton}
                onClick={verifyOtp}
                disabled={
                  otpLoading || otp.length !== 6
                }
              >
                Verify WhatsApp
              </button>
            ) : (
              <button
                style={styles.continueButton}
                onClick={continueLogin}
              >
                Continue to Dashboard
              </button>
            )}

            {otpMessage && (
              <p style={styles.message}>
                {otpMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0b1f3a",
    padding: 20,
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: 360,
    padding: 24,
    borderRadius: 12,
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
    boxSizing: "border-box",
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
    boxSizing: "border-box",
    width: "100%",
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

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 9999,
    boxSizing: "border-box",
  },

  modal: {
    position: "relative",
    width: "100%",
    maxWidth: 400,
    background: "#ffffff",
    borderRadius: 16,
    padding: 28,
    boxSizing: "border-box",
    boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
    textAlign: "center",
  },

  close: {
    position: "absolute",
    top: 10,
    right: 14,
    border: "none",
    background: "transparent",
    fontSize: 28,
    cursor: "pointer",
    color: "#666",
  },

  icon: {
    fontSize: 42,
    marginBottom: 10,
  },

  modalTitle: {
    margin: "0 0 10px",
    color: "#0b1f3a",
    fontSize: 22,
  },

  modalText: {
    color: "#666",
    fontSize: 14,
    lineHeight: 1.5,
    marginBottom: 20,
  },

  sendButton: {
    width: "100%",
    padding: 12,
    border: "none",
    borderRadius: 7,
    background: "#25D366",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: 12,
  },

  otpInput: {
    width: "100%",
    padding: 14,
    border: "1px solid #ddd",
    borderRadius: 7,
    textAlign: "center",
    fontSize: 22,
    letterSpacing: 6,
    boxSizing: "border-box",
    marginBottom: 12,
  },

  verifyButton: {
    width: "100%",
    padding: 12,
    border: "none",
    borderRadius: 7,
    background: "#0b1f3a",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  },

  continueButton: {
    width: "100%",
    padding: 12,
    border: "none",
    borderRadius: 7,
    background: "#0b1f3a",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  },

  message: {
    marginTop: 15,
    fontSize: 13,
    color: "#555",
    lineHeight: 1.4,
  },
};
