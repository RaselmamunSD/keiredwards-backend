"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, tokenStorage } from "@/lib/api";

export default function CheckInVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams?.get("token");
    if (!token) {
      setErrorMsg("No check-in token found in the URL. Please request a new check-in link.");
      setStatus("error");
      return;
    }

    api
      .verifyCheckInLink({ token })
      .then((res) => {
        // Store the JWT tokens — user is now authenticated
        tokenStorage.set({ access: res.data.access, refresh: res.data.refresh });
        setStatus("success");
        // Small delay to show success before redirect
        setTimeout(() => {
          router.replace("/dashboard");
        }, 1500);
      })
      .catch((err: unknown) => {
        const message =
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : "Your check-in link is invalid or has expired. Please request a new one.";
        setErrorMsg(message);
        setStatus("error");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-bebas font-extrabold text-6xl tracking-[0.2em] text-white uppercase">
            CHECK-IN
          </h1>
          <div className="mx-auto mt-2 h-0.5 w-12 bg-red-600 rounded-full" />
        </div>

        <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-8 shadow-2xl shadow-black/80 text-center">
          {/* Loading */}
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <span className="inline-block h-12 w-12 rounded-full border-4 border-[#333] border-t-red-500 animate-spin" />
              <p className="text-gray-300 text-sm tracking-wide">Verifying your check-in link…</p>
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-white text-lg font-semibold mb-1">Check-In Complete!</p>
                <p className="text-gray-400 text-sm">Redirecting you to the dashboard…</p>
              </div>
              <span className="inline-block h-5 w-5 rounded-full border-2 border-[#333] border-t-green-400 animate-spin" />
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-lg font-semibold mb-2">Link Invalid or Expired</p>
                <p className="text-gray-400 text-sm leading-relaxed">{errorMsg}</p>
              </div>
              <a
                href="/check-in"
                className="w-full rounded-md bg-red-600 hover:bg-red-500 active:bg-red-700
                  cursor-pointer py-3 text-sm font-bold tracking-[0.2em] text-white uppercase
                  transition-all duration-200 flex items-center justify-center"
              >
                REQUEST A NEW LINK
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
