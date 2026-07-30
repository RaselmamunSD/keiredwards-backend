"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoginCredentials } from "@/Types/Types";
import StepCredentials from "@/pages/authentication/login/StepCredentials";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login, logout, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Force logout when visiting the login page to ensure user must always re-authenticate
    logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSuccess = async (credentials: LoginCredentials) => {
    setError("");
    setLoading(true);
    try {
      await login();
      router.push("/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  // Removed the isLoading || isLoggedIn early return to prevent SSG flashing.
  // The useEffect will handle redirecting logged-in users.

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <StepCredentials onSuccess={handleSuccess} />
      {loading && (
        <p className="fixed bottom-8 text-sm text-green-400 font-semibold">Signing in...</p>
      )}
      {!!error && (
        <p className="fixed bottom-8 text-sm text-red-400 font-semibold">{error}</p>
      )}
    </div>
  );
}