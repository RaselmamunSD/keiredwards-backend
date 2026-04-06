"use client";
// Step 3 — Release Configuration (Upon my Death)
// Fixed: radio selection now works correctly for all options.
// Updated: press release tiers are 250 / 500 / 1,000 media organizations (per client HTML).
// Adopts white-card aesthetic from client review.

import { useState } from "react";
import { Step3Data } from "./SignupFlow";

// ─── Press release options matching client's HTML ─────────────────────────────
const PRESS_OPTIONS = [
  {
    field: "pressRelease250" as const,
    outlets: 250,
    price: "$250",
    title: "250 Media Organizations",
    desc: "PRESS RELEASE - 250 MEDIA ORGANIZATIONS",
  },
  {
    field: "pressRelease500" as const,
    outlets: 500,
    price: "$495",
    title: "500 Media Organizations",
    desc: "Expanded national coverage plus major wire services and digital media",
  },
  {
    field: "pressRelease1000" as const,
    outlets: 1000,
    price: "$695",
    title: "1,000 Media Organizations",
    desc: "Maximum coverage — international outlets, broadcasters, and investigative press",
  },
];

const PRESS_CATEGORIES = [
  "Political / Government Corruption",
  "Corporate Fraud & Whistleblowing",
  "Human Rights Violations",
  "Environmental Evidence",
  "Medical / Healthcare Disclosure",
  "Legal Evidence & Testimony",
  "Personal Safety & Threats",
  "Financial Fraud & Banking",
  "Other",
];

const DEFAULT_STEP3: Step3Data = {
  sendToRecipients: true,
  pressRelease250: false,
  pressRelease500: false,
  pressRelease1000: false,
  pressCategory: "",
};

