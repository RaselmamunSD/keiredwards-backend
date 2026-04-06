"use client";

import React, { useState } from "react";

interface TermsSection {
  id: string;
  title: string;
  content: string;
  bullets?: string[];
}

const termsSections: TermsSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    content:
      "Welcome to our platform. By accessing or using our services, you agree to be bound by these Terms of Service. Please read them carefully before using any part of our platform. If you do not agree to these terms, you may not access or use our services.",
  },
  {
    id: "user-accounts",
    title: "User Accounts",
    content:
      "To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your credential and for all activity that occurs under your account.",
    bullets: [
      "You must provide accurate and complete information when registering.",
      "You are solely responsible for any activity on your account.",
      "Notify us immediately of any unauthorized access or security breach.",
      "We reserve the right to suspend or terminate accounts that violate these terms.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    content:
      "You agree to use our services only for lawful purposes and in accordance with these Terms. You must not use our platform in any way that could damage, disable, or impair the service.",
    bullets: [
      "Do not use the platform for any unlawful or fraudulent activities.",
      "Do not attempt to gain unauthorized access to any part of the service.",
      "Do not transmit harmful, offensive, or malicious content.",
      "Do not scrape, crawl, or data-mine the platform without written consent.",
    ],
  },
  {
    id: "payments",
    title: "Payments & Subscriptions",
    content:
      "Certain features are available through paid subscription plans. All fees are non-refundable unless otherwise stated. By subscribing, you authorize us to charge your payment method on a recurring basis.",
    bullets: [
      "Subscription plans auto-renew unless cancelled before the renewal date.",
      "Pricing may change with 30 days' notice to active subscribers.",
      "You may cancel your subscription at any time through your account settings.",
      "Refunds are issued at our sole discretion in accordance with our Refund Policy.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    content:
      "All content, features, and functionality of the platform — including software, text, graphics, and logos — are owned by us and are protected by applicable intellectual property laws. You are granted a limited, non-exclusive license to use the service for personal or business purposes.",
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    content:
      "To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service. Our total liability in any matter related to these terms shall not exceed the amount you paid us in the 12 months preceding the claim.",
  },
  {
    id: "termination",
    title: "Termination",
    content:
      "We reserve the right to suspend or terminate your access to the service at any time, with or without cause, and with or without notice. Upon termination, your right to use the service will immediately cease. Provisions of these Terms that by their nature should survive termination shall survive.",
  },
  {
    id: "changes",
    title: "Changes to Terms",
    content:
      "We may update these Terms from time to time. When we make changes, we will revise the 'Last Updated' date at the top of this page and notify you via email or an in-app notification. Continued use of the service after changes take effect constitutes your acceptance of the revised Terms.",
  },
  {
    id: "contact",
    title: "Contact Information",
    content:
      "If you have questions, concerns, or feedback regarding these Terms of Service, please reach out to our legal team. We aim to respond to all inquiries within 2 business days.",
  },
];

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500&display=swap');

        .terms-body { font-family: 'DM Sans', sans-serif; }
        .terms-display { font-family: 'Playfair Display', Georgia, serif; }
        .terms-mono { font-family: 'DM Mono', monospace; }

        .section-row {
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background 0.2s ease;
          cursor: default;
        }
        .section-row:hover {
          background: rgba(239,56,50,0.03);
        }
        .section-row.active {
          background: rgba(239,56,50,0.05);
        }

        .sidebar-link {
          transition: color 0.15s ease, padding-left 0.15s ease;
          color: rgba(255,255,255,0.3);
          font-size: 0.72rem;
          letter-spacing: 0.04em;
          display: block;
          padding: 5px 0;
          cursor: pointer;
          text-decoration: none;
        }
        .sidebar-link:hover { color: rgba(255,255,255,0.7); padding-left: 4px; }
        .sidebar-link.active { color: #EF3832; padding-left: 4px; }

        .red-rule {
          width: 32px;
          height: 2px;
          background: #EF3832;
          display: inline-block;
        }

        .number-stamp {
          font-family: 'Playfair Display', serif;
          font-size: 4.5rem;
          font-weight: 700;
          line-height: 1;
          color: rgba(255,255,255,0.04);
          position: absolute;
          top: -8px;
          right: 0;
          pointer-events: none;
          user-select: none;
          letter-spacing: -0.04em;
        }

        .bullet-item::before {
          content: '';
          display: inline-block;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #EF3832;
          margin-right: 12px;
          flex-shrink: 0;
          margin-top: 9px;
        }

        /* Fade-in animation */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up {
          animation: fadeUp 0.5s ease both;
        }
      `}</style>

      {/* ── Top accent bar ── */}
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #EF3832 40%, #EF3832 60%, transparent)" }} />

      <div className="terms-body max-w-[1100px] mx-auto px-6 lg:px-12 py-16 lg:py-24 lg:flex lg:gap-16">

        {/* ── Sidebar (desktop only) ── */}
        <aside className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-16">
            <p className="terms-mono text-[10px] tracking-[0.25em] uppercase text-[#EF3832] mb-5">Contents</p>
            <nav>
              {termsSections.map((s, i) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`sidebar-link ${activeSection === s.id ? "active" : ""}`}
                  onClick={() => setActiveSection(s.id)}
                >
                  <span className="terms-mono text-[10px] text-white/20 mr-2">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.title}
                </a>
              ))}
            </nav>

            {/* Last updated */}
            <div className="mt-10 pt-6 border-t border-white/[0.07]">
              <p className="terms-mono text-[10px] tracking-[0.2em] uppercase text-white/20 mb-1">Last Updated</p>
              <p className="terms-mono text-[11px] text-white/40">March 10, 2026</p>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">

          {/* Header */}
          <header className="mb-14 fade-up">
            <div className="flex items-center gap-3 mb-6">
              <span className="red-rule" />
              <span className="terms-mono text-[10px] tracking-[0.28em] uppercase text-[#EF3832]">Legal Document</span>
            </div>

            <h1 className="terms-display text-5xl sm:text-6xl font-bold text-white mb-5 leading-[1.05]" style={{ letterSpacing: "-0.02em" }}>
              Terms of<br />
              <span className="italic font-normal text-white/60">Service</span>
            </h1>

            <p className="text-[15px] text-white/40 leading-relaxed max-w-xl" style={{ fontWeight: 300 }}>
              These terms govern your use of our platform. By continuing, you acknowledge
              that you have read and understood the following conditions.
            </p>

            {/* Mobile last updated */}
            <p className="terms-mono text-[11px] text-white/25 mt-5 lg:hidden">
              Last updated: March 10, 2026
            </p>
          </header>

          {/* Sections */}
          <div>
            {termsSections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className={`section-row relative py-10 fade-up ${activeSection === section.id ? "active" : ""}`}
                style={{ animationDelay: `${index * 0.04}s` }}
                onMouseEnter={() => setActiveSection(section.id)}
                onMouseLeave={() => setActiveSection(null)}
              >
                {/* Ghost number watermark */}
                <span className="number-stamp">{String(index + 1).padStart(2, "0")}</span>

                {/* Section index + title row */}
                <div className="flex items-baseline gap-4 mb-4 pr-16">
                  <span className="terms-mono text-[11px] text-[#EF3832]/60 shrink-0 w-7">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2
                    className="terms-display text-xl sm:text-2xl text-white font-bold"
                    style={{ letterSpacing: "-0.01em" }}
                  >
                    {section.title}
                  </h2>
                </div>

                {/* Body text */}
                <div className="pl-11">
                  <p className="text-[15px] leading-[1.85] text-white/50" style={{ fontWeight: 300 }}>
                    {section.content}
                  </p>

                  {/* Bullets */}
                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="mt-5 space-y-2">
                      {section.bullets.map((bullet, i) => (
                        <li
                          key={i}
                          className="bullet-item flex items-start text-[14px] leading-[1.8] text-white/40"
                          style={{ fontWeight: 300 }}
                        >
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>

          {/* Footer note */}
          <footer className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="terms-mono text-[11px] text-white/20">
              © 2026 I Was Killed For This Information. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF3832]" />
              <span className="terms-mono text-[11px] text-white/25">
                Effective: March 10, 2026
              </span>
            </div>
          </footer>

        </div>
      </div>
    </main>
  );
}