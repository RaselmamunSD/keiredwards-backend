"use client";

import { useRouter } from "next/navigation";
import { LoginCredentials } from "@/Types/Types";
import StepCredentials from "@/pages/authentication/login/StepCredentials";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const handleSuccess = (credentials: LoginCredentials) => {
    login();
    router.push("/overview"); // ← goes to Welcome Back page, NOT settings
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <StepCredentials onSuccess={handleSuccess} />
    </div>
  );
}