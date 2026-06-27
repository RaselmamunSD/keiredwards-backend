"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

// ─── InputField ──────────────────────────────────────────────────────────────

const InputField: React.FC<{
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any;
}> = ({ label, id, type = "text", placeholder, error, registration }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-bold tracking-[0.15em] text-gray-300 uppercase">
      {label}
    </label>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      autoComplete="off"
      className={`w-full rounded-md bg-[#1a1a1a] border px-4 py-3 text-base text-white
        placeholder-gray-600 outline-none transition-all duration-200
        focus:border-red-500 focus:ring-1 focus:ring-red-500/40
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

// ─── Email Sent Screen ────────────────────────────────────────────────────────

const EmailSentScreen: React.FC<{ checkinEmail: string; onBack: () => void }> = ({
  checkinEmail,
  onBack,
}) => (
  <div className="flex flex-col items-center gap-5 py-2 text-center">
    {/* Icon */}
    <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </div>

    <div>
      <p className="text-white text-lg font-semibold mb-1">Check Your Inbox</p>
      <p className="text-gray-400 text-sm leading-relaxed">
        A check-in link has been sent to:
      </p>
      <p className="text-green-400 font-mono text-sm mt-1 break-all">{checkinEmail}</p>
    </div>

    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 text-left w-full">
      <p className="text-gray-300 text-xs leading-relaxed">
        📌 <strong className="text-white">Click the link in the email</strong> to complete your check-in and access the dashboard.
      </p>
      <p className="text-gray-500 text-xs mt-2">
        The link expires in <span className="text-yellow-400 font-semibold">30 minutes</span> and can only be used once.
        If you don&apos;t see it, check your spam folder.
      </p>
    </div>

    <button
      type="button"
      onClick={onBack}
      className="w-full mt-2 rounded-md border border-[#444] hover:border-[#666] bg-transparent
        cursor-pointer py-3 text-sm font-bold tracking-[0.15em] text-gray-400 hover:text-white uppercase
        transition-all duration-200"
    >
      ← Try Again
    </button>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const CheckInForm: React.FC = () => {
  const [stage, setStage] = useState<"form" | "sent">("form");
  const [checkinEmail, setCheckinEmail] = useState("");
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      const res = await api.requestCheckInLink({ email: data.email, password: data.password });
      // In DEBUG mode the backend returns magic_link directly; show checkin_email either way
      setCheckinEmail(res.data.checkin_email || data.email);
      setStage("sent");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setServerError((err as { message: string }).message || "Something went wrong. Please try again.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  };

  const handleBack = () => {
    reset();
    setServerError("");
    setStage("form");
  };

  return (
    <div className="w-full max-w-lg">
      <CheckInTitle />
      <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-8 shadow-2xl shadow-black/80">

        {stage === "sent" && (
          <EmailSentScreen checkinEmail={checkinEmail} onBack={handleBack} />
        )}

        {stage === "form" && (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            <p className="text-gray-400 text-sm text-center leading-relaxed -mt-1 mb-1">
              Enter your account email and password. A one-time check-in link will be sent to your registered check-in email address.
            </p>

            <InputField
              label="Account Email Address"
              id="email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              registration={register("email")}
            />

            <InputField
              label="Password"
              id="password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              registration={register("password")}
            />

            {serverError && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3">
                <p className="text-sm text-red-400">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-red-600 hover:bg-red-500 active:bg-red-700
                disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer py-3
                text-sm font-bold tracking-[0.2em] text-white uppercase
                transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
              {isSubmitting ? "SENDING LINK…" : "SEND CHECK-IN LINK"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default CheckInForm;