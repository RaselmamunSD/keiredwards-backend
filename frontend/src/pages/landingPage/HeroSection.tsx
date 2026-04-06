"use client";

import Link from "next/link";

const STATS = [
  { value: "256", accent: "-BIT", label: "MILITARY ENCRYPTION" },
  { value: "5", accent: "GB", label: "INCLUDED STORAGE" },
  { value: "10", accent: "", label: "TRUSTED RECIPIENTS" },
  { value: "NO", accent: "", label: "administrator can access" },
];

const AUDIENCE_TAGS = [
  "Journalists", "Whistleblowers", "Activists", "Investigators",
  "Lawyers", "Private Detectives", "Business Owners", "Practices & Nurses",
  "Financial Advisors", "Political Dissidents", "Researchers",
  "Human Rights Workers", "Parents & Guardians", "Estate Planners",
  "Clergy & Counselors", "Security Professionals", "Executives", "Social Workers",
];

const HeroSection = () => {
  return (
    <section className="w-full flex flex-col items-center bg-[#0a0a0a]">

      {/* ── Hero Content ── */}
      <div className="relative w-full flex flex-col items-center text-center px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">

        {/* Background radial glow blob behind headline */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[700px] h-[400px] rounded-full bg-[#EF3832]/10 blur-[120px]" />
        </div>

        {/* Eyebrow */}
        <div className="relative z-10 flex items-center gap-3 mb-8">
          <span className="block w-10 h-px bg-[#EF3832]/60" />
          <p className="font-bebas font-normal text-[10px] sm:text-xs tracking-[0.28em] text-[#EF3832] uppercase">
            Secure Automated Disclosure Platform
          </p>
          <span className="block w-10 h-px bg-[#EF3832]/60" />
        </div>

        {/* Headline — white with warm glow */}
        <h1
          className="relative z-10 font-bebas font-extrabold uppercase leading-[0.92] tracking-wide text-white mb-1
            text-[clamp(3.5rem,11vw,8rem)]
            [text-shadow:0_0_80px_rgba(255,255,255,0.2),0_0_160px_rgba(255,255,255,0.08)]"
        >
          Truth Survives
        </h1>

        {/* Subheadline — red italic with red glow */}
        <h2
          className="relative z-10 font-bebas font-extrabold italic uppercase leading-[0.92] tracking-wide text-[#EF3832]
            text-[clamp(3rem,10.5vw,7.5rem)]
            [text-shadow:0_0_60px_rgba(239,56,50,0.6),0_0_120px_rgba(239,56,50,0.3),0_0_200px_rgba(239,56,50,0.15)]
            mb-10 sm:mb-12"
        >
          Even If You Don't
        </h2>

        {/* Subtext */}
        <p className="relative z-10 max-w-lg text-gray-400 text-base sm:text-lg leading-relaxed mb-10 sm:mb-12">
          This is more than storage. It's a{" "}
          <strong className="text-white font-semibold">safeguard</strong>. A contingency
          plan. A promise that your information cannot be silenced, erased, or buried.
        </p>

        {/* CTA Button with red glow on hover */}
        <Link
          href="/register"
          className="relative z-10 inline-flex items-center justify-center rounded-sm
            bg-[#EF3832] text-white text-xs sm:text-sm font-bold tracking-[0.18em] uppercase
            px-8 sm:px-10 py-4 mb-6
            transition-all duration-300
            hover:bg-[#f04040] hover:scale-[1.02]
            hover:shadow-[0_0_20px_6px_rgba(239,56,50,0.5),0_0_60px_14px_rgba(239,56,50,0.25),0_0_100px_24px_rgba(239,56,50,0.10)]
            active:scale-[0.98]"
        >
          Protect the Truth — Get Started Today
        </Link>

        {/* Trust Badges */}
        <p className="relative z-10 text-gray-500 text-xs tracking-[0.12em] font-medium">
          🔒 256-bit encryption · Zero admin access 
        </p>
      </div>

      {/* ── Stats Bar ── */}
      <div className="w-full border-t border-b border-white/[0.07] py-10 sm:py-12 bg-[#0d0d0d]">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-y-10 gap-x-4 text-center">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2">
              <p className="font-bebas font-normal text-[2.6rem] sm:text-[3.2rem] text-white leading-none [text-shadow:0_0_30px_rgba(255,255,255,0.12)]">
                {stat.value}
                {stat.accent && (
                  <span className="text-[#EF3832]">{stat.accent}</span>
                )}
              </p>
              <p className="text-[10px] sm:text-xs tracking-[0.2em] text-gray-500 uppercase font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Audience Tags ── */}
      <div className="w-full border-b border-white/[0.07] py-10 sm:py-14 px-4 bg-[#0a0a0a]">
        <p className="text-center text-[10px] sm:text-xs tracking-[0.28em] text-gray-500 uppercase font-medium mb-8">
          Designed for those who can't afford silence
        </p>
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-2 sm:gap-2.5">
          {AUDIENCE_TAGS.map((tag) => (
            <span
              key={tag}
              className="border border-white/[0.12] text-gray-400 text-xs px-3 sm:px-4 py-1.5 cursor-default
                transition-all duration-200
                hover:border-[#EF3832] hover:text-white hover:bg-[#EF3832]/[0.06]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

    </section>
  );
};

export default HeroSection;