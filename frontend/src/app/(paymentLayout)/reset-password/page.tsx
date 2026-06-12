"use client";

import { FormEvent, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Lock, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const uid = useMemo(() => (params ? params.get("uid") || "" : ""), [params]);
  const token = useMemo(() => (params ? params.get("token") || "" : ""), [params]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("");
    
    if (!uid || !token) {
      setStatus("Invalid or expired reset link. Please request a new link from the forgot password screen.");
      return;
    }
    
    if (newPassword.length < 8) {
      setStatus("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.passwordResetConfirm({
        uid,
        token,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md p-8 text-center bg-[#0f0f0f] rounded-2xl shadow-2xl border border-white/10">
        <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 text-3xl font-bold">
          ✓
        </div>
        <h1 className="text-2xl font-bold mb-2 text-white">Success!</h1>
        <p className="text-sm text-white/60 mb-6">
          Your password has been reset successfully. Redirecting you to login page...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[480px] px-8 py-10 bg-[#0f0f0f] rounded-3xl shadow-[0_8px_48px_rgba(0,0,0,0.48)] border border-white/10">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-[#e8281e] tracking-tight uppercase" style={{ fontFamily: "var(--font-anton)" }}>Reset Password</h1>
          <p className="text-base text-white/50 font-medium">Enter your new password below.</p>
        </div>

        {!!status && (
          <div className="p-3.5 text-sm bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-medium">
            {status}
          </div>
        )}

            {/* New Password */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/80">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Lock className="h-5 w-5 text-white/40" />
                </span>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 text-base text-white bg-[#1a1a1a] border border-white/10 rounded-xl focus:border-[#e8281e] focus:ring-1 focus:ring-[#e8281e] outline-none transition-all duration-200 placeholder-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-white/40 font-medium">Must be at least 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/80">Confirm New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Lock className="h-5 w-5 text-white/40" />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 text-base text-white bg-[#1a1a1a] border border-white/10 rounded-xl focus:border-[#e8281e] focus:ring-1 focus:ring-[#e8281e] outline-none transition-all duration-200 placeholder-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e8281e] hover:bg-[#cf1f17] active:bg-[#b0140e] disabled:opacity-50 text-white rounded-xl py-3 text-base font-bold transition-all duration-200 shadow-lg shadow-red-900/10 hover:shadow-red-900/20 cursor-pointer mt-4"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4 py-12">
      <Suspense fallback={
        <div className="w-full max-w-[480px] px-8 py-10 bg-[#0f0f0f] rounded-3xl shadow-[0_8px_48px_rgba(0,0,0,0.48)] border border-white/10 text-center text-white/50">
          Loading reset password page...
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
