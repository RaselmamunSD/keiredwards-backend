"use client";

// LoginFlow — "use client" boundary for login.
// On successful credentials, navigates to /dashboard.

import { useRouter } from "next/navigation";
import StepCredentials from "./StepCredentials";
import { LoginCredentials } from "@/Types/Types";


export default function LoginFlow() {
  const router = useRouter();

  const handleSuccess = (credentials: LoginCredentials) => {
    // In production: call your auth API, set session/cookie, then redirect.
    // For now, simulate successful login and navigate to dashboard.
    console.log("Authenticated:", credentials.username);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4">
      <StepCredentials onSuccess={handleSuccess} />
    </div>
  );
}