interface Props {
  data?: Step3Data;
  onChange: (data: Step3Data) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function Step3Recipients({ data = DEFAULT_STEP3, onChange, onBack, onNext }: Props) {
  const [showError, setShowError] = useState(false);

  // Determine which option is selected
  const selectedField: keyof Step3Data | null =
    data.sendToRecipients ? "sendToRecipients" :
      data.pressRelease250 ? "pressRelease250" :
        data.pressRelease500 ? "pressRelease500" :
          data.pressRelease1000 ? "pressRelease1000" :
            null;

  const isPressSelected = data.pressRelease250 || data.pressRelease500 || data.pressRelease1000;

  const handleSelect = (field: keyof Step3Data) => {
    // Reset all options, set only the chosen one
    onChange({
      sendToRecipients: false,
      pressRelease250: false,
      pressRelease500: false,
      pressRelease1000: false,
      pressCategory: data.pressCategory,
      [field]: true,
    });
    setShowError(false);
  };

  const validate = () => {
    if (!selectedField) return false;
    if (isPressSelected && !data.pressCategory) return false;
    return true;
  };

  const handleContinue = () => {
    if (!validate()) { setShowError(true); return; }
    onNext();
  };

  const errorMsg = !selectedField
    ? "Please select one distribution method to continue."
    : "Please select a press release category.";

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pb-10">
      {/* White card */}
      <div className="bg-white rounded-[22px] overflow-hidden shadow-[0_8px_48px_rgba(0,0,0,0.28),0_1px_4px_rgba(0,0,0,0.10)] border border-black/10">

        {/* Card header */}
        <div className="bg-[#f8f8f8] border-b border-black/8 px-6 sm:px-9 py-7">
          <p className="text-[12px] font-bold tracking-[.2em] uppercase text-[#e8281e] mb-2 font-mono">
            Step 3 of 4
          </p>
          <h2 className="block text-[2rem] md:text-[4rem] lg:text-[2rem] uppercase leading-none tracking-wide text-black mb-2"
            style={{ fontFamily: "var(--font-anton)" }}>
            Release Configuration
          </h2>
          <p className="text-md text-[#555] leading-relaxed">
            In the event you are unable to check in, who should receive your documents, videos, and
            evidence? Configure your distribution method below.
          </p>
        </div>

        {/* Card body */}
        <div className="px-6 sm:px-9 py-8">

          {/* ── Trusted Recipients ── */}
          <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#888] mb-3">
            Send to Trusted Recipients
          </p>

          <label
            className={[
              "flex items-start gap-4 rounded-[12px] border px-5 py-4 cursor-pointer transition-all mb-6",
              selectedField === "sendToRecipients"
                ? "bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.40)]"
                : "bg-[#f8f8f8] border-black/10 hover:border-black/20",
            ].join(" ")}
          >
            <input
              type="radio"
              name="dist"
              checked={selectedField === "sendToRecipients"}
              onChange={() => handleSelect("sendToRecipients")}
              className="mt-0.5 w-4 h-4 accent-green-500 shrink-0 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[#111] font-bold text-md mb-1">
                Send to 10 Trusted Recipients
              </p>
              <p className="text-[#555] text-sm leading-relaxed">
                If you do not respond to your Check-In, the system assumes the
                worst and takes action. I WAS KILLED FOR THIS INFORMATION will
                automatically email your files via secure link to up to 10 trusted
                contacts of your choice. Whether they are family, friends, lawyers,
                or colleagues, you&apos;ll have full control to configure these recipients
                after you sign up.

              </p>
            </div>
            {/* <span className="text-xs font-bold text-green-600 shrink-0 mt-0.5">Included</span> */}
          </label>

          {/* ── Or divider ── */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-black/10" />
            <span className="text-[#999] text-xs font-semibold uppercase tracking-[.1em]">Or</span>
            <div className="flex-1 h-px bg-black/10" />
          </div>

          {/* ── Press Release options ── */}
          <p className="text-sm text-[#555] leading-relaxed mb-4">
            When a Trusted Recipient isn't the right choice. Sometimes, a
            personal contact may be unwilling to get involved, or the risk to
            them and their family may be too high. If a private recipient isn't
            appropriate, you can choose to issue a press release through our
            secure, predefined channels. This ensures your information
            reaches the public or the relevant authorities directly, removing
            the burden from any single individual.
          </p>

          <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#888] mb-3">
            Press Release
          </p>

          <div className="space-y-2 mb-6">
            {PRESS_OPTIONS.map(({ field, price, title, desc }) => (
              <label
                key={field}
                className={[
                  "flex items-start gap-4 rounded-[12px] border px-5 py-4 cursor-pointer transition-all",
                  selectedField === field
                    ? "bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.40)]"
                    : "bg-[#f8f8f8] border-black/10 hover:border-black/20",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="dist"
                  checked={selectedField === field}
                  onChange={() => handleSelect(field)}
                  className="mt-0.5 w-4 h-4 accent-green-500 shrink-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[#111] font-bold text-sm mb-0.5">{title}</p>
                  <p className="text-[#555] text-xs leading-relaxed">{desc}</p>
                </div>
                <span className="text-xs font-bold text-[#e8281e] shrink-0 mt-0.5 font-mono">{price}</span>
              </label>
            ))}
          </div>

          {/* ── Press Category ── */}
          <div className="mb-8">
            <label
              htmlFor="pressCategory"
              className={[
                "text-[11px] font-bold uppercase tracking-[.12em] block mb-2 transition-colors",
                isPressSelected ? "text-[#444]" : "text-[#bbb]",
              ].join(" ")}
            >
              Press Release Category
              {isPressSelected && <span className="text-[#e8281e] ml-1">*</span>}
            </label>
            <div className="relative">
              <select
                id="pressCategory"
                value={data.pressCategory}
                onChange={(e) => onChange({ ...data, pressCategory: e.target.value })}
                disabled={!isPressSelected}
                className={[
                  "w-full rounded-[10px] px-4 py-3 pr-10 text-sm outline-none transition-all border appearance-none",
                  isPressSelected
                    ? "bg-[#f9f9f9] border-black/15 text-[#111] focus:border-[#e8281e] focus:shadow-[0_0_0_3px_rgba(232,40,30,0.12)] focus:bg-white cursor-pointer"
                    : "bg-[#f5f5f5] border-black/8 text-[#bbb] cursor-not-allowed",
                ].join(" ")}
              >
                <option value="">Select category of information…</option>
                {PRESS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs ${isPressSelected ? "text-[#666]" : "text-[#bbb]"}`}>▼</span>
            </div>
          </div>

          {/* Validation error */}
          {showError && (
            <p className="text-[#e8281e] text-sm mb-4 -mt-4 font-medium">{errorMsg}</p>
          )}

          {/* Nav */}
          <div className="flex justify-between">
            <button
              onClick={onBack}
              className="border border-black/18 text-[#555] bg-white hover:border-[#111] hover:text-[#111] font-bold text-sm px-8 py-3 rounded-[10px] uppercase tracking-[.06em] transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={handleContinue}
              className="bg-[#e8281e] hover:bg-[#c8221a] text-white font-bold text-sm px-8 py-3 rounded-[10px] uppercase tracking-[.08em] transition-all shadow-[0_4px_20px_rgba(232,40,30,.3)] hover:shadow-[0_10px_32px_rgba(232,40,30,.45)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              Continue →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}