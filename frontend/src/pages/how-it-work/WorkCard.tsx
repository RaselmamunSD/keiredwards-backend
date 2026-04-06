"use client";

import Link from "next/link";
import React from "react";

const steps = [
    {
        number: "1",
        tag: "STEP 1 — ACCOUNT SETUP",
        title: "Create Your Encrypted Vault",
        description:
            "Sign up and create your secure account. Your data is protected with military-grade encryption. Even platform administrators cannot access your information. There is no password recovery option by design — only you control access.",
        badges: ["256-bit AES", "Zero admin access", "No password recovery"],
    },
    {
        number: "2",
        tag: "STEP 2 — SECURE UPLOAD",
        title: "Upload Your Critical Files",
        description:
            "Upload documents, images, videos, and evidence. All files are encrypted on your device before transmission. Store contracts, photos, recordings, or any digital evidence. 5GB included storage, with upgrades available at $15/1GB/yr.",
        badges: ["Client-side encryption", "5GB included storage", "All file types"],
    },
    {
        number: "3",
        tag: "STEP 3 — SCHEDULE",
        title: "Set Your Check-In Schedule",
        description:
            "Configure scheduled password check-ins to confirm your safety and control. Choose daily, weekly, bi-weekly, or monthly intervals. You'll receive email reminders before each deadline. Pause anytime if traveling or on vacation.",
        badges: ["Daily / Weekly / Monthly", "Email reminders", "Pausable anytime"],
    },
    {
        number: "4",
        tag: "STEP 4 — RECIPIENTS",
        title: "Designate Trusted Recipients",
        description:
            "Create a pre-approved list of up to 10 trusted recipients who will receive your files if a check-in is missed. Add their email addresses and customize the personal message they'll receive along with secure access to your information.",
        badges: ["Up to 10 recipients", "Custom message", "Secure access link"],
    },
    {
        number: "5",
        tag: "STEP 5 — PRESS RELEASE",
        title: "Configure Email & Press Release",
        description:
            "Write the email that will be sent to your trusted recipients. For maximum visibility, enable our optional public press-release service. If triggered, we'll publish a controlled announcement distributed to up to 1,000 major media outlets with a secure link to your data.",
        badges: ["Up to 1,000 outlets", "Custom press copy", "Secure data link"],
    },
    {
        number: "6",
        tag: "STEP 6 — AUTOMATIC TRIGGER",
        title: "Automatic Distribution",
        description:
            "If a check-in is missed, the platform automatically distributes your chosen files to all trusted recipients. If press release is enabled, it goes out simultaneously. Your information is released exactly as configured — no human intervention required.",
        badges: ["Fully automated", "Simultaneous delivery", "Zero human intervention"],
    },
];

