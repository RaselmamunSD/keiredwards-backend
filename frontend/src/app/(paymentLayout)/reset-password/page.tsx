"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const uid = useMemo(() => params.get("uid") || "", [params]);
  const token = useMemo(() => params.get("token") || "", [params]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      await api.passwordResetConfirm({
        uid,
        token,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      });
      setStatus("Password reset successful. Redirecting to login...");
      setTimeout(() => router.push("/login"), 1200);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md border border-white/20 rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
        {!uid || !token ? (
          <p className="text-red-400 text-sm">Invalid reset link. Please request a new one.</p>
        ) : (
          <>
            <label className="text-xs uppercase tracking-wider text-white/80">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mt-2 mb-4 bg-white text-black rounded px-3 py-2"
            />
            <label className="text-xs uppercase tracking-wider text-white/80">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full mt-2 mb-4 bg-white text-black rounded px-3 py-2"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded py-2 font-semibold cursor-pointer"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </>
        )}
        {!!status && <p className="mt-4 text-sm text-green-400">{status}</p>}
      </form>
    </div>
  );
}
