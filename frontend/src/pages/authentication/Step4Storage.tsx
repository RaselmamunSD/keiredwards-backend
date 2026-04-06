"use client";
// Step 4 — Storage & Payment
// Pricing logic:
// 1. Check-In service: flat price lookup table (service × term) — discount already baked in
// 2. Extra storage: tiered — $15/GB (1–10 GB), $10/GB (11–49 GB), $5/GB (50+ GB) × term years
//    ↳ DISCOUNT APPLIED: 2yr = 5% off, 3yr = 10% off on storage total
// 3. Press release: one-time flat fee — 250 outlets=$250, 500=$495, 1,000=$695
// 4. Security add-ons (2FA, Private Email): $39/year × term years
//    ↳ DISCOUNT APPLIED: 2yr = 5% off, 3yr = 10% off on add-on total
// 5. Invoice only renders rows for items the user has actually selected (zero rows hidden)

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { SecurityAddons, Step3Data, Step4Data } from "./SignupFlow";

// ─── Zod schema ───────────────────────────────────────────────────────────────

const step4Schema = z.object({
  extraStorageGB: z.number().min(0),
  checkInService: z.string().min(1, "Please select a Check-In Service."),
  checkInTerm: z.string().min(1, "Please select a term."),
});
type Step4Errors = Partial<Record<keyof Step4Data, string>>;

// ─── Default fallbacks ────────────────────────────────────────────────────────

const DEFAULT_STEP4: Step4Data = { extraStorageGB: 0, checkInService: "", checkInTerm: "" };
const DEFAULT_ADDONS: SecurityAddons = { privateEmail: false, twoFA: false };
const DEFAULT_STEP3: Step3Data = {
  sendToRecipients: true,
  pressRelease250: false,
  pressRelease500: false,
  pressRelease1000: false,
  pressCategory: "",
};

// ─── Service options ──────────────────────────────────────────────────────────
// Each service has a unique string key used as the <select> value.
// Prices are flat totals per term (not monthly rates) — direct lookup table.
// Discounts for 2yr/3yr are already baked into the lookup table values.

const SERVICE_OPTIONS = [
  { value: "daily", label: "Check-In — Daily" },
  { value: "weekly", label: "Check-In — Weekly" },
  { value: "monthly", label: "Check-In — Monthly" },
  { value: "quarterly", label: "Check-In — Quarterly" },
  { value: "yearly", label: "Check-In — Yearly" },
];

const SERVICE_DISPLAY_LABELS: Record<string, string> = {
  daily: "Check-In Daily",
  weekly: "Check-In Weekly",
  monthly: "Check-In Monthly",
  quarterly: "Check-In Quarterly",
  yearly: "Check-In Per Year",
};

//  Lookup table: SERVICE_TERM_PRICES[service][termYears] = flat total price
//  Discounts for multi-year terms are already reflected in these values.
//
//  Service      | 1 yr  | 2 yrs  | 3 yrs
//  -------------|-------|--------|-------
//  Daily        |  $995 | $1,799 | $2,399
//  Weekly       |  $595 |   $995 | $1,299
//  Monthly      |  $329 |   $595 |   $759
//  Quarterly    |  $259 |   $399 |   $595
//  Per Year     |   $99 |   $149 |   $179

const SERVICE_TERM_PRICES: Record<string, Record<string, number>> = {
  daily:     { "1": 995,  "2": 1799, "3": 2399 },
  weekly:    { "1": 595,  "2": 995,  "3": 1299 },
  monthly:   { "1": 329,  "2": 595,  "3": 759  },
  quarterly: { "1": 259,  "2": 399,  "3": 595  },
  yearly:    { "1": 99,   "2": 149,  "3": 179  },
};

// ─── Tiered storage calculator ────────────────────────────────────────────────
// $15/GB for GB 1–10, $10/GB for GB 11–49, $5/GB for GB 50+
// Returns the ANNUAL cost (before any multi-year discount) for the given GB.

function calcStorageCostPerYear(gb: number): number {
  if (gb <= 0) return 0;
  let cost = 0;
  // Tier 1: 1–10 GB → $15/GB
  const t1 = Math.min(gb, 10);
  cost += t1 * 15;
  // Tier 2: 11–49 GB → $10/GB
  if (gb > 10) {
    const t2 = Math.min(gb - 10, 39);
    cost += t2 * 10;
  }
  // Tier 3: 50+ GB → $5/GB
  if (gb > 49) {
    const t3 = gb - 49;
    cost += t3 * 5;
  }
  return cost;
}

