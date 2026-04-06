// Step 1 — Login credentials
// Left: email/password form + green LOGIN button
// Right: legal warning panel in bordered box

import { LoginCredentials } from "@/Types/Types";
import { useState } from "react";
import { z } from "zod";


// ── Zod schema ────────────────────────────────────────────────────────────────

const credentialsSchema = z.object({
  username: z
    .string()
    .min(1, "Email address is required.")
    .email("Please enter a valid email address."),
  password: z
    .string()
    .min(1, "Password is required."),
});

type CredentialErrors = Partial<Record<keyof LoginCredentials, string>>;

// ── Legal warning content ─────────────────────────────────────────────────────

const LEGAL_CONTENT = [
  {
    type: "heading",
    text: "UNAUTHORIZED ACCESS TO THIS SYSTEM IS STRICTLY PROHIBITED AND MAY RESULT IN CRIMINAL PROSECUTION.",
  },
  {
    type: "paragraph",
    text: "This platform is designed to protect sensitive information and automatically distribute it to authorized recipients in the event of the account holder's incapacitation or death.",
  },
  {
    type: "paragraph",
    text: "Any attempt to gain unauthorized access, tamper with, disable, or otherwise interfere with this system constitutes a serious violation of federal and state laws, including but not limited to:",
  },
  {
    type: "list",
    items: [
      "Computer Fraud and Abuse Act (18 U.S.C. § 1030)",
      "Electronic Communications Privacy Act (18 U.S.C. § 2510 et seq.)",
      "State computer crime statutes",
      "Obstruction of justice laws",
    ],
  },
  {
    type: "paragraph",
    text: "All access attempts are logged, monitored, and can be used as evidence in legal proceedings.",
  },
  {
    type: "paragraph",
    text: "If you are not an authorized user, EXIT IMMEDIATELY. Continuing past this point constitutes acknowledgment that you understand these warnings and accept full legal responsibility for your actions.",
  },
  {
    type: "paragraph",
    text: "Authorized users: By logging in, you confirm your identity and agree to use this system only for its intended lawful purpose.",
  },
];

// ── Eye Icons ─────────────────────────────────────────────────────────────────

const EyeOpenIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.563-4.022M6.672 6.672A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.97 9.97 0 01-4.043 5.197M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onSuccess: (credentials: LoginCredentials) => void;
}

export default function StepCredentials({ onSuccess }: Props) {
  const [form, setForm] = useState<LoginCredentials>({ username: "", password: "" });
  const [errors, setErrors] = useState<CredentialErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (field: keyof LoginCredentials, value: string) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (submitted) {
      const result = credentialsSchema.safeParse(updated);
      if (!result.success) {
        const flat = result.error.flatten().fieldErrors;
        setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0]])));
      } else {
        setErrors({});
      }
    }
  };

  const handleLogin = () => {
    setSubmitted(true);
    const result = credentialsSchema.safeParse(form);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0]])));
      return;
    }
    onSuccess(form);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 w-full max-w-4xl">

      {/* ── Left: Login Form ── */}
      <div className="lg:w-88 shrink-0">
        <h1 className="text-white font-bold mb-8 tracking-wide text-4xl">Login</h1>

        <div className="space-y-5">

          {/* Email Address */}
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-white text-xs font-semibold tracking-widest uppercase">
              Email Address
            </label>
            <input
              id="username"
              type="email"
              value={form.username}
              onChange={e => set("username", e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              autoComplete="email"
              className={`w-full h-9 bg-white text-black text-sm px-2 border-0 focus:outline-none focus:ring-2 focus:ring-green-400 rounded ${errors.username ? "ring-2 ring-red-500" : ""
                }`}
            />
            {errors.username && (
              <p className="text-red-400 text-xs">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-white text-xs font-semibold tracking-widest uppercase">
              Password
            </label>

            {/* Input + Toggle wrapper */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={e => set("password", e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                autoComplete="current-password"
                className={`w-full h-9 bg-white text-black text-sm px-2 pr-9 border-0 focus:outline-none focus:ring-2 focus:ring-green-400 rounded ${errors.password ? "ring-2 ring-red-500" : ""
                  }`}
              />
              {/* Show / Hide toggle button */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
              </button>
            </div>

            {/* Zod error — shown only after submit attempt */}
            {errors.password && (
              <p className="text-red-400 text-xs mt-0.5">{errors.password}</p>
            )}
          </div>

          {/* ── Warning Callout ── */}
          <div className="mb-6 border border-[#EF3832] rounded bg-[#EF3832]/10 p-2 flex gap-3 items-start">
            <div className="shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-[#EF3832]"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[#EF3832]/90 text-sm leading-relaxed tracking-wide">
                Warning: No password recovery. Losing your email or password will permanently lock your account and data.
              </p>
            </div>
          </div>

          {/* Login button */}
          <div className="pt-1">
            <button
              onClick={handleLogin}
              className="
    inline-flex items-center justify-center
    bg-green-500 hover:bg-green-400 active:bg-green-600
    text-black font-bold text-sm
    px-8 py-2.5
    rounded
    uppercase tracking-widest
    transition-colors duration-150
    cursor-pointer
    min-w-[120px]
    focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
  "
            >
              LOGIN
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: Legal Warning Panel ── */}
      <div className="flex-1 border border-gray-400 p-6 rounded">
        <div className="space-y-4 text-white text-sm leading-relaxed">
          {LEGAL_CONTENT.map((block, i) => {
            if (block.type === "heading") {
              return (
                <p key={i} className="font-bold text-sm leading-snug">
                  {block.text}
                </p>
              );
            }
            if (block.type === "list") {
              return (
                <div key={i} className="space-y-0.5 pl-3 border-l-2 border-gray-500">
                  {block.items!.map((item, j) => (
                    <p key={j} className="text-sm">{item}</p>
                  ))}
                </div>
              );
            }
            return (
              <p key={i} className="text-sm">{block.text}</p>
            );
          })}
        </div>
      </div>

    </div>
  );
}