"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      await api.passwordReset(email);
      setSuccess(true);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md border border-white/20 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 text-3xl font-bold">
            ✓
          </div>
          <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
          <p className="text-sm text-white/70 mb-6 leading-relaxed">
            We have sent a password reset link to <span className="text-blue-300 font-semibold">{email}</span>. Please check your inbox and follow the instructions to reset your password.
          </p>
          <Link
            href="/login"
            className="inline-block w-full bg-blue-600 hover:bg-blue-500 text-white rounded py-2.5 font-semibold transition-colors duration-150 text-center"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md border border-white/20 rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
        <p className="text-sm text-white/70 mb-5">
          Enter your email. We will send a reset link.
        </p>
        {!!status && <p className="mb-4 text-sm text-red-400 font-medium">{status}</p>}
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
        <div className="mt-4 text-center">
          <Link href="/login" className="inline-block text-sm underline text-blue-300 hover:text-blue-200">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