// ─── Tiered storage breakdown (for invoice label) ─────────────────────────────
// Returns a human-readable breakdown string, e.g. "10GB×$15 + 5GB×$10"

function storageBreakdownLabel(gb: number): string {
  if (gb <= 0) return "";
  const parts: string[] = [];
  const t1 = Math.min(gb, 10);
  if (t1 > 0) parts.push(`${t1}GB×$15`);
  if (gb > 10) {
    const t2 = Math.min(gb - 10, 39);
    if (t2 > 0) parts.push(`${t2}GB×$10`);
  }
  if (gb > 49) {
    const t3 = gb - 49;
    if (t3 > 0) parts.push(`${t3}GB×$5`);
  }
  return parts.join(" + ");
}

// ─── Full pricing calculator ──────────────────────────────────────────────────

interface PricingBreakdown {
  serviceLabel: string;
  serviceCost: number;
  storageCostPerYear: number;
  storageRawTotal: number;       // before discount
  storageTotalCost: number;      // after discount
  storageDiscountAmt: number;    // discount dollars saved
  pressCost: number;
  twoFACost: number;
  privateEmailCost: number;
  total: number;
  termYears: number;
  discountPct: number;           // 0 | 5 | 10
}

function computePricing(
  step4: Step4Data,
  addons: SecurityAddons,
  step3: Step3Data
): PricingBreakdown {
  const termYears = parseInt(step4.checkInTerm) || 0;

  // Discount percentage for storage and add-ons
  // (Check-In service discounts are already baked into SERVICE_TERM_PRICES)
  const discountPct = termYears === 2 ? 5 : termYears === 3 ? 10 : 0;
  const discountMultiplier = 1 - discountPct / 100;

  // ── Check-In Service ──────────────────────────────────────────────────────
  // Direct flat-price lookup — discount already included in table values
  const serviceCost =
    step4.checkInService && step4.checkInTerm
      ? SERVICE_TERM_PRICES[step4.checkInService]?.[step4.checkInTerm] ?? 0
      : 0;

  const termLabel = termYears > 0 ? `${termYears} Year${termYears > 1 ? "s" : ""}` : "";
  const serviceLabel =
    step4.checkInService && termYears > 0
      ? `${SERVICE_DISPLAY_LABELS[step4.checkInService]} | ${termLabel}`
      : "";

  // ── Storage ───────────────────────────────────────────────────────────────
  // Annual cost × term years, then apply multi-year discount
  const storageCostPerYear = calcStorageCostPerYear(step4.extraStorageGB);
  const effectiveYears = Math.max(termYears, 1);
  const storageRawTotal = storageCostPerYear * effectiveYears;
  const storageTotalCost =
    step4.extraStorageGB > 0
      ? parseFloat((storageRawTotal * discountMultiplier).toFixed(2))
      : 0;
  const storageDiscountAmt = parseFloat((storageRawTotal - storageTotalCost).toFixed(2));

  // ── Press Release ─────────────────────────────────────────────────────────
  // One-time flat fee — no term multiplier, no discount
  const pressCost =
    (step3.pressRelease250  ? 250 : 0) +
    (step3.pressRelease500  ? 495 : 0) +
    (step3.pressRelease1000 ? 695 : 0);

  // ── Security Add-ons ──────────────────────────────────────────────────────
  // $39/year × term years, then apply multi-year discount (same as storage)
  // NOTE: If client wants add-ons at flat $39/yr with NO discount, remove
  // the discountMultiplier here and just use: 39 * effectiveYears
  const twoFARaw       = addons.twoFA          ? 39 * effectiveYears : 0;
  const privateEmailRaw = addons.privateEmail   ? 39 * effectiveYears : 0;
  const twoFACost       = parseFloat((twoFARaw       * discountMultiplier).toFixed(2));
  const privateEmailCost = parseFloat((privateEmailRaw * discountMultiplier).toFixed(2));

  // ── Grand Total ───────────────────────────────────────────────────────────
  const total = parseFloat(
    (serviceCost + storageTotalCost + pressCost + twoFACost + privateEmailCost).toFixed(2)
  );

  return {
    serviceLabel,
    serviceCost,
    storageCostPerYear,
    storageRawTotal,
    storageTotalCost,
    storageDiscountAmt,
    pressCost,
    twoFACost,
    privateEmailCost,
    total,
    termYears,
    discountPct,
  };
}

