"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SignupFlow from "@/pages/authentication/SignupFlow";

export default function SignupPage() {
  const { isLoggedIn, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      // If a user visits the registration page while logged in, log them out.
      // This allows them to register a new account instead of being redirected to the dashboard.
      void logout();
    }
  }, [isLoggedIn, isLoading, logout]);

  // Removed the isLoading || isLoggedIn early return to prevent SSG flashing.
  // The useEffect will handle redirecting logged-in users.

  return <SignupFlow />;
}

