"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyWhatsAppForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCodeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    setCode(value);
    setError("");
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email) {
      setError(
        "Verification email is missing. Please register again."
      );
      return;
    }

    if (code.length !== 6) {
      setError(
        "Please enter the 6-digit verification code."
      );
      return;
    }

    setLoading(true);

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
            code,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ||
            "Verification failed. Please try again."
        );
        return;
      }

      setSuccess(
        "WhatsApp verified successfully!"
      );

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      console.error(
        "WhatsApp verification error:",
        error
      );

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">

        <div className="text-center mb-8">
          <div className="text-4xl mb-4">
            💬
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Verify WhatsApp
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            Enter the 6-digit verification code
            sent to your WhatsApp number.
          </p>

          {email && (
            <p className="text-sm font-medium text-gray-700 mt-3 break-all">
              {email}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-2 text-center"
            >
              Verification Code
            </label>

            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              className="w-full rounded-xl border border-gray-300 px-4 py-4 text-center text-2xl tracking-[0.5em] font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? "Verifying..."
              : "Verify WhatsApp"}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/register"
            className="text-sm text-blue-600 hover:underline"
          >
            Back to Registration
          </Link>
        </div>
      </div>
    </main>
  );
}
