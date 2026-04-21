"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

export default function PaymentSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const reference = useMemo(() => params.get("reference") || "", [params]);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("Verifying payment...");

  useEffect(() => {
    const verify = async () => {
      if (!reference) {
        setStatus("error");
        setMessage("Payment reference is missing.");
        return;
      }
      setStatus("loading");
      try {
        const result = await api.paymentsVerify(reference);
        setStatus("ok");
        setMessage(
          `Payment ${result.data.payment.status} (TX: ${result.data.payment.transaction_id}).`
        );
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Payment verification failed.");
      }
    };
    void verify();
  }, [reference]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl border border-white/20 rounded-xl p-6 bg-black/50">
        <h1 className="text-2xl font-bold mb-3">Payment Verification</h1>
        <p
          className={`text-sm ${
            status === "ok" ? "text-green-400" : status === "error" ? "text-red-400" : "text-white"
          }`}
        >
          {message}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm cursor-pointer"
            onClick={() => router.push("/dashboard")}
          >
            Go to Dashboard
          </button>
          <button
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm cursor-pointer"
            onClick={() => router.push("/payment")}
          >
            Back to Payment
          </button>
        </div>
      </div>
    </div>
  );
}
