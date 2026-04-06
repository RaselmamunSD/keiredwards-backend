"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MdKeyboardArrowDown } from "react-icons/md";

// ── Types ──────────────────────────────────────────────────────────────────
interface CheckInOption {
  label: string;
  displayLabel: string;
  pricePerMonth: number;
}

interface TermOption {
  label: string;
  years: number;
  savingLabel: string;
}

interface AddOn {
  id: string;
  label: string;
  description: string;
  pricePerYear: number;
}

// ── Data ───────────────────────────────────────────────────────────────────
const CHECK_IN_OPTIONS: CheckInOption[] = [
  { label: "Daily Check-In",     displayLabel: "Daily",     pricePerMonth: 49.99 },
  { label: "Weekly Check-In",    displayLabel: "Weekly",    pricePerMonth: 29.99 },
  { label: "Monthly Check-In",   displayLabel: "Monthly",   pricePerMonth: 14.99 },
  { label: "Quarterly Check-In", displayLabel: "Quarterly", pricePerMonth: 9.99  },
  { label: "Yearly Check-In",    displayLabel: "Yearly",    pricePerMonth: 4.99  },
];

const TERM_OPTIONS: TermOption[] = [
  { label: "1 Year",  years: 1, savingLabel: "Standard pricing" },
  { label: "2 Years", years: 2, savingLabel: "Save 5%"          },
  { label: "3 Years", years: 3, savingLabel: "Save 10%"         },
];

const ADD_ONS: AddOn[] = [
  {
    id: "private_email",
    label: "Private Check-In Email Address",
    description: "Surveillance-free email assigned exclusively to your account",
    pricePerYear: 39,
  },
  {
    id: "2fa",
    label: "Two-Factor Authentication (2FA)",
    description: "Time-sensitive codes providing a critical second barrier on every login",
    pricePerYear: 39,
  },
  {
    id: "extra_storage",
    label: "Additional Storage (1GB)",
    description: "Expand your vault for larger files and extensive archives",
    pricePerYear: 15,
  },
  {
    id: "press_release",
    label: "Press Release",
    description: "Automatically distribute your message to verified media outlets",
    pricePerYear: 59,
  },
];

