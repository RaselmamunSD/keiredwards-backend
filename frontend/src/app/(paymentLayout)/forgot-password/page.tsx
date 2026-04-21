"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      await api.passwordReset(email);
      setStatus("Password reset link sent. Check your email.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md border border-white/20 rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
        <p className="text-sm text-white/70 mb-5">
          Enter your email. We will send a reset link.
        </p>
        <label className="text-xs uppercase tracking-wider text-white/80">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-2 mb-4 bg-white text-black rounded px-3 py-2"
          placeholder="you@example.com"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded py-2 font-semibold cursor-pointer"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        {!!status && <p className="mt-4 text-sm text-green-400">{status}</p>}
        <Link href="/login" className="inline-block mt-4 text-sm underline text-blue-300">
          Back to login
        </Link>
      </form>
    </div>
  );
}
