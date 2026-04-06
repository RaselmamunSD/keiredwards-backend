"use client";

// SignupFlow — orchestrator with updated types and tiered storage pricing.
// All global state lives here and is passed down as props.

import { useState } from "react";
import Step1Signup from "./Step1Signup";
import Step2Security from "./Step2Security";
import Step3Recipients from "./Step3Recipients";
import Step4Storage from "./Step4Storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StepNumber = 1 | 2 | 3 | 4;

export interface Step1Data {
  email: string;
  emailConfirm: string;
  password: string;
  passwordConfirm: string;
  accepted: boolean;
}

export interface SecurityAddons {
  privateEmail: boolean;
  twoFA: boolean;
}

export interface Step3Data {
  sendToRecipients: boolean;
  pressRelease250: boolean;
  pressRelease500: boolean;
  pressRelease1000: boolean;
  pressCategory: string;
}

export interface Step4Data {
  extraStorageGB: number;
  checkInService: string; // service key e.g. "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
  checkInTerm: string;    // "1" | "2" | "3"
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS: { id: StepNumber; label: string }[] = [
  { id: 1, label: "Signup" },
  { id: 2, label: "Security" },
  { id: 3, label: "Recipients" },
  { id: 4, label: "Storage & Payment" },
];

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function StepIndicator({ currentStep }: { currentStep: StepNumber }) {
  return (
    <div className="w-full flex justify-center px-4 py-8">
      <div className="relative w-full max-w-2xl">
        {/* Connector lines — green when the segment behind is completed */}
        <div className="absolute top-5 left-5 right-5 flex items-center pointer-events-none">
          {STEPS.slice(0, -1).map((step) => {
            const isCompleted = currentStep > step.id;
            return (
              <div
                key={step.id}
                className={[
                  "flex-1 h-[2px] transition-all duration-500",
                  isCompleted ? "bg-[#22c55e]" : "bg-white/10",
                ].join(" ")}
              />
            );
          })}
        </div>

        {/* Circles + Labels */}
        <div className="relative flex justify-between">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isActive    = currentStep === step.id;
            return (
              <div key={step.id} className="flex flex-col items-center gap-2.5">
                <div
                  className={[
                    "w-10 h-10 rounded-full flex items-center justify-center z-10",
                    "font-bold text-sm transition-all duration-300 border-2",
                    isCompleted
                      // ✅ Completed → solid green circle with green glow ring
                      ? "bg-[#22c55e] border-[#22c55e] text-white shadow-[0_0_0_3px_rgba(8,8,8,1),0_0_0_5px_rgba(34,197,94,0.45),0_4px_16px_rgba(34,197,94,0.30)]"
                      : isActive
                      // 🔴 Active → red circle with red glow ring
                      ? "bg-[#e8281e] border-[#e8281e] text-white shadow-[0_0_0_3px_rgba(8,8,8,1),0_0_0_5px_rgba(232,40,30,0.5),0_6px_20px_rgba(232,40,30,0.35)]"
                      // ⬤ Inactive → dim outline
                      : "bg-[#0f0f0f] border-white/10 text-white/30",
                  ].join(" ")}
                >
                  {isCompleted ? <CheckIcon /> : step.id}
                </div>
                <span
                  className={[
                    "text-[10px] font-bold text-center leading-tight transition-colors duration-300 uppercase tracking-[.08em] w-16",
                    isCompleted
                      ? "text-[#22c55e]"   // ✅ green label when done
                      : isActive
                      ? "text-[#e8281e]"   // 🔴 red label when active
                      : "text-white/25",   // ⬤ dim when pending
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STEP1: Step1Data = {
  email: "",
  emailConfirm: "",
  password: "",
  passwordConfirm: "",
  accepted: false,
};

// ─── Main orchestrator ────────────────────────────────────────────────────────

export default function SignupFlow() {
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [step1, setStep1] = useState<Step1Data>(INITIAL_STEP1);
  const [addons, setAddons] = useState<SecurityAddons>({ privateEmail: false, twoFA: false });
  const [step3, setStep3] = useState<Step3Data>({
    sendToRecipients: true,
    pressRelease250: false,
    pressRelease500: false,
    pressRelease1000: false,
    pressCategory: "",
  });
  const [step4, setStep4] = useState<Step4Data>({
    extraStorageGB: 0,
    checkInService: "",
    checkInTerm: "",
  });

  return (
    <div className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Top accent bar */}
      <div className="h-[3px] w-full bg-[#e8281e]" />

      {/* Background grid + orb */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,.04) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 90% 60% at 50% 30%, black, transparent)",
          }}
        />
        <div
          className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
          style={{
            background: "radial-gradient(ellipse, rgba(232,40,30,.07) 0%, transparent 65%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto pt-2">
        <StepIndicator currentStep={currentStep} />

        {currentStep === 1 && (
          <Step1Signup data={step1} onChange={setStep1} onNext={() => setCurrentStep(2)} />
        )}
        {currentStep === 2 && (
          <Step2Security addons={addons} onChange={setAddons} onBack={() => setCurrentStep(1)} onNext={() => setCurrentStep(3)} />
        )}
        {currentStep === 3 && (
          <Step3Recipients data={step3} onChange={setStep3} onBack={() => setCurrentStep(2)} onNext={() => setCurrentStep(4)} />
        )}
        {currentStep === 4 && (
          <Step4Storage data={step4} onChange={setStep4} addons={addons} step3={step3} onBack={() => setCurrentStep(3)} />
        )}
      </div>
    </div>
  );
}