// ── Component ──────────────────────────────────────────────────────────────
const PricingSection = () => {
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckInOption>(CHECK_IN_OPTIONS[0]);
  const [selectedTerm, setSelectedTerm]       = useState<TermOption>(TERM_OPTIONS[0]);

  // Base price = pricePerMonth × 12 × years
  const basePrice = useMemo(
    () => selectedCheckIn.pricePerMonth * 12 * selectedTerm.years,
    [selectedCheckIn, selectedTerm]
  );

  const { grandTotal, lineItems } = useMemo(() => {
    const items = [
      {
        label: `${selectedCheckIn.label} (${selectedTerm.years} Year${selectedTerm.years > 1 ? "s" : ""})`,
        price: basePrice,
      },
    ];

    return { grandTotal: basePrice, lineItems: items };
  }, [basePrice, selectedTerm, selectedCheckIn]);

  return (
    <section className="w-full bg-[#0a0a0a]">

      {/* ── Hero ── */}
      <section
        className="relative w-full flex flex-col items-center justify-center px-4 py-20 sm:py-16 overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse 60% 70% at 50% 0%, rgba(60,20,12,0.35) 0%, transparent 60%),
            radial-gradient(ellipse 35% 40% at 50% 0%, rgba(80,10,8,0.25) 0%, transparent 30%),
            #0d0d0d
          `,
        }}
      >
        <div className="relative z-10 flex items-center gap-3 mb-5 sm:mb-7">
          <span className="block w-7 sm:w-10 h-px bg-[#c0392b]" />
          <span className="text-[12px] tracking-[0.3em] text-[#c0392b] font-bold uppercase">
            Pricing
          </span>
          <span className="block w-7 sm:w-10 h-px bg-[#c0392b]" />
        </div>

        <div
          className="text-[2rem] md:text-[4rem] lg:text-[7rem] uppercase leading-none tracking-wide text-center text-white"
          style={{ fontFamily: "var(--font-anton)" }}
        >
          <h1 className="mt-4">Simple. Transparent. Yours.</h1>
        </div>

        <div className="relative z-10 mt-8 sm:mt-10 max-w-[620px] mx-auto text-center px-2 lg:pb-12">
          <p className="text-white/80 leading-relaxed text-xl" style={{ lineHeight: 1.8 }}>
            From signup to automatic distribution — every step is designed to be seamless,
            secure, and completely under your control.
          </p>
        </div>
      </section>

      {/* ── Calculator Card ── */}
      <div className="w-full py-10 sm:py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-[#111111] overflow-hidden">

            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-white font-bold text-lg">Build Your Plan</h2>
              <span className="flex items-center gap-2 text-green-400 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                5GB Storage Included
              </span>
            </div>

            <div className="px-6 py-6 space-y-6">

              {/* ── Dropdowns ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Check-In Frequency */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">
                    Check-In Frequency
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCheckIn.label}
                      onChange={(e) => {
                        const found = CHECK_IN_OPTIONS.find((o) => o.label === e.target.value);
                        if (found) setSelectedCheckIn(found);
                      }}
                      className="w-full bg-[#1c1c1c] border border-white/10 text-white rounded-lg px-4 py-3 text-sm appearance-none cursor-pointer focus:outline-none focus:border-white/25 pr-10"
                    >
                      {CHECK_IN_OPTIONS.map((opt) => (
                        <option key={opt.label} value={opt.label}>
                          {opt.displayLabel}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                      <MdKeyboardArrowDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Commitment Term */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">
                    Commitment Term
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTerm.label}
                      onChange={(e) => {
                        const found = TERM_OPTIONS.find((o) => o.label === e.target.value);
                        if (found) setSelectedTerm(found);
                      }}
                      className="w-full bg-[#1c1c1c] border border-white/10 text-white rounded-lg px-4 py-3 text-sm appearance-none cursor-pointer focus:outline-none focus:border-white/25 pr-10"
                    >
                      {TERM_OPTIONS.map((opt) => (
                        <option key={opt.label} value={opt.label}>
                          {opt.years} Year{opt.years > 1 ? "s" : ""} — {opt.savingLabel}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                      <MdKeyboardArrowDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>

              </div>

              {/* ── Divider ── */}
              <div className="border-t border-white/10" />

              {/* ── Optional Add-Ons (static, no checkbox, no price) ── */}
              <div>
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-4">
                  Optional Add-Ons
                </p>
                <div className="flex flex-col gap-3">
                  {ADD_ONS.map((addon) => (
                    <div
                      key={addon.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-[#181818]"
                    >
                      {/* Label + description */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/75">
                          {addon.label}
                        </p>
                        <p className="text-white/35 text-xs mt-0.5 leading-relaxed">
                          {addon.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Order Summary ── */}
              <div className="rounded-xl border border-white/10 bg-[#0d0d0d] overflow-hidden">
                {/* Header row */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                  <span className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">
                    Order Summary
                  </span>
                  <span className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">
                    Billed Annually
                  </span>
                </div>

                {/* Line items */}
                <div className="px-5 pt-4 pb-2 flex flex-col gap-3">
                  {lineItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-white/55 text-sm">{item.label}</span>
                      <span className="text-white/80 text-sm font-medium">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total row */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-white/10 mt-2">
                  <span className="text-white font-bold text-base">Total</span>
                  <span className="text-[#e02020] font-extrabold text-3xl">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

            </div>

            {/* ── Red CTA ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#e02020] px-6 py-5">
              <div>
                <p className="text-white font-bold text-sm sm:text-base">
                  Ready to protect your truth?
                </p>
                <p className="text-white/80 text-xs sm:text-sm mt-0.5">
                  Create your account and set up your vault in minutes.
                </p>
              </div>
              <Link
                href="/register"
                className="shrink-0 bg-white text-[#e02020] font-bold text-xs tracking-widest uppercase px-6 py-3 rounded-lg hover:bg-white/90 transition-all duration-200 whitespace-nowrap"
              >
                CREATE ACCOUNT →
              </Link>
            </div>

            {/* ── Trust Footer ── */}
            <div className="flex flex-wrap items-center justify-center gap-6 px-6 py-4 border-t border-white/8 bg-[#0e0e0e]">
              <span className="flex items-center gap-2 text-white/30 text-xs">
                <span>🔒</span> Military-Grade Encryption
              </span>
              <span className="flex items-center gap-2 text-white/30 text-xs">
                <span>🛡</span> Zero Admin Access
              </span>
              <span className="flex items-center gap-2 text-white/30 text-xs">
                <span>⚡</span> Instant Automated Release
              </span>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;