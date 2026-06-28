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

  // Removed the isLoading || isLoggedIn early return to prevent SSG flashing.
  // The useEffect will handle redirecting logged-in users.

  return <SignupFlow />;
}

