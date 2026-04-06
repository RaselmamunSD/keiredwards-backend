"use client";

import React from "react";

export default function BuiltForWorstCase() {
    return (
        <>
            <style>{`
        .feature-card {
          position: relative;
          border-radius: 16px;
          padding: 24px;
          overflow: hidden;
          cursor: default;
          background: linear-gradient(145deg, #1c1c1e 0%, #141414 100%);
          border: 0.1px solid transparent;
          transform: scale(1) translateY(0px);
          transition: transform 0.3s ease, border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 3px;
          background-color: #e02020;
          border-radius: 12px 0 0 12px;
          transform: scaleY(0);
          transform-origin: top;
          transition: transform 0.3s ease;
        }

        .feature-card:hover {
          background: linear-gradient(145deg, #231a1a 0%, #1a1010 100%);
          border-color: #e02020;
          transform: scale(1.03) translateY(-4px);
          box-shadow: 0 12px 32px rgba(224, 32, 32, 0.12), 0 4px 16px rgba(0,0,0,0.4);
        }

        .feature-card:hover::before {
          transform: scaleY(1);
        }
      `}</style>

            <section className="w-full bg-[#0d0d0d] px-6 sm:px-10 lg:px-20 py-16 sm:py-20 lg:mt-20">
                <div className="container mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16">

                    {/* LEFT: Heading + Body text */}
                    <div className="flex-1 max-w-[720px]">
                        <h2
                            className="uppercase leading-[1.02] mb-8"
                            style={{
                                fontFamily: "'Arial Black', 'Arial', sans-serif",
                                fontWeight: 900,
                                fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
                            }}
                        >
                            <h1 className="block text-[2rem] md:text-[4rem] lg:text-[4rem] uppercase leading-none tracking-wide"
                                style={{ fontFamily: "var(--font-anton)", fontWeight: 400 }}>
                                BUILT FOR <span className="text-[#EF3832]">WORST-CASE</span>
                            </h1>
                            <span className="block text-[2rem] md:text-[4rem] lg:text-[4rem] uppercase leading-none tracking-wide mt-4"
                                style={{ fontFamily: "var(--font-anton)", fontWeight: 400 }}>
                                SCENARIOS
                            </span>

                        </h2>

                        <div
                            className="space-y-5 text-[#aaaaaa] text-lg text-justify"
                            style={{
                                lineHeight: 1.75,
                            }}
                        >
                            <p>
                                Our system protects your data inside an encrypted vault and requires
                                scheduled password check-ins to confirm your safety and control. If a
                                check-in is missed, the platform automatically distributes your chosen
                                files to a pre-approved list of trusted recipients.
                            </p>
                            <p>
                                For users who need maximum visibility, we also offer an optional public
                                press-release service that publishes a controlled announcement with
                                a secure link to your data, distributed to major media outlets. Your
                                story cannot be suppressed.
                            </p>
                            <p>
                                This is more than storage. It's a safeguard. A guarantee that your
                                information cannot be silenced, erased, or buried. Your truth stays alive
                                — even if you can't press the button yourself.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT: 2x2 Feature cards */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* Card 1 - Encrypted Vault */}
                        <div className="feature-card">
                            <div className="text-2xl mb-4">🔐</div>
                            <h3
                                className="text-white uppercase mb-3 text-lg font-semibold"
                            >
                                ENCRYPTED VAULT
                            </h3>
                            <p
                                className="text-[#999999]"

                            >
                                Military-grade 256-bit encryption. Zero admin access. No backdoors, no
                                exceptions, no recovery options by design.
                            </p>
                        </div>

                        {/* Card 2 - Scheduled Check-ins */}
                        <div className="feature-card">
                            <div className="text-2xl mb-4">⏱</div>
                            <h3
                                className="text-white uppercase mb-3 text-lg font-semibold"
                            >
                                SCHEDULED CHECK-INS
                            </h3>
                            <p
                                className="text-[#999999]"

                            >
                                Daily, weekly, or monthly check-ins. Miss one — your files distribute
                                automatically to every recipient.
                            </p>
                        </div>

                        {/* Card 3 - Press Release Service */}
                        <div className="feature-card">
                            <div className="text-2xl mb-4">📡</div>
                            <h3
                                className="text-white uppercase mb-3 text-lg font-semibold"
                            >
                                PRESS RELEASE SERVICE
                            </h3>
                            <p
                                className="text-[#999999]"

                            >
                                Optional distribution to up to 500 media organizations simultaneously.
                                Your story cannot be buried.
                            </p>
                        </div>

                        {/* Card 4 - Zero Admin Access */}
                        <div className="feature-card">
                            <div className="text-2xl mb-4">👁</div>
                            <h3
                                className="text-white uppercase mb-3 text-lg font-semibold"

                            >
                                ZERO ADMIN ACCESS
                            </h3>
                            <p
                                className="text-[#999999]"

                            >
                                No password recovery by design. Only you control access. No support
                                ticket will ever unlock your vault.
                            </p>
                        </div>

                    </div>
                </div>
            </section>
        </>
    );
}