export default function HowItWorks() {
    return (
        <>
            <style>{`
        .step-card {
          background: linear-gradient(145deg, #161618 0%, #111113 100%);
          border: 1px solid #222222;
          transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
        }

        .step-card:hover {
          background: linear-gradient(145deg, #231a1a 0%, #1a1010 100%);
          border-color: #e02020;
          box-shadow: 0 8px 28px rgba(224, 32, 32, 0.10), 0 2px 12px rgba(0,0,0,0.4);
          transform: translateY(-2px);
        }
      `}</style>

            <section className="w-full bg-[#0a0a0a] px-4 sm:px-8 lg:px-16 py-16 sm:py-24">
                <div className="container mx-auto">
                    {steps.map((step, index) => (
                        <div
                            key={step.number}
                            className="relative flex gap-6 sm:gap-10"
                            // FIX: no mb on the row itself — spacing is handled by the line + padding below
                        >
                            {/* Left: number circle + vertical line */}
                            <div className="flex flex-col items-center">
                                {/* Circle */}
                                <div
                                    className="flex-shrink-0 w-10 h-10 rounded-full bg-[#e02020] flex items-center justify-center z-10"
                                    style={{
                                        fontFamily: "'Arial Black', Arial, sans-serif",
                                        fontWeight: 900,
                                        fontSize: "1rem",
                                        color: "#fff",
                                        boxShadow: "0 0 0 3px #0a0a0a, 0 0 0 4px #e02020",
                                    }}
                                >
                                    {step.number}
                                </div>

                                {/* FIX: Line stretches full height of the row including the gap below the card.
                                    We use self-stretch + padding-bottom to bridge the gap to the next circle. */}
                                {index < steps.length - 1 && (
                                    <div
                                        className="w-px flex-1 mt-2"
                                        style={{
                                            backgroundColor: "#2a2a2a",
                                            // pb-10 equivalent in px to match the spacing between cards
                                            marginBottom: "-1px",
                                        }}
                                    />
                                )}
                            </div>

                            {/* Right: card — pb-10 creates the gap between cards, line fills it */}
                            <div
                                className="flex-1 pb-10 last:pb-0"
                            >
                                <div className="step-card rounded-2xl p-6 sm:p-8">

                                    {/* Step tag */}
                                    <p
                                        className="text-[#e02020] mb-2"
                                        style={{
                                            fontFamily: "'Arial', sans-serif",
                                            fontSize: "0.80rem",
                                            fontWeight: 600,
                                            letterSpacing: "0.15em",
                                        }}
                                    >
                                        {step.tag}
                                    </p>

                                    {/* Title */}
                                    <h3
                                        className="text-white mb-3"
                                        style={{
                                            fontFamily: "'Arial', sans-serif",
                                            fontWeight: 700,
                                            fontSize: "clamp(1rem, 2vw, 1.3rem)",
                                        }}
                                    >
                                        {step.title}
                                    </h3>

                                    {/* Description */}
                                    <p
                                        className="text-[#888888] mb-5"
                                        style={{
                                            fontFamily: "'Arial', sans-serif",
                                            fontSize: "clamp(0.82rem, 1.5vw, 1.1rem)",
                                            lineHeight: 1.75,
                                        }}
                                    >
                                        {step.description}
                                    </p>

                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-2">
                                        {step.badges.map((badge) => (
                                            <span
                                                key={badge}
                                                className="px-3 py-1 rounded-full text-[#aaaaaa]"
                                                style={{
                                                    fontFamily: "'Arial', sans-serif",
                                                    fontSize: "0.80rem",
                                                    backgroundColor: "#1e1e20",
                                                    border: "1px solid #2e2e30",
                                                }}
                                            >
                                                {badge}
                                            </span>
                                        ))}
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <section className="lg:w-[1650] mx-auto bg-[#0a0a0a] lg:px-4 lg:px-16 py-10 sm:py-16 mt-20">
                    <div className="rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-8 px-8 sm:px-12 py-16 bg-gradient-to-l from-[#120806] via-[#0f0f0f] to-[#0f0f11] border border-[#2a2a2a]">

                        {/* Left: text */}
                        <div className="flex-1">
                            <h2
                                className="block text-[2rem] md:text-[4rem] lg:text-[3rem] uppercase leading-none tracking-wide mb-8"
                                style={{ fontFamily: "var(--font-anton)", fontWeight: 400 }}
                            >
                                Ready to Set Up Your Vault?
                            </h2>
                            <p className="text-[#888888] text-xl leading-relaxed">
                                Takes less than 10 minutes. Your truth is protected the moment you <br /> hit save.
                            </p>
                        </div>

                        {/* Right: button */}
                        <div className="flex-shrink-0">
                            <Link
                                href="/pricing"
                                className="inline-block bg-[#e02020] text-white uppercase font-bold tracking-[0.12em] text-lg rounded-xl px-10 py-6 transition-all duration-300 hover:shadow-[0_0_24px_6px_rgba(224,32,32,0.55),0_0_48px_12px_rgba(224,32,32,0.25)] hover:-translate-y-0.5"
                            >
                                VIEW PRICING &amp; SIGN UP
                            </Link>
                        </div>

                    </div>
                </section>
            </section>
        </>
    );
}