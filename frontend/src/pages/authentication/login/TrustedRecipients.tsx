"use client";

import { useState } from "react";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrustedRecipient {
  id: string;
  firstName: string;
  email: string;
  isOwner?: boolean;
}

type RecipientErrors = Partial<Record<"firstName" | "email", string>>;

interface Props {
  userEmail: string;
}

// ── Zod schema ────────────────────────────────────────────────────────────────

const recipientSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
});

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type = "success" }: { message: string; type?: "success" | "warning" | "error" }) {
  if (!message) return null;
  const styles = {
    success: "bg-green-50 border-green-300 text-green-800",
    warning: "bg-yellow-50 border-yellow-300 text-yellow-800",
    error: "bg-red-50 border-red-300 text-red-800",
  };
  return (
    <div className={`text-sm px-4 py-3 rounded-xl border mb-5 ${styles[type]}`}>
      {message}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TrustedRecipients({ userEmail }: Props) {
  const [recipients, setRecipients] = useState<TrustedRecipient[]>([
    { id: "owner", firstName: "Self", email: userEmail, isOwner: true },
  ]);

  const [showEmails, setShowEmails] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<RecipientErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // ── Toast State ──
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "warning" | "error">("success");

  const showToast = (msg: string, type: "success" | "warning" | "error" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 3500);
  };

  const validate = (data: { firstName: string; email: string }) => {
    const result = recipientSchema.safeParse(data);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      return { firstName: flat.firstName?.[0], email: flat.email?.[0] };
    }
    return {};
  };

  const handleAdd = () => {
    // FIX: Maximum 10 recipients validation
    if (recipients.length >= 10) {
      showToast("You have reached the maximum limit of 10 trusted recipients.", "error");
      return;
    }

    setSubmitted(true);
    const errs = validate({ firstName, email });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setRecipients(prev => [...prev, { id: Date.now().toString(), firstName, email }]);
    setFirstName(""); setEmail(""); setErrors({}); setSubmitted(false); setShowAddForm(false);
    showToast("Recipient added successfully.", "success");
  };

  const handleDelete = (id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

  const handleFieldChange = (field: "firstName" | "email", value: string) => {
    if (field === "firstName") setFirstName(value);
    else setEmail(value);
    if (submitted) {
      const data = {
        firstName: field === "firstName" ? value : firstName,
        email: field === "email" ? value : email,
      };
      setErrors(validate(data));
    }
  };

  const maskEmail = (em: string) => {
    const [local, domain] = em.split("@");
    if (!domain) return "••••••••";
    return local[0] + "•".repeat(Math.max(local.length - 2, 1)) + local.slice(-1) + "@" + domain;
  };

  return (
    <div className="flex justify-center px-4 py-10">
      <div className="w-full max-w-4xl text-black">

        {/* ── Header row ── */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h2 className="block text-[2rem] md:text-[4rem] lg:text-[2rem] uppercase leading-none tracking-wide mt-4"
              style={{ fontFamily: "var(--font-anton)", fontWeight: 300 }}>Trusted Recipients</h2>
            <p className="text-sm text-gray-500 mt-4">
              Up to 10 people who will receive your documents. Minimum 1 required.
            </p>
          </div>
          <button
            onClick={() => setShowEmails(v => !v)}
            className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
          >
            <span className="text-sm">{showEmails ? "🙈" : "👁️"}</span>
            {showEmails ? "HIDE EMAIL ADDRESSES" : "SHOW EMAIL ADDRESSES"}
          </button>
        </div>

        <hr className="border-gray-200 my-4" />

        <Toast message={toast} type={toastType} />

        {/* ── Recipients count indicator ── */}
        <div className="flex items-center justify-end mb-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            recipients.length >= 10
              ? "bg-red-50 border-red-300 text-red-600"
              : "bg-gray-50 border-gray-200 text-gray-500"
          }`}>
            {recipients.length} / 10 Recipients
          </span>
        </div>

        {/* ── Recipients Table ── */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden mb-6">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_44px] bg-green-500 px-5 py-3">
            <span className="text-black text-xs font-bold uppercase tracking-widest">First Name</span>
            <span className="text-black text-xs font-bold uppercase tracking-widest">Email Address</span>
            <span />
          </div>

          {recipients.map(r => (
            <div
              key={r.id}
              className="grid grid-cols-[1fr_1fr_44px] items-center px-5 py-4 border-b border-gray-100 bg-white last:border-b-0"
            >
              <span className="text-sm text-gray-800 font-medium">
                {r.firstName}
                {r.isOwner && (
                  <span className="ml-2 text-[10px] text-blue-500 font-bold tracking-wide bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                    YOU
                  </span>
                )}
              </span>
              <span className="text-sm text-gray-800 truncate pr-2">
                {showEmails ? r.email : maskEmail(r.email)}
              </span>
              <div className="flex justify-end">
                {r.isOwner ? (
                  <div
                    className="w-7 h-7 rounded-full border border-gray-200 bg-gray-50 text-gray-300 flex items-center justify-center text-xs"
                    title="Your account email cannot be removed"
                  >
                    🔒
                  </div>
                ) : (
                  <button
                    onClick={() => handleDelete(r.id)}
                    aria-label={`Delete ${r.firstName}`}
                    className="w-7 h-7 rounded-full border border-red-300 bg-white hover:bg-red-50 text-red-400 flex items-center justify-center text-base font-bold transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Add Form ── */}
        {showAddForm && (
          <div className="border border-gray-200 rounded-2xl bg-gray-50 p-5 mb-5">
            <h4 className="font-bold text-sm text-gray-800 mb-4">Add Trusted Recipient</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold block mb-1 text-gray-600">First Name</label>
                <input
                  value={firstName}
                  onChange={e => handleFieldChange("firstName", e.target.value)}
                  className={`w-full border rounded-xl text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-300 bg-white text-gray-900 ${errors.firstName ? "border-red-400" : "border-gray-300"}`}
                  placeholder="First Name"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1 text-gray-600">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => handleFieldChange("email", e.target.value)}
                  className={`w-full border rounded-xl text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-300 bg-white text-gray-900 ${errors.email ? "border-red-400" : "border-gray-300"}`}
                  placeholder="email@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAdd} className="bg-green-500 hover:bg-green-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer">
                Add Recipient
              </button>
              <button
                onClick={() => { setShowAddForm(false); setErrors({}); setSubmitted(false); setFirstName(""); setEmail(""); }}
                className="bg-white hover:bg-gray-100 text-gray-600 text-sm font-bold px-5 py-2.5 rounded-xl border border-gray-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Add Button — hidden when limit reached ── */}
        {!showAddForm && (
          <button
            onClick={() => {
              if (recipients.length >= 10) {
                showToast("You have reached the maximum limit of 10 trusted recipients.", "error");
                return;
              }
              setShowAddForm(true);
            }}
            disabled={recipients.length >= 10}
            className={`flex items-center text-black gap-2 text-sm font-bold px-7 py-3.5 rounded-xl transition-colors shadow-sm mb-4 cursor-pointer ${
              recipients.length >= 10
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-400"
            }`}
          >
            <span className="text-lg leading-none font-black">+</span>
            ADD ADDITIONAL TRUSTED RECIPIENTS
          </button>
        )}

        <p className="text-gray-400 text-xs mt-2">
          To modify a recipient, first delete them, then add them as new.
        </p>

      </div>
    </div>
  );
}