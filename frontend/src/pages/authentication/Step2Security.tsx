"use client";
// Step 2 — Security
// Updated to white-card aesthetic matching AI version from client review.
// No Zod needed — both addons are fully optional.

import { SecurityAddons } from "./SignupFlow";

const DEFAULT_ADDONS: SecurityAddons = { privateEmail: false, twoFA: false };

// ─── Addon Card ───────────────────────────────────────────────────────────────

interface CardProps {
  icon: string;
  title: string;
  price: string;
  description: React.ReactNode;
  added: boolean;
  onToggle: () => void;
}

function AddonCard({ icon, title, price, description, added, onToggle }: CardProps) {
  return (
    <div
      className={[
        "rounded-[14px] p-6 mb-4 last:mb-0 border transition-all duration-200",
        added
          ? "bg-[rgba(34,197,94,0.06)] border-[rgba(34,197,94,0.35)]"
          : "bg-[#f8f8f8] border-black/10 hover:border-black/20",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-4">
        <span className="text-[#111] font-bold text-sm leading-snug flex items-center gap-2">
          <span className="text-base">{icon}</span>
          {title}
        </span>
        <span className="text-[#e8281e] text-xs font-bold bg-[rgba(232,40,30,0.08)] border border-[rgba(232,40,30,0.30)] rounded-md px-2.5 py-1 shrink-0 font-mono">
          {price}
        </span>
      </div>

      {/* Description */}
      <div className="text-sm text-[#444] leading-relaxed mb-4">{description}</div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={[
          "text-xs font-bold uppercase tracking-[.08em] px-5 py-2 rounded-lg border transition-all duration-200 cursor-pointer",
          added
            ? "bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.35)] text-[#16a34a] hover:bg-[rgba(34,197,94,0.15)]"
            : "bg-white border-black/18 text-[#333] hover:border-[#e8281e] hover:text-[#e8281e] hover:bg-[rgba(232,40,30,0.06)]",
        ].join(" ")}
      >
        {added ? "− Remove" : "+ Add to Plan"}
      </button>

      {added && (
        <span className="ml-3 text-xs text-green-600 font-semibold">✓ Added</span>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  addons?: SecurityAddons;
  onChange: (addons: SecurityAddons) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function Step2Security({ addons = DEFAULT_ADDONS, onChange, onBack, onNext }: Props) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pb-10">
      {/* White card */}
      <div className="bg-white rounded-[22px] overflow-hidden shadow-[0_8px_48px_rgba(0,0,0,0.28),0_1px_4px_rgba(0,0,0,0.10)] border border-black/10">

        {/* Card header */}
        <div className="bg-[#f8f8f8] border-b border-black/8 px-6 sm:px-9 py-7">
          <p className="text-[12px] font-bold tracking-[.2em] uppercase text-[#e8281e] mb-2 font-mono">
            Step 2 of 4
          </p>
          <h2 className="block text-[2rem] md:text-[4rem] lg:text-[2rem] uppercase leading-none tracking-wide text-black mb-2"
            style={{ fontFamily: "var(--font-anton)" }}>
            Harden Your Security
          </h2>
          <p className="text-md text-[#555] leading-relaxed">
            Both of these upgrades are optional but strongly recommended.
          </p>
        </div>

        {/* Card body */}
        <div className="px-6 sm:px-9 py-8">

          <AddonCard 
            icon="🔒"
            title="Private Check-In Email Address"
            price="$39 / year"
            added={addons.privateEmail}
            onToggle={() => onChange({ ...addons, privateEmail: !addons.privateEmail })}
            description={
              <>
                <p className="mb-2">
                  This gives you a dedicated email address assigned exclusively to your account for
                  check-ins and system notifications. Unlike public providers (Gmail, Yahoo, Outlook, AOL),
                  our private email is 100% free from government and NSA surveillance access
                  ensuring your check-in activity leaves no traceable footprint with third parties.
                </p>
              </>
            }
          />

          <AddonCard
            icon="🛡"
            title="Two-Factor Authentication (2FA)"
            price="$39 / year"
            added={addons.twoFA}
            onToggle={() => onChange({ ...addons, twoFA: !addons.twoFA })}
            description={
              <>
                <p className="mb-2">
                  If your check-in password is ever compromised, 2FA adds a critical second barrier
                  between your vault and anyone trying to access it. It generates a unique, time-sensitive
                  code that only appears on your personal device meaning even if someone steals or forces
                  you to divulge your password, they still cannot get in.
                </p>
                <p>
                  To enable 2FA you&apos;ll need a smartphone with an authenticator app installed. Once
                  activated, this extra layer dramatically strengthens your protection.
                </p>
              </>
            }
          />

          {/* Nav */}
          <div className="flex justify-between mt-8">
            <button
              onClick={onBack}
              className="border border-black/18 text-[#555] bg-white hover:border-[#111] hover:text-[#111] font-bold text-sm px-8 py-3 rounded-[10px] uppercase tracking-[.06em] transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={onNext}
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