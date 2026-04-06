"use client";

import { JSX, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface UseCase {
  title: string;
  icon: string; // emoji
}

// ── Data — exact from screenshot ───────────────────────────────────────────
const USE_CASES: UseCase[] = [
  { title: "Journalism & Media", icon: "📰" },
  { title: "Law & Legal Services", icon: "⚖️" },
  { title: "Healthcare & Medicine", icon: "🏥" },
  { title: "Banking & Finance", icon: "🏦" },
  { title: "Government & Politics", icon: "🏛️" },
  { title: "Research & Academia", icon: "🔬" },
  { title: "Human Rights & NGOs", icon: "🌍" },
  { title: "Corporate & Executive", icon: "💼" },
  { title: "Cybersecurity", icon: "🔒" },
  { title: "Environmental Advocacy", icon: "🌱" },
  { title: "Faith & Ministry", icon: "✝️" },
  { title: "Families & Estate Planning", icon: "👨‍👩‍👧‍👦" },
];

// ── Card Component ─────────────────────────────────────────────────────────
const UseCaseCard = ({ useCase }: { useCase: UseCase }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden rounded-xl flex flex-col items-center justify-center text-center gap-4 min-h-[160px] p-6"
      style={{
        backgroundColor: hovered ? "rgba(230, 57, 70, 0.07)" : "#0d1117",

        // Thin red border on all sides on hover
        border: `0.5px solid ${hovered ? "rgba(230,57,70,0.5)" : "rgba(255,255,255,0.10)"}`,

        // Lift + scale spring effect
        transform: hovered
          ? "translateY(-4px) scale(1.03)"
          : "translateY(0px) scale(1)",
        transition: [
          "background-color 0.35s ease",
          "border-color 0.35s ease",
          "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        ].join(", "),

        boxShadow: "none",
      }}
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
        {useCase.icon}
      </div>

      {/* Title */}
      <p className="text-white font-bold text-sm sm:text-base leading-snug whitespace-pre-line">
        {useCase.title}
      </p>
    </div>
  );
};

// ── Main Section ───────────────────────────────────────────────────────────
const UseCasesSection = () => {
  return (
    <section className="w-full py-16 sm:py-20 px-4" style={{ backgroundColor: "#111113" }}>

      {/* ── Section Header ── */}
      <div className="text-center mb-12 sm:mb-16">

        {/* "INDUSTRIES" label with decorative lines */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="h-px w-12" style={{ backgroundColor: "#EF3832" }} />
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#EF3832" }}
          >
            Industries
          </span>
          <div className="h-px w-12" style={{ backgroundColor: "#EF3832" }} />
        </div>

        {/* Main headline */}
        <h2
          className="block text-[2rem] md:text-[4rem] lg:text-[4rem] uppercase leading-none tracking-wide"
          style={{ fontFamily: "var(--font-anton)" }}
        >
          Trusted Across Every Field Where Truth Is At Risk
        </h2>
      </div>

      {/* ── Cards Grid ── */}
      {/* Mobile: 2 col | Tablet: 3 col | Desktop: 6 col */}
      <div className="container mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {USE_CASES.map((useCase) => (
          <UseCaseCard key={useCase.title} useCase={useCase} />
        ))}
      </div>

    </section>
  );
};

export default UseCasesSection;