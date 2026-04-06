"use client";

import WorkCard from "./WorkCard";

// ── Main Section 
const HowItWorkSection = () => {
  return (
    <section
      className="relative w-full flex flex-col items-center justify-center px-4 py-20 sm:py-32 overflow-hidden"
      style={{
        background: `
             radial-gradient(ellipse 60% 70% at 50% 0%, rgba(40, 10, 8, 0.35) 0%, transparent 60%),
             radial-gradient(ellipse 35% 40% at 50% 0%, rgba(60, 5, 5, 0.25) 0%, transparent 30%),
             #0d0d0d
           `,
      }}
    >
      {/* ABOUT label */}
      <div className="relative z-10 flex items-center gap-3 mb-5 sm:mb-7">
        <span className="block w-7 sm:w-10 h-px bg-[#c0392b]" />
        <span
          className="text-[10px] sm:text-[11px] tracking-[0.3em] text-[#c0392b] font-bold uppercase mt-1"
          style={{ fontFamily: "'Arial', sans-serif" }}
        >
          How It Works
        </span>
        <span className="block w-7 sm:w-10 h-px bg-[#c0392b]" />
      </div>

      {/* Main heading */}
      {/* 
           On desktop: "WHAT IS I WAS KILLED" stays on one line, "FOR THIS INFORMATION?" on second.
           On mobile: whitespace-nowrap is removed so text wraps naturally (as seen in Image 2).
         */}
      <div className="block text-[2rem] md:text-[4rem] lg:text-[7rem] uppercase leading-none tracking-wide text-center"
        style={{ fontFamily: "var(--font-anton)" }}>
        <h1 className="mt-4">Six Steps to Protect Your Truth</h1>
      </div>

      {/* Description */}
      <div className="relative z-10 mt-8 sm:mt-10  text-lg max-w-[620px] mx-auto text-center px-2 lg:pb-12">
        <p
          className="text-white/80 leading-relaxed text-xl"
          style={{
            lineHeight: 1.8,
          }}
        >
          From signup to automatic distribution — every step is designed to be seamless, secure, and completely under your control.
        </p>
      </div>
      <WorkCard />
    </section>
  );
};

export default HowItWorkSection;