"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ─── Types ───────────────────────────────────────────────────────────────────

type AccountConfig = {
  hasPassword: boolean;
  hasTwoFa: boolean;
};

// Simulates a backend lookup — replace with a real API call in production.
// Demo behaviour:
//   email containing "+nopass"  → email only, no password, no 2FA
//   email containing "+no2fa"   → email + password, no 2FA
//   any other email             → email + password + 2FA
async function lookupAccountConfig(email: string): Promise<AccountConfig> {
  await new Promise((r) => setTimeout(r, 350));
  if (email.includes("+nopass")) return { hasPassword: false, hasTwoFa: false };
  if (email.includes("+no2fa")) return { hasPassword: true, hasTwoFa: false };
  return { hasPassword: true, hasTwoFa: true };
}

// ─── Dynamic Zod schema — only validates fields that are actually shown ───────

const buildSchema = (requirePassword: boolean, requireTwoFa: boolean) =>
  z.object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    password: requirePassword
      ? z.string().min(1, "Password is required")
      : z.string().optional(),
    twoFa: requireTwoFa
      ? z
          .string()
          .min(6, "2FA code must be at least 6 characters")
          .max(8, "2FA code must be at most 8 characters")
      : z.string().optional(),
  });

// ─── InputField ──────────────────────────────────────────────────────────────

