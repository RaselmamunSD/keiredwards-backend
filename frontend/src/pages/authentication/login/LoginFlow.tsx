"use client";

// LoginFlow — "use client" boundary for login.
// On successful credentials, navigates to /overview (dashboard).

import { useRouter } from "next/navigation";
import StepCredentials from "./StepCredentials";
import { LoginCredentials } from "@/Types/Types";


export default function LoginFlow() {
  const router = useRouter();

  const handleSuccess = (credentials: LoginCredentials) => {
    // Tokens are already stored in localStorage by StepCredentials
    // Navigate to dashboard/overview page
    console.log("Successfully logged in as:", credentials.username);
    router.push("/overview");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4">
      <StepCredentials onSuccess={handleSuccess} />
    </div>
  );
}