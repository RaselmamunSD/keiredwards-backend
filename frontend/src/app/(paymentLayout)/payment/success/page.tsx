"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { getCrossDomainUrl, LOGIN_DOMAIN } from "@/lib/navigation";

function PaymentSuccessContent() {
  const params = useSearchParams();
  // PayPal redirects back with ?token=<OrderID>&PayerID=<id>
  // Our backend also may use ?reference=<OrderID>
  const reference = useMemo(() => {
    if (!params) return "";
    return params.get("token") || params.get("reference") || "";
  }, [params]);

  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("Verifying payment...");
  const [redirectTab, setRedirectTab] = useState("documents-and-images");

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
          `Payment ${result.data.payment.status} (TX: ${result.data.payment.transaction_id}). Redirecting...`
        );
        let tab = "documents-and-images";
        if (result.data.payment.metadata?.type === "press_release_upgrade") {
          tab = "press-release";
        } else if (result.data.payment.metadata?.type === "setup_accounting_purchase") {
          tab = "setup-accounting";
        }
        setRedirectTab(tab);
        // Automatically redirect to the dashboard
        setTimeout(() => {
          window.location.href = getCrossDomainUrl(LOGIN_DOMAIN, `/dashboard?tab=${tab}`);
        }, 1000);
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
          {status === "ok"
            ? message.replace(/^Payment\s+\w+/i, "Payment completed")
            : message}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm cursor-pointer"
            onClick={() => {
              window.location.href = getCrossDomainUrl(LOGIN_DOMAIN, `/dashboard?tab=${redirectTab}`);
            }}
          >
            Go to Dashboard
          </button>
          <button
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm cursor-pointer"
            onClick={() => window.history.back()}
          >
            Back to Payment
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading verification...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
