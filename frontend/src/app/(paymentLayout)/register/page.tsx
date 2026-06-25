"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SignupFlow from "@/pages/authentication/SignupFlow";

export default function SignupPage() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.push("/overview");
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading || isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="text-sm text-green-400 font-semibold">Redirecting to dashboard...</p>
      </div>
    );
  }

  return <SignupFlow />;
}