// ─── SelectField ──────────────────────────────────────────────────────────────

interface SelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  error?: string;
}

function SelectField({ label, value, onChange, options, placeholder, error }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-[.12em] text-[#444]">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={[
            "w-full bg-[#f9f9f9] rounded-[10px] px-4 py-3 pr-10 text-sm outline-none transition-all border appearance-none cursor-pointer",
            error
              ? "border-[#e8281e] text-[#111] focus:shadow-[0_0_0_3px_rgba(232,40,30,0.12)]"
              : "border-black/15 text-[#444] focus:border-[#e8281e] focus:shadow-[0_0_0_3px_rgba(232,40,30,0.12)] focus:bg-white",
          ].join(" ")}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] pointer-events-none text-xs">▼</span>
      </div>
      {error && <p className="text-[#e8281e] text-xs mt-0.5">{error}</p>}
    </div>
  );
}

// ─── Tiered storage hint ──────────────────────────────────────────────────────

function StorageTiers({ gb, termYears, discountPct }: { gb: number; termYears: number; discountPct: number }) {
  const perYear = calcStorageCostPerYear(gb);
  const effectiveYears = Math.max(termYears, 1);
  const rawTotal = perYear * effectiveYears;
  const discountMultiplier = 1 - discountPct / 100;
  const discountedTotal = parseFloat((rawTotal * discountMultiplier).toFixed(2));
  const saved = parseFloat((rawTotal - discountedTotal).toFixed(2));

  return (
    <div className="bg-[#f8f8f8] border border-black/8 rounded-xl px-4 py-3 mb-6 text-xs text-[#555] leading-relaxed">
      {/* <p className="font-bold text-[#333] mb-1.5 text-sm">Tiered Pricing — Additional Storage</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-1.5">
        <span className={gb >= 1 && gb <= 10 ? "text-[#e8281e] font-bold" : ""}>1–10 GB: $15/GB/yr</span>
        <span className={gb > 10 && gb <= 49  ? "text-[#e8281e] font-bold" : ""}>11–49 GB: $10/GB/yr</span>
        <span className={gb >= 50             ? "text-[#e8281e] font-bold" : ""}>50+ GB: $5/GB/yr</span>
      </div> */}
      {gb > 0 && (
        <>
          <p className="text-[#333] font-medium">
            {gb} GB ={" "}
            <span className="text-[#e8281e]">${perYear.toFixed(0)}/yr</span>
            {effectiveYears > 1 && (
              <span className="text-[#777]">
                {" "}× {effectiveYears} yrs ={" "}
                <span className="text-[#777] line-through">${rawTotal.toFixed(0)}</span>
              </span>
            )}
            {discountPct > 0 && (
              <span className="text-[#e8281e] font-bold">
                {" "}→ ${discountedTotal.toFixed(0)} after {discountPct}% off
              </span>
            )}
          </p>
          {discountPct > 0 && saved > 0 && (
            <p className="text-green-600 font-medium mt-0.5">You save ${saved.toFixed(0)} on storage</p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  data?: Step4Data;
  onChange: (data: Step4Data) => void;
  addons?: SecurityAddons;
  step3?: Step3Data;
  onBack: () => void;
}

export default function Step4Storage({
  data = DEFAULT_STEP4,
  onChange,
  addons = DEFAULT_ADDONS,
  step3 = DEFAULT_STEP3,
  onBack,
}: Props) {
  const [errors, setErrors] = useState<Step4Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const set = <K extends keyof Step4Data>(field: K, value: Step4Data[K]) => {
    const updated = { ...data, [field]: value };
    onChange(updated);
    if (submitted) {
      const result = step4Schema.safeParse(updated);
      if (!result.success) {
        const flat = result.error.flatten().fieldErrors;
        setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0]])));
      } else {
        setErrors({});
      }
    }
  };

  const handlePayNow = () => {
    setSubmitted(true);
    const result = step4Schema.safeParse(data);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0]])));
      return;
    }
    setErrors({});
    router.push("/payment");
  };

  const p = computePricing(data, addons, step3);

  // ── Invoice rows — only include items that cost > 0 ───────────────────────
  const invoiceRows: { label: string; value: string; sub?: string }[] = [];

  if (p.serviceCost > 0) {
    invoiceRows.push({
      label: p.serviceLabel,
      // value: `$${p.serviceCost.toLocaleString()}`,
      value: `$${p.serviceCost.toFixed(2)}`,
    });
  }

  if (p.storageTotalCost > 0) {
    const breakdown = storageBreakdownLabel(data.extraStorageGB);
    const effectiveYears = Math.max(p.termYears, 1);
    // Show tiered breakdown + discount info in sub-label
    const sub =
      p.discountPct > 0
        ? `${breakdown} × ${effectiveYears} yr — ${p.discountPct}% off (save $${p.storageDiscountAmt.toFixed(0)})`
        : `${breakdown} × ${effectiveYears} yr`;
    invoiceRows.push({
      label: `Additional Storage (${data.extraStorageGB} GB)`,
      value: `$${p.storageTotalCost.toFixed(2)}`, 
      sub,
    });
  }

  if (p.pressCost > 0) {
    const pressLabel =
      step3.pressRelease1000 ? "Press Release (1,000 outlets)" :
      step3.pressRelease500  ? "Press Release (500 outlets)"   :
      step3.pressRelease250  ? "Press Release (250 outlets)"   : "Press Release";
    // invoiceRows.push({ label: pressLabel, value: `$${p.pressCost.toLocaleString()}` });
    invoiceRows.push({ label: pressLabel, value: `$${p.pressCost.toFixed(2)}` });
  }

  if (p.twoFACost > 0) {
    const effectiveYears = Math.max(p.termYears, 1);
    const sub =
      p.discountPct > 0
        ? `$39/yr × ${effectiveYears} yr — ${p.discountPct}% off`
        : `$39/yr × ${effectiveYears} yr`;
    invoiceRows.push({
      label: `Two-Factor Auth (2FA)`,
      value: `$${p.twoFACost.toFixed(2)}`,
      sub,
    });
  }

  if (p.privateEmailCost > 0) {
    const effectiveYears = Math.max(p.termYears, 1);
    const sub =
      p.discountPct > 0
        ? `$39/yr × ${effectiveYears} yr — ${p.discountPct}% off`
        : `$39/yr × ${effectiveYears} yr`;
    invoiceRows.push({
      label: `Private Email`,
      value: `$${p.privateEmailCost.toFixed(2)}`,
      sub,
    });
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pb-10">
      {/* White card */}
      <div className="bg-white rounded-[22px] overflow-hidden shadow-[0_8px_48px_rgba(0,0,0,0.28),0_1px_4px_rgba(0,0,0,0.10)] border border-black/10">

        {/* Card header */}
        <div className="bg-[#f8f8f8] border-b border-black/8 px-6 sm:px-9 py-7">
          <p className="text-[12px] font-bold tracking-[.2em] uppercase text-[#e8281e] mb-2 font-mono">
            Step 4 of 4
          </p>
          <h2
            className="block text-[2rem] md:text-[4rem] lg:text-[2rem] uppercase leading-none tracking-wide text-black mb-2"
            style={{ fontFamily: "var(--font-anton)" }}
          >
            Storage &amp; Payment
          </h2>
          <p className="text-sm text-[#555] leading-relaxed">
            5GB of encrypted storage is included with every plan. Add extra storage now or at any
            time from your dashboard.
          </p>
        </div>

        {/* Card body */}
        <div className="px-6 sm:px-9 py-8">

          {/* Storage info */}
          <div className="bg-[#f8f8f8] border border-black/8 rounded-[12px] p-5 mb-6">
            <p className="text-sm font-bold text-[#111] mb-2">📦 What Does 5GB Hold?</p>
            <p className="text-xs text-[#444] leading-relaxed mb-3">
              5GB is generous for most users, but here&apos;s a reference to help you plan: roughly
              800–1,500 photos at 3MB each • ~100,000 average text document pages in PDF • ~1.5 hrs
              of 720p video (mp4) or ~45 mins of 1080p • ~15 mins of 4K footage. If you need more,
              add extra storage below at $15/GB/yr.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["1,500", "Photos (3MB ea.)"],
                ["100k",  "PDF Pages"],
                ["1.5 hrs", "720p Video"],
              ].map(([num, lbl]) => (
                <div key={lbl} className="bg-white border border-black/8 rounded-lg px-3 py-2.5 text-center">
                  <p className="font-black text-xl text-[#111] leading-none">{num}</p>
                  <p className="text-[10px] text-[#666] mt-1">{lbl}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tiered storage hint — now visible so users understand the pricing */}
          {/* <StorageTiers
            gb={data.extraStorageGB}
            termYears={parseInt(data.checkInTerm) || 1}
            discountPct={p.discountPct}
          /> */}

          {/* Storage counter */}
          <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#444] mb-3">
            Add Extra Storage — $15 / 1GB / Year
          </p>
          <div className="flex items-center gap-3 mb-7">
            <button
              onClick={() => set("extraStorageGB", Math.max(0, data.extraStorageGB - 1))}
              aria-label="Decrease storage"
              className="w-10 h-10 rounded-[10px] border border-black/15 bg-[#f9f9f9] text-[#111] text-xl font-light flex items-center justify-center hover:border-[#e8281e] hover:bg-[rgba(232,40,30,0.06)] transition-all cursor-pointer select-none"
            >
              −
            </button>
            <div className="font-mono font-bold text-xl text-[#e8281e] min-w-[80px] text-center tabular-nums">
              {data.extraStorageGB} GB
            </div>
            <button
              onClick={() => set("extraStorageGB", data.extraStorageGB + 1)}
              aria-label="Increase storage"
              className="w-10 h-10 rounded-[10px] border border-black/15 bg-[#f9f9f9] text-[#111] text-xl font-light flex items-center justify-center hover:border-[#e8281e] hover:bg-[rgba(232,40,30,0.06)] transition-all cursor-pointer select-none"
            >
              +
            </button>
          </div>

          <div className="h-px bg-black/8 mb-6" />

          {/* Service dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <SelectField
              label="Check-In Service"
              value={data.checkInService}
              onChange={(v) => set("checkInService", v)}
              placeholder="Select service…"
              options={SERVICE_OPTIONS}
              error={errors.checkInService}
            />
            <SelectField
              label="Term"
              value={data.checkInTerm}
              onChange={(v) => set("checkInTerm", v)}
              placeholder="Select term…"
              options={[
                { value: "1", label: "1 Year" },
                { value: "2", label: "2 Years (5% off)" },
                { value: "3", label: "3 Years (10% off)" },
              ]}
              error={errors.checkInTerm}
            />
          </div>

          <div className="h-px bg-black/8 mb-6" />

          {/* Invoice */}
          <div className="bg-[#f8f8f8] border border-black/10 rounded-[14px] overflow-hidden mb-6">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-3 border-b border-black/8">
              <span className="text-[11px] font-bold uppercase tracking-[.12em] text-[#888]">Order Summary</span>
              <span className="text-[11px] text-[#aaa]">Billed at checkout</span>
            </div>

            {/* Rows — only show items with value */}
            {invoiceRows.length === 0 ? (
              <div className="px-5 py-5 text-sm text-[#aaa] text-center italic">
                Select a service and term to see your total.
              </div>
            ) : (
              invoiceRows.map((row, i) => (
                <div key={i} className="flex justify-between items-start px-5 py-3 border-b border-black/5">
                  <div className="pr-4">
                    <span className="text-sm text-[#555] leading-snug block">{row.label}</span>
                    {row.sub && (
                      <span className="text-[11px] text-[#999] leading-snug block mt-0.5">{row.sub}</span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-[#111] font-mono shrink-0">{row.value}</span>
                </div>
              ))
            )}

            {/* Total */}
            <div className="flex justify-between items-center px-5 py-4 bg-[rgba(232,40,30,0.06)] border-t border-[rgba(232,40,30,0.25)]">
              <span className="text-sm font-bold text-[#111]">Total</span>
              <span
                className="font-black tracking-[.04em] text-[#e8281e]"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem" }}
              >
                {p.total > 0 ? `$${p.total.toFixed(2)}` : "$—"}
              </span>
            </div>
          </div>

          {/* Nav */}
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              className="border border-black/18 text-[#555] bg-white hover:border-[#111] hover:text-[#111] font-bold text-sm px-8 py-3 rounded-[10px] uppercase tracking-[.06em] transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={handlePayNow}
              className="bg-green-500 hover:bg-green-400 text-white font-bold text-sm px-8 py-3.5 rounded-[10px] uppercase tracking-[.06em] transition-all shadow-[0_4px_20px_rgba(34,197,94,.25)] hover:shadow-[0_10px_32px_rgba(34,197,94,.4)] hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
            >
              🔒 Pay Now &amp; Create Vault
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}