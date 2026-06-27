import { Suspense } from "react";
import CheckInVerifyPage from "@/pages/authentication/check-in/CheckInVerifyPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Check-In — I Was Killed for This Information",
  description: "Verifying your check-in link and granting dashboard access.",
};

export default function CheckInVerifyRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <span className="inline-block h-12 w-12 rounded-full border-4 border-[#333] border-t-red-500 animate-spin" />
        </div>
      }
    >
      <CheckInVerifyPage />
    </Suspense>
  );
}
