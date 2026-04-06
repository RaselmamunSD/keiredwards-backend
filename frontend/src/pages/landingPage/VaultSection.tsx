"use client";

import React, { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VaultCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  tags: string[];
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const WillsIcon = () => <span className="text-4xl leading-none">📜</span>;
const BankIcon = () => <span className="text-4xl leading-none">🏛️</span>;
const KeyIcon = () => <span className="text-4xl leading-none">🔑</span>;
const LegalIcon = () => <span className="text-4xl leading-none">⚖️</span>;
const MedicalIcon = () => <span className="text-4xl leading-none">🏥</span>;
const FolderIcon = () => <span className="text-4xl leading-none">📁</span>;

// ─── Card Component ───────────────────────────────────────────────────────────

const VaultCard: React.FC<VaultCardProps> = ({ icon, title, description, tags }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden rounded-2xl p-8 cursor-default"
      style={{
        // Background: subtle red tint on hover
        backgroundColor: hovered ? "rgba(230, 57, 70, 0.07)" : "#1c1c1e",

        // Top border handled by animated bar below
        borderTop: "none",

        // Right / bottom / left: very thin 0.5px, red on hover
        borderRight: `0.5px solid ${hovered ? "rgba(230,57,70,0.5)" : "rgba(255,255,255,0.06)"}`,
        borderBottom: `0.5px solid ${hovered ? "rgba(230,57,70,0.5)" : "rgba(255,255,255,0.06)"}`,
        borderLeft: `0.5px solid ${hovered ? "rgba(230,57,70,0.5)" : "rgba(255,255,255,0.06)"}`,

        // Lift + scale with spring easing
        transform: hovered
          ? "translateY(-5px) scale(1.02)"
          : "translateY(0px) scale(1)",
        transition: [
          "background-color 0.35s ease",
          "border-color 0.35s ease",
          "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        ].join(", "),

        // No shadow at all
        boxShadow: "none",
      }}
    >
      {/* ── Subtle static top-edge baseline (always visible) ── */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 z-10"
        style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }}
      />

      {/* ── Animated red top border: thick (3px), sweeps left → right ── */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 z-20"
        style={{
          height: "3px",
          width: hovered ? "100%" : "0%",
          backgroundColor: "#e63946",
          transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          borderRadius: "16px 16px 0 0",
        }}
      />

      {/* ── Card Content ── */}
      <div className="relative z-30">

        {/* Icon */}
        <div className="mb-5">{icon}</div>

        {/* Title */}
        <h3 className="text-white font-bold text-lg leading-snug tracking-wide mb-3">
          {title}
        </h3>

        {/* Description */}
        <p
          className="text-lg mb-6"
          style={{ color: "rgba(255,255,255,0.55)", lineHeight: "1.75" }}
        >
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-lg whitespace-nowrap rounded-full px-3 py-1"
              style={{
                border: "1px solid rgba(255,255,255,0.14)",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
};

// ─── Card Data ────────────────────────────────────────────────────────────────

const cards: VaultCardProps[] = [
  {
    icon: <WillsIcon />,
    title: "Wills & Estate Documents",
    description:
      "Store your last will and testament, power of attorney, living wills, and beneficiary instructions. Ensure the right people receive the right documents the moment you can no longer deliver them yourself — with no lawyer required to trigger release.",
    tags: ["Last Will & Testament", "Living Will", "Power of Attorney", "Beneficiary Lists", "Trust Documents"],
  },
  {
    icon: <BankIcon />,
    title: "Bank Accounts & Financial Records",
    description:
      "Leave secure instructions for accessing your bank accounts, investment portfolios, retirement funds, and cryptocurrency wallets. Your loved ones won't be left locked out of assets or drowning in red tape during an already devastating time.",
    tags: ["Bank Account Details", "Investment Portfolios", "Crypto Wallets", "Retirement Accounts", "Insurance Policies"],
  },
  {
    icon: <KeyIcon />,
    title: "Passwords & Digital Access",
    description:
      "Securely store your master password list, password manager credentials, 2FA backup codes, email logins, and subscription accounts. Don't leave your family locked out of your digital life — or leave sensitive accounts exposed to bad actors.",
    tags: ["Password Lists", "2FA Backup Codes", "Email & Social Logins", "Subscription Accounts", "Device PINs"],
  },
  {
    icon: <LegalIcon />,
    title: "Legal Evidence & Testimony",
    description:
      "Store recorded testimonies, contracts, signed agreements, or evidence of wrongdoing. If something happens to you, your documentation reaches lawyers, journalists, or law enforcement automatically — ensuring the truth is never buried with you.",
    tags: ["Recorded Testimony", "Contracts & Agreements", "Evidence Files", "Correspondence", "Police Reports"],
  },
  {
    icon: <MedicalIcon />,
    title: "Medical & Healthcare Directives",
    description:
      "Store advance directives, DNR orders, organ donation wishes, and medical history. Give your family and medical team the clarity they need to honor your wishes, even in situations where you can't speak for yourself.",
    tags: ["Advance Directives", "DNR Orders", "Organ Donation", "Medical History", "Prescription Records"],
  },
  {
    icon: <FolderIcon />,
    title: "Classified & Sensitive Information",
    description:
      "For journalists, investigators, whistleblowers, and activists — store your most sensitive research, source identities, unpublished reports, or exposés. A missed check-in triggers automatic release to editors, publishers, or the press at scale.",
    tags: ["Unpublished Reports", "Source Identities", "Research Files", "Exposés", "Surveillance Evidence"],
  },
];

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC = () => (
  <header className="text-center mb-16 px-4">

    {/* "YOUR VAULT" label with decorative lines */}
    <div className="flex items-center justify-center gap-3 mb-5">
      <div className="h-px w-12" style={{ backgroundColor: "#e63946" }} />
      <span
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "#e63946" }}
      >
        Your Vault
      </span>
      <div className="h-px w-12" style={{ backgroundColor: "#e63946" }} />
    </div>

    <h2 className="uppercase m-0">
      <span
        className="block text-[2rem] md:text-[4rem] lg:text-[5rem] uppercase leading-none tracking-tight"
        style={{ fontFamily: "var(--font-anton)" }}
      >
        Everything That Matters.
      </span>
      <span
        className="block text-[2rem] md:text-[4rem] lg:text-[5rem] uppercase leading-none tracking-tight text-[#EF3832]"
        style={{ fontFamily: "var(--font-anton)" }}
      >
        Protected Until It Needs To Be Seen.
      </span>
    </h2>

    {/* Sub-copy */}
    <p
      className="mt-6 mx-auto text-xl text-gray-300">
      Your encrypted vault holds more than files. It holds your life&apos;s
      most critical <br /> instructions, secrets, and evidence — released
      automatically only when you can <br /> no longer speak for yourself.
    </p>
  </header>
);

// ─── VaultSection (Main Export) ───────────────────────────────────────────────

export default function VaultSection() {
  return (
    <section
      className="min-h-screen w-full py-20 px-6"
      style={{ backgroundColor: "#111113" }}
    >
      <div className="container mx-auto">

        {/* Header */}
        <SectionHeader />

        {/* Card Grid — 1 col mobile | 2 col tablet | 3 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <VaultCard key={card.title} {...card} />
          ))}
        </div>

      </div>
    </section>
  );
}