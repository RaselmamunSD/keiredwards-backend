"use client";

import React from "react";

export default function WhoItsBuiltFor() {
  return (
    <>
      <style>{`
        .audience-card {
          position: relative;
          border-radius: 16px;
          padding: 35px;
          overflow: hidden;
          cursor: default;
          background: linear-gradient(145deg, #1c1c1e 0%, #141414 100%);
          border: 0.1px solid transparent;
          transform: scale(1) translateY(0px);
          transition: transform 0.3s ease, border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
        }

        .audience-card:hover {
          background: linear-gradient(145deg, #231a1a 0%, #1a1010 100%);
          border-color: #e02020;
          transform: scale(1.02) translateY(-4px);
          box-shadow: 0 12px 32px rgba(224, 32, 32, 0.12), 0 4px 16px rgba(0,0,0,0.4);
        }

        .icon-box {
          width: 65px;
          height: 65px;
          border-radius: 12px;
          background: linear-gradient(145deg, #2a1a1a, #1e1010);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 20px;
          border: 1px solid #3a2020;
        }
      `}</style>

      <section className="w-full bg-[#0d0d0d] px-6 sm:px-10 lg:px-20 pt-10 sm:pt-24 pb-4 sm:pb-6">
        {/* Heading */}
        <h2
          className="block text-[2rem] md:text-[4rem] lg:text-[4rem] uppercase leading-none tracking-wide text-center mb-12"
                style={{ fontFamily: "var(--font-anton)" }}
        >
          WHO IT'S BUILT FOR
        </h2>

        {/* Cards grid */}
        <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Card 1 - Journalists */}
          <div className="audience-card">
            <div className="icon-box">✍️</div>
            <h3
              className="text-white mb-3 text-xl"
             
            >
              Journalists &amp; Investigators
            </h3>
            <p
              className="text-[#888888] text-lg"
             
            >
              You've uncovered something powerful. Make sure your sources, evidence, and
              findings are automatically released to editors, lawyers, or the public the
              moment you go silent.
            </p>
          </div>

          {/* Card 2 - Whistleblowers */}
          <div className="audience-card">
            <div className="icon-box">📣</div>
            <h3
              className="text-white mb-3 text-xl"
            >
              Whistleblowers &amp; Activists
            </h3>
            <p
              className="text-[#888888] text-lg"
              
            >
              Expose corruption and injustice knowing your documentation will reach trusted
              recipients and the press automatically — with no way to silence you after the
              fact.
            </p>
          </div>

          {/* Card 3 - Private Individuals */}
          <div className="audience-card">
            <div className="icon-box">🧑‍💼</div>
            <h3
             className="text-white mb-3 text-xl"
            >
              Private Individuals
            </h3>
            <p
              className="text-[#888888] text-lg"
             
            >
              Whether it's a legal matter, sensitive family situation, or critical evidence
              — ensure the people who need to know will receive your files exactly when it
              matters most.
            </p>
          </div>

        </div>
      </section>
    </>
  );
}