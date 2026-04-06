"use client";
// Step 1 — Signup
// Adopts the AI-version white-card aesthetic from client review.
// Zod schema owns all validation. Errors show inline only after first submit attempt.

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { Step1Data } from "./SignupFlow";
import Swal from "sweetalert2";

// ─── Zod schema ───────────────────────────────────────────────────────────────

const step1Schema = z
  .object({
    email: z.string().min(1, "Email address is required.").email("Please enter a valid email address."),
    emailConfirm: z.string().min(1, "Please confirm your email address."),
    password: z
      .string()
      .min(1, "Password is required.")
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Must contain at least one lowercase letter.")
      .regex(/[0-9]/, "Must contain at least one number.")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character (e.g. !@#$%)."),
    passwordConfirm: z.string().min(1, "Please confirm your password."),
    accepted: z.literal(true, { error: "You must accept the Terms of Service and Privacy Policy." }),
  })
  .refine((d) => d.email === d.emailConfirm, {
    message: "Email addresses do not match.",
    path: ["emailConfirm"],
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Passwords do not match.",
    path: ["passwordConfirm"],
  });

type Step1Errors = Partial<Record<keyof Step1Data, string>>;

// ─── Password strength ────────────────────────────────────────────────────────

const STRENGTH_RULES = [
  { label: "At least 8 characters", regex: /.{8,}/ },
  { label: "One uppercase letter (A–Z)", regex: /[A-Z]/ },
  { label: "One lowercase letter (a–z)", regex: /[a-z]/ },
  { label: "One number (0–9)", regex: /[0-9]/ },
  { label: "One special character (!@#…)", regex: /[^A-Za-z0-9]/ },
];

function getStrength(pw: string) {
  const passed = STRENGTH_RULES.filter((r) => r.regex.test(pw)).length;
  if (passed <= 1) return { passed, label: "Very Weak", bar: "bg-red-500" };
  if (passed === 2) return { passed, label: "Weak", bar: "bg-orange-500" };
  if (passed === 3) return { passed, label: "Fair", bar: "bg-yellow-400" };
  if (passed === 4) return { passed, label: "Strong", bar: "bg-blue-500" };
  return { passed, label: "Very Strong", bar: "bg-green-500" };
}

// ─── Eye Icons ────────────────────────────────────────────────────────────────

const EyeOpen = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeClosed = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.563-4.022M6.672 6.672A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.97 9.97 0 01-4.043 5.197M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
  </svg>
);

// ─── Field components ─────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

function Field({ id, label, type = "text", placeholder, value, onChange, error }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-[.12em] text-[#444]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "bg-[#f9f9f9] rounded-[10px] px-4 py-3 text-sm text-[#111] outline-none transition-all w-full",
          "border placeholder-[rgba(0,0,0,.28)]",
          error
            ? "border-[#e8281e] focus:border-[#e8281e] focus:shadow-[0_0_0_3px_rgba(232,40,30,0.12)]"
            : "border-black/15 focus:border-[#e8281e] focus:shadow-[0_0_0_3px_rgba(232,40,30,0.12)] focus:bg-white",
        ].join(" ")}
      />
      {error && <p className="text-[#e8281e] text-xs mt-0.5">{error}</p>}
    </div>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  showStrength?: boolean;
}

