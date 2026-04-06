"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  label: string;
  price: number;
}

interface PaymentPageProps {
  amount?: number;
  orderItems?: OrderItem[];
  merchantName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-6 w-6 text-[#0070ba]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({ amount, onDone }: { amount: number; onDone?: () => void }) {
  return (
    <div className="fixed inset-0 bg-[#f5f7fa] flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#00b300] flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-[#003087] mb-2">Payment Successful!</h2>
        <p className="text-gray-500 text-sm mb-4">
          Your payment of <span className="font-bold text-gray-800">${amount.toFixed(2)}</span> has been processed.
        </p>
        <div className="bg-[#f0f8ff] border border-[#d0e8ff] rounded-xl px-6 py-4 mb-6 text-left">
          <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
          <p className="text-sm font-mono font-semibold text-[#003087]">
            PP-{Math.random().toString(36).substring(2, 10).toUpperCase()}
          </p>
        </div>
        <p className="text-xs text-gray-400 mb-6">A confirmation email will be sent to your PayPal email address.</p>
        <button
          onClick={onDone}
          className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold py-3 rounded-full transition-colors text-sm cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaymentPage({
  amount = 599.88,
  orderItems = [
    { label: "Weekly Check-In | 1 Year", price: 359.88 },
    { label: "Additional Storage 5GB", price: 75.00 },
    { label: "Press Release", price: 250.00 },
    { label: "Secured Login (2FA)", price: 39.00 },
  ],
  merchantName = "Service Payment",
  onSuccess,
  onCancel,
}: PaymentPageProps) {
  const router = useRouter();
  const [step, setStep] = useState<"choose" | "email" | "card" | "processing" | "success">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [cardErrors, setCardErrors] = useState<Partial<typeof card>>({});

  const handleLogin = () => {
    let valid = true;
    if (!email.includes("@")) { setEmailError("Enter a valid email address."); valid = false; } else setEmailError("");
    if (password.length < 4) { setPasswordError("Enter your PayPal password."); valid = false; } else setPasswordError("");
    if (!valid) return;
    setStep("processing");
    setTimeout(() => setStep("success"), 2800);
  };

  const handleCardPay = () => {
    const errs: Partial<typeof card> = {};
    if (card.number.replace(/\s/g, "").length < 16) errs.number = "Enter a valid card number.";
    if (!card.expiry.match(/^\d{2}\/\d{2}$/)) errs.expiry = "Format: MM/YY";
    if (card.cvv.length < 3) errs.cvv = "Enter CVV.";
    if (!card.name.trim()) errs.name = "Enter cardholder name.";
    setCardErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setStep("processing");
    setTimeout(() => setStep("success"), 2800);
  };

  const formatCard = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  if (step === "success") return (
    <SuccessScreen
      amount={amount}
      onDone={() => {
        onSuccess?.();
        router.push("/login");
      }}
    />
  );

  return (
    <div className="fixed inset-0 bg-[#f5f7fa] flex flex-col items-center justify-center px-4">

      {/* Processing overlay */}
      {step === "processing" && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <Spinner />
          <p className="mt-4 text-[#003087] font-semibold text-sm">Processing your payment…</p>
        </div>
      )}

      {/* PayPal Logo */}
      <div className="mb-6">
        <span style={{ fontFamily: "Arial, sans-serif", fontWeight: "bold", fontSize: "32px" }}>
          <span style={{ color: "#003087" }}>Pay</span>
          <span style={{ color: "#009cde" }}>Pal</span>
        </span>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Merchant + Amount */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Paying</p>
          <p className="text-xl font-bold text-[#003087]">{merchantName}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">${amount.toFixed(2)}</p>

          <details className="mt-3 group">
            <summary className="text-xs text-[#0070ba] cursor-pointer list-none flex items-center gap-1 select-none">
              <span>View order details</span>
              <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-2 space-y-1">
              {orderItems.map((item, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-600">
                  <span>{item.label}</span>
                  <span className="font-medium">${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* ── CHOOSE step ── */}
        {step === "choose" && (
          <div className="px-6 py-6 flex flex-col gap-3">
            <button
              onClick={() => setStep("email")}
              className="w-full bg-[#ffc439] hover:bg-[#f0b429] text-[#003087] font-bold py-3.5 rounded-full text-sm transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#003087">
                <path d="M7.5 3h9C19.43 3 22 5.57 22 8.5S19.43 14 16.5 14H14l-1.5 7H9l.75-4H6C3.79 17 2 15.21 2 13c0-2.06 1.54-3.76 3.53-3.97L7.5 3z" />
              </svg>
              Pay with PayPal
            </button>

            <div className="flex items-center gap-2 my-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or pay with card</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              onClick={() => setStep("card")}
              className="w-full bg-white border border-gray-300 hover:border-[#0070ba] text-gray-700 font-semibold py-3.5 rounded-full text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path strokeLinecap="round" d="M2 10h20" />
              </svg>
              Debit or Credit Card
            </button>

            <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 text-center mt-1 transition-colors">
              Cancel and return to {merchantName}
            </button>
          </div>
        )}

        {/* ── EMAIL/LOGIN step ── */}
        {step === "email" && (
          <div className="px-6 py-6 flex flex-col gap-4">
            <h3 className="text-base font-bold text-[#003087]">Log in to PayPal</h3>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0070ba] transition-colors ${emailError ? "border-red-400" : "border-gray-300"}`}
              />
              {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full border rounded-lg px-4 py-2.5 text-black text-sm focus:outline-none focus:border-[#0070ba] transition-colors ${passwordError ? "border-red-400" : "border-gray-300"}`}
              />
              {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
            </div>
            <button onClick={handleLogin} className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold py-3 rounded-full text-sm transition-colors cursor-pointer">
              Log In
            </button>
            <button onClick={() => setStep("choose")} className="text-xs text-[#0070ba] text-center hover:underline cursor-pointer">← Back</button>
          </div>
        )}

        {/* ── CARD step ── */}
        {step === "card" && (
          <div className="px-6 py-6 flex flex-col gap-4 text-black">
            <h3 className="text-base font-bold text-[#003087]">Pay with Card</h3>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Card number</label>
              <div className="relative">
                <input
                  type="text"
                  value={card.number}
                  onChange={e => setCard(c => ({ ...c, number: formatCard(e.target.value) }))}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0070ba] transition-colors pr-16 ${cardErrors.number ? "border-red-400" : "border-gray-300"}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1 rounded">VISA</span>
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1 rounded">MC</span>
                </div>
              </div>
              {cardErrors.number && <p className="text-red-500 text-xs mt-1">{cardErrors.number}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Expiry date</label>
                <input
                  type="text"
                  value={card.expiry}
                  onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                  placeholder="MM/YY"
                  maxLength={5}
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0070ba] transition-colors ${cardErrors.expiry ? "border-red-400" : "border-gray-300"}`}
                />
                {cardErrors.expiry && <p className="text-red-500 text-xs mt-1">{cardErrors.expiry}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">CVV</label>
                <input
                  type="password"
                  value={card.cvv}
                  onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                  placeholder="•••"
                  maxLength={4}
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0070ba] transition-colors ${cardErrors.cvv ? "border-red-400" : "border-gray-300"}`}
                />
                {cardErrors.cvv && <p className="text-red-500 text-xs mt-1">{cardErrors.cvv}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Cardholder name</label>
              <input
                type="text"
                value={card.name}
                onChange={e => setCard(c => ({ ...c, name: e.target.value }))}
                placeholder="Full name on card"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0070ba] transition-colors ${cardErrors.name ? "border-red-400" : "border-gray-300"}`}
              />
              {cardErrors.name && <p className="text-red-500 text-xs mt-1">{cardErrors.name}</p>}
            </div>

            <button onClick={handleCardPay} className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold py-3 rounded-full text-sm transition-colors cursor-pointer">
              Pay ${amount.toFixed(2)}
            </button>
            <button onClick={() => setStep("choose")} className="text-xs text-[#0070ba] text-center hover:underline cursor-pointer">← Back</button>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V7a4 4 0 00-8 0v4" />
            </svg>
            Secure payments powered by PayPal
          </div>
          <p className="text-[10px] text-gray-300">© 2026 PayPal. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}