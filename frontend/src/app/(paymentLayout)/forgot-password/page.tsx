"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      const res = await api.passwordReset(email);
      if (res.data && res.data.uid && res.data.token) {
        setResetLink(`/reset-password?uid=${res.data.uid}&token=${res.data.token}`);
      }
      setSuccess(true);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-[480px] px-8 py-10 bg-[#0f0f0f] rounded-3xl shadow-[0_8px_48px_rgba(0,0,0,0.48)] border border-white/10 text-center space-y-6">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500 text-3xl font-bold">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-white">Check Your Email</h1>
          <p className="text-sm text-white/60 leading-relaxed">
            We have sent a password reset link to <span className="text-red-400 font-semibold">{email}</span>.
          </p>

          {resetLink && (
            <div className="p-4 bg-[#1a1a1a] border border-white/10 rounded-xl space-y-2 text-center">
              <p className="text-xs text-[#e8281e] uppercase tracking-wider font-semibold">Development Preview Link</p>
              <Link
                href={resetLink}
                className="inline-block w-full bg-[#e8281e] hover:bg-[#cf1f17] text-white rounded-xl py-2.5 text-sm font-bold transition-all duration-150"
              >
                Go to Reset Password
              </Link>
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block text-sm text-white/40 hover:text-white/60 underline transition-colors"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-[480px] px-8 py-10 bg-[#0f0f0f] rounded-3xl shadow-[0_8px_48px_rgba(0,0,0,0.48)] border border-white/10">
        <h1 className="text-4xl font-extrabold text-[#e8281e] tracking-tight uppercase mb-2" style={{ fontFamily: "var(--font-anton)" }}>Forgot Password</h1>
        <p className="text-sm text-white/50 mb-6 font-medium">
          Enter your email. We will send a reset link.
        </p>
        {!!status && (
          <div className="mb-4 text-sm bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl font-medium">
            {status}
          </div>
        )}
        <label className="text-sm font-semibold text-white/80">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-2 mb-4 px-4 py-3 text-base text-white bg-[#1a1a1a] border border-white/10 rounded-xl focus:border-[#e8281e] focus:ring-1 focus:ring-[#e8281e] outline-none transition-all duration-200 placeholder-white/20"
          placeholder="you@example.com"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#e8281e] hover:bg-[#cf1f17] active:bg-[#b0140e] disabled:opacity-50 text-white rounded-xl py-3 text-base font-bold transition-all duration-200 shadow-lg shadow-red-900/10 hover:shadow-red-900/20 cursor-pointer mt-4"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        <div className="mt-5 text-center">
          <Link href="/login" className="inline-block text-sm underline text-white/40 hover:text-white/60 transition-colors">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