function PasswordField({ id, label, placeholder, value, onChange, error, showStrength = false }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const strength = value.length > 0 ? getStrength(value) : null;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-[.12em] text-[#444]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={[
            "w-full bg-[#f9f9f9] rounded-[10px] px-4 py-3 pr-10 text-sm text-[#111] outline-none transition-all",
            "border placeholder-[rgba(0,0,0,.28)]",
            error
              ? "border-[#e8281e] focus:shadow-[0_0_0_3px_rgba(232,40,30,0.12)]"
              : "border-black/15 focus:border-[#e8281e] focus:shadow-[0_0_0_3px_rgba(232,40,30,0.12)] focus:bg-white",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#333] transition-colors focus:outline-none"
        >
          {show ? <EyeClosed /> : <EyeOpen />}
        </button>
      </div>

      {/* Strength bars */}
      {showStrength && strength && (
        <div className="mt-1 flex flex-col gap-1">
          <div className="flex gap-1">
            {STRENGTH_RULES.map((_, i) => (
              <div
                key={i}
                className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${i < strength.passed ? strength.bar : "bg-black/10"
                  }`}
              />
            ))}
          </div>
          <p className={`text-xs font-semibold ${strength.passed <= 1 ? "text-red-500" :
            strength.passed === 2 ? "text-orange-500" :
              strength.passed === 3 ? "text-yellow-600" :
                strength.passed === 4 ? "text-blue-500" : "text-green-600"
            }`}>
            {strength.label}
          </p>
        </div>
      )}

      {/* Rules checklist */}
      {showStrength && (focused || error) && value.length > 0 && (
        <ul className="mt-1.5 flex flex-col gap-1">
          {STRENGTH_RULES.map((rule) => {
            const ok = rule.regex.test(value);
            return (
              <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-600" : "text-[#999]"}`}>
                <span className="shrink-0">
                  {ok ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </span>
                {rule.label}
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="text-[#e8281e] text-xs mt-0.5">{error}</p>}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const DEFAULT_STEP1: Step1Data = {
  email: "", emailConfirm: "", password: "", passwordConfirm: "", accepted: false,
};

interface Props {
  data?: Step1Data;
  onChange: (data: Step1Data) => void;
  onNext: () => void;
}

export default function Step1Signup({ data = DEFAULT_STEP1, onChange, onNext }: Props) {
  const [errors, setErrors] = useState<Step1Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof Step1Data>(field: K, value: Step1Data[K]) => {
    const updated = { ...data, [field]: value };
    onChange(updated);
    if (submitted) {
      const result = step1Schema.safeParse(updated);
      if (!result.success) {
        const flat = result.error.flatten().fieldErrors;
        setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0]])));
      } else {
        setErrors({});
      }
    }
  };

  const handleNext = () => {
    setSubmitted(true);
    const result = step1Schema.safeParse(data);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      const errorMessages = Object.entries(flat)
        .map(([field, messages]) => `${field}: ${messages?.[0]}`)
        .join("\n");
      alert(`Please fix the following errors:\n\n${errorMessages}`);
      setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0]])));
      return;
    }
    setErrors({});
    // ✅ Only call onNext() AFTER user clicks the confirm button
    Swal.fire({
      title: "Account Created Successfully!",
      text: "Your account is ready. Proceed to the next step to complete your registration.",
      icon: "success",
      confirmButtonText: "Continue to Next Step →",
      confirmButtonColor: "#e8281e",
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((result) => {
      if (result.isConfirmed) {
        onNext();
      }
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pb-10">
      {/* White card */}
      <div className="bg-white rounded-[22px] overflow-hidden shadow-[0_8px_48px_rgba(0,0,0,0.28),0_1px_4px_rgba(0,0,0,0.10)] border border-black/10">

        {/* Card header */}
        <div className="bg-[#f8f8f8] border-b border-black/8 px-6 sm:px-9 py-7">
          <p className="text-[12px] font-bold tracking-[.2em] uppercase text-[#e8281e] mb-2 font-mono">
            Step 1 of 4
          </p>
          <h2 className="block text-[2rem] md:text-[4rem] lg:text-[2rem] uppercase leading-none tracking-wide text-black mb-2"
            style={{ fontFamily: "var(--font-anton)" }}>
            Create Your Account
          </h2>
          <p className="text-md text-[#555] leading-relaxed">
            Please enter a valid email address and a secure password to begin. This
            email is required for your initial login only. Once your account is active,
            you may update your settings to use a different email for future logins,
            check-ins, and multi-factor authentication.
          </p>
        </div>

        {/* Card body */}
        <div className="px-6 sm:px-9 py-8">

          {/* Email section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <Field
              id="email" label="Email Address" type="email"
              placeholder="you@example.com" value={data.email}
              onChange={(v) => set("email", v)} error={errors.email}
            />
            <Field
              id="emailConfirm" label="Confirm Email" type="email"
              placeholder="you@example.com" value={data.emailConfirm}
              onChange={(v) => set("emailConfirm", v)} error={errors.emailConfirm}
            />
          </div>

          <div className="h-px bg-black/8 mb-6" />

          {/* Password section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <PasswordField
              id="password" label="Password"
              placeholder="Minimum 8 characters" value={data.password}
              onChange={(v) => set("password", v)} error={errors.password}
              showStrength={true}
            />
            <PasswordField
              id="passwordConfirm" label="Confirm Password"
              placeholder="Re-enter your password" value={data.passwordConfirm}
              onChange={(v) => set("passwordConfirm", v)} error={errors.passwordConfirm}
            />
          </div>

          {/* Warning box */}
          <div className="bg-[rgba(232,40,30,0.06)] border border-[rgba(232,40,30,0.30)] rounded-xl px-5 py-4 flex gap-3.5 items-start mb-6">
            <span className="text-xl shrink-0 mt-0.5">⚠️</span>
            <p className="text-sm leading-relaxed text-[#222] font-medium">
              <strong className="text-[#e8281e]">Critical Warning:</strong> Do not forget or lose the email and
              password you enter here. Without them you will have no access to I WAS KILLED FOR THIS
              INFORMATION and any money paid will be lost. There is no password recovery by design.
            </p>
          </div>

          {/* Terms */}
          <div className="mb-8">
            <label
              htmlFor="accepted"
              className="flex items-start gap-3 cursor-pointer group"
            >
              <div
                className={[
                  "w-5 h-5 rounded-[5px] border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                  data.accepted
                    ? "bg-[#e8281e] border-[#e8281e]"
                    : "bg-[#f9f9f9] border-black/22 group-hover:border-[#e8281e]",
                ].join(" ")}
              >
                <input
                  id="accepted"
                  type="checkbox"
                  checked={data.accepted}
                  onChange={(e) => set("accepted", e.target.checked)}
                  className="sr-only"
                />
                {data.accepted && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-[#444] leading-relaxed">
                I accept the{" "}
                <Link href="/terms-of-service" className="text-[#e8281e] hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy-policy" className="text-[#e8281e] hover:underline">Privacy Policy</Link>
              </span>
            </label>
            {errors.accepted && (
              <p className="text-[#e8281e] text-xs mt-1.5 ml-8">{errors.accepted}</p>
            )}
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="bg-[#e8281e] hover:bg-[#c8221a] text-white font-bold text-sm px-8 py-3.5 rounded-[10px] uppercase tracking-[.08em] transition-all shadow-[0_4px_20px_rgba(232,40,30,.3)] hover:shadow-[0_10px_32px_rgba(232,40,30,.45)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              Accept &amp; Continue →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}