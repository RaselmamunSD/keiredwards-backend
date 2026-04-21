"use client";

import { useRouter } from "next/navigation";
import { LoginCredentials } from "@/Types/Types";
import StepCredentials from "@/pages/authentication/login/StepCredentials";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (credentials: LoginCredentials) => {
    setError("");
    setLoading(true);
    try {
      await login(credentials);
      router.push("/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <StepCredentials onSuccess={handleSuccess} />
      <Link
        href="/forgot-password"
        className="fixed bottom-14 text-xs text-blue-300 hover:text-blue-200 underline"
      >
        Forgot password?
      </Link>
      {loading && (
        <p className="fixed bottom-8 text-sm text-green-400 font-semibold">Signing in...</p>
      )}
      {!!error && (
        <p className="fixed bottom-8 text-sm text-red-400 font-semibold">{error}</p>
      )}
    </div>
  );
}