const InputField: React.FC<{
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any;
  disabled?: boolean;
}> = ({ label, id, type = "text", placeholder, error, registration, disabled }) => (
  <div className="flex flex-col gap-1.5">
    <label
      htmlFor={id}
      className="text-xs font-bold tracking-[0.15em] text-gray-300 uppercase"
    >
      {label}
    </label>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      autoComplete="off"
      disabled={disabled}
      className={`w-full rounded-md bg-[#1a1a1a] border px-4 py-3 text-base text-white
        placeholder-gray-600 outline-none transition-all duration-200
        focus:border-red-500 focus:ring-1 focus:ring-red-500/40
        disabled:opacity-40 disabled:cursor-not-allowed
        ${error ? "border-red-500" : "border-[#333]"}`}
      {...registration}
    />
    {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
  </div>
);

// ─── Title ────────────────────────────────────────────────────────────────────

const CheckInTitle: React.FC = () => (
  <div className="text-center mb-8">
    <h1 className="font-bebas font-extrabold text-7xl tracking-[0.2em] text-white uppercase">
      CHECK-IN
    </h1>
    <div className="mx-auto mt-2 h-0.5 w-12 bg-red-600 rounded-full" />
  </div>
);

// ─── Confirm Check-In Screen (Part 2) ────────────────────────────────────────
// FEEDBACK "Check in part 2": CONFIRM CHECK-IN button must be GREEN

const ConfirmScreen: React.FC<{ onConfirm: () => void }> = ({ onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    onConfirm();
  }, [onConfirm]);

  return (
    <div className="flex flex-col gap-3 py-2">
      <p className="text-gray-400 text-sm text-center tracking-wide">
        Please confirm your check-in to proceed.
      </p>
      {/* FEEDBACK: green button */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={loading}
        className="w-full rounded-md bg-green-400 hover:bg-green-300 active:bg-green-500
          disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer py-3
          text-sm font-bold tracking-[0.2em] text-black uppercase
          transition-all duration-200 flex items-center justify-center gap-2"
      >
        {loading && (
          <span className="inline-block h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
        )}
        CONFIRM CHECK-IN
      </button>
    </div>
  );
};

// ─── Success Screen (Part 3) ──────────────────────────────────────────────────
// FEEDBACK "Check in part 3":
//   • Close button must be BLUE
//   • Close button must "Link to Google" — clicking CLOSE navigates to google.com
//   • "Get rid of this screen / If you put an email address it loops back" —
//     the loop happened because handleClose() previously called setStep(1),
//     which re-showed the email form (Part 4 in the feedback screenshots).
//     Fix: CLOSE now goes to google.com — there is NO reset back to the email form.

const SuccessScreen: React.FC = () => {
  const nextCheckIn = new Date();
  nextCheckIn.setMonth(nextCheckIn.getMonth() + 3);
  const formatted = nextCheckIn.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  const handleClose = useCallback(() => {
    // FEEDBACK: "Link to Google" + eliminates the loop-back screen entirely
    window.location.href = "https://www.google.com";
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <p className="text-white text-lg font-semibold tracking-wide">
        Check-In Complete
      </p>
      <div className="text-center">
        <p className="text-gray-400 text-sm tracking-[0.12em] uppercase mb-2">
          Next Check In
        </p>
        <p className="text-white text-2xl font-bold tracking-widest">{formatted}</p>
      </div>
      {/* FEEDBACK: blue button + navigates to Google (no loop back to email form) */}
      <button
        onClick={handleClose}
        className="w-full mt-1 rounded-md bg-blue-500 hover:bg-blue-400 active:bg-blue-600
          cursor-pointer py-3 text-sm font-bold tracking-[0.2em] text-white uppercase
          transition-colors duration-200"
      >
        CLOSE
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

type Stage = "form" | "confirm" | "success";

const CheckInForm: React.FC = () => {
  const [stage, setStage] = useState<Stage>("form");

  // Which fields are currently revealed on the single form
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTwoFa, setShowTwoFa] = useState(false);

  // Loading states
  const [lookingUp, setLookingUp] = useState(false);
  const [requesting2FA, setRequesting2FA] = useState(false);
  const [requested2FA, setRequested2FA] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Schema rebuilds whenever revealed fields change
  const schema = buildSchema(showPassword, showTwoFa);
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  // Re-validate when new fields are revealed
  useEffect(() => {
    if (emailConfirmed) trigger();
  }, [showPassword, showTwoFa, emailConfirmed, trigger]);

  // ── Phase 1: email submitted → look up account config → reveal next fields ──
  // FEEDBACK: "Once the email is entered the system should show the next option"
  // Everything happens on ONE screen — no navigation to a new page/step.
  // The email field locks (disabled) so it cannot be re-edited, preventing the loop.
  const handleEmailSubmit = useCallback(async () => {
    const valid = await trigger("email");
    if (!valid) return;

    const email = getValues("email");
    setLookingUp(true);
    const config = await lookupAccountConfig(email);
    setLookingUp(false);
    setEmailConfirmed(true);

    if (config.hasPassword) {
      setShowPassword(true);
      if (config.hasTwoFa) setShowTwoFa(true);
    }
    // FEEDBACK: "if the client chose not to have a password the submit button
    // will show up" — if hasPassword is false, no new field appears, the
    // SUBMIT button below is already visible and becomes the final submit.
  }, [trigger, getValues]);

  // ── Phase 2: all required fields filled → go to confirm screen ───────────────
  const onFinalSubmit = useCallback(async (_data: FormData) => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    setSubmitting(false);
    setStage("confirm");
  }, []);

  // ── Phase 3: confirmed → success screen ──────────────────────────────────────
  const handleConfirmed = useCallback(() => {
    setStage("success");
  }, []);

  const handleRequest2FA = useCallback(async () => {
    setRequesting2FA(true);
    await new Promise((r) => setTimeout(r, 600));
    setRequesting2FA(false);
    setRequested2FA(true);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-lg">
      <CheckInTitle />
      <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-8 shadow-2xl shadow-black/80">

        {/* ── Confirm screen (Part 2) ── */}
        {stage === "confirm" && <ConfirmScreen onConfirm={handleConfirmed} />}

        {/* ── Success screen (Part 3) ── */}
        {/* FEEDBACK "Check in part 4": the screen that appeared after Close was
            the email form looping back. SuccessScreen.handleClose now navigates
            to Google instead of resetting state, so that empty email form
            (Part 4) never appears again. */}
        {stage === "success" && <SuccessScreen />}

        {/* ── Main form (Part 1) — single screen, progressive field reveal ── */}
        {stage === "form" && (
          <form
            onSubmit={handleSubmit(onFinalSubmit)}
            noValidate
            className="flex flex-col gap-5"
          >
            {/* Email — always shown; locked once confirmed to prevent loop-back */}
            <InputField
              label="Email Address"
              id="email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              registration={register("email")}
              disabled={emailConfirmed}
            />

            {/* Password — appears only if account requires it */}
            {showPassword && (
              <InputField
                label="Password"
                id="password"
                type="password"
                placeholder="••••••••"
                error={
                  (errors as Record<string, { message?: string }>).password
                    ?.message
                }
                registration={register("password")}
              />
            )}

            {/* 2FA — appears only if account requires it */}
            {showTwoFa && (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="twoFa"
                  className="text-xs font-bold tracking-[0.15em] text-gray-300 uppercase"
                >
                  Security 2FA
                </label>
                <div className="flex gap-2">
                  <input
                    id="twoFa"
                    type="text"
                    placeholder="Enter 2FA code"
                    autoComplete="one-time-code"
                    className={`flex-1 rounded-md bg-[#1a1a1a] border px-4 py-3 text-base
                      text-white placeholder-gray-600 outline-none transition-all duration-200
                      focus:border-red-500 focus:ring-1 focus:ring-red-500/40 ${
                        (errors as Record<string, { message?: string }>).twoFa
                          ? "border-red-500"
                          : "border-[#333]"
                      }`}
                    {...register("twoFa")}
                  />
                  <button
                    type="button"
                    onClick={handleRequest2FA}
                    disabled={requesting2FA || requested2FA}
                    className={`px-4 py-3 rounded-md text-xs font-bold tracking-widest uppercase
                      transition-all duration-200 cursor-pointer ${
                        requested2FA
                          ? "bg-green-700 text-green-200 cursor-default"
                          : "bg-green-500 hover:bg-green-400 active:bg-green-600 text-white"
                      }`}
                  >
                    {requesting2FA ? "…" : requested2FA ? "SENT" : "REQUEST"}
                  </button>
                </div>
                {(errors as Record<string, { message?: string }>).twoFa && (
                  <p className="text-xs text-red-400 mt-0.5">
                    {
                      (errors as Record<string, { message?: string }>).twoFa
                        ?.message
                    }
                  </p>
                )}
              </div>
            )}

            {/*
              Submit button behaviour:
              • Before email confirmed → validates email, looks up account,
                reveals next field(s) on this same screen (no new screen).
              • After email confirmed → submits the full form → confirm screen.
              FEEDBACK: "if the client chose not to have a password the submit
              button will show up" — for email-only accounts, emailConfirmed
              flips true with no new fields, so the button below immediately
              becomes the final submit.
            */}
            {!emailConfirmed ? (
              <button
                type="button"
                onClick={handleEmailSubmit}
                disabled={lookingUp}
                className="w-full rounded-md bg-red-600 hover:bg-red-500 active:bg-red-700
                  disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer py-3
                  text-sm font-bold tracking-[0.2em] text-white uppercase
                  transition-all duration-200 flex items-center justify-center gap-2"
              >
                {lookingUp && (
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                )}
                SUBMIT
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-red-600 hover:bg-red-500 active:bg-red-700
                  disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer py-3
                  text-sm font-bold tracking-[0.2em] text-white uppercase
                  transition-all duration-200 flex items-center justify-center gap-2"
              >
                {submitting && (
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                )}
                SUBMIT
              </button>
            )}
          </form>
        )}

      </div>
    </div>
  );
};

export default CheckInForm;