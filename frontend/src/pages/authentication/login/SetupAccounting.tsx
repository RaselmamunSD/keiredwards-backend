// Tab 7 — Setup & Accounting

import { useState, useEffect } from "react";
import { MdOutlineKeyboardArrowDown, MdOutlineKeyboardArrowUp, MdVisibility, MdVisibilityOff } from "react-icons/md";
import Swal from "sweetalert2";
import { z } from "zod";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActiveService { name: string; additionalInfo: string; activeUntil: string; isPurchased: boolean; }
interface BillingRecord { date: string; description: string; amount: string; isIncluded?: boolean; }
interface CheckInHistoryRecord { date: string; time: string; ip: string; loginName: string; deviceOS: string; }
interface NewOrderAddons { privateEmail: boolean; twoFA: boolean; }
interface NewOrderPressRelease { sendToRecipients: boolean; pressOption: "" | "press100" | "press250" | "press500"; category: string; }
interface NewOrderPayment { extraStorageGB: number; checkInService: string; checkInTerm: string; }
type NewOrderStep = "addons" | "delivery" | "press-release" | "payment";
type AnyErrors = Record<string, string | undefined>;

// ─── Mock data ────────────────────────────────────────────────────────────────

const ACTIVE_SERVICES: ActiveService[] = [
  { name: "I Was Killed For This Information", additionalInfo: "Daily Check-in", activeUntil: "March 7, 2027", isPurchased: true },
  { name: "Additional Storage", additionalInfo: "XX GB", activeUntil: "March 7, 2027", isPurchased: true },
  { name: "Press Release", additionalInfo: "250 count*", activeUntil: "March 7, 2027", isPurchased: true },
  { name: "Two-Factor Authentication", additionalInfo: "Checkin & Login", activeUntil: "Not Purchased", isPurchased: false },
  { name: "Private Email", additionalInfo: "500 Messages Per year", activeUntil: "March 7, 2027", isPurchased: true },
];

const BILLING_RECORDS: BillingRecord[] = [
  { date: "02/23/2026", description: "Professional Plan", amount: "$29.99" },
  { date: "02/23/2026", description: "Storage: 5 GB (Default)", amount: "Included", isIncluded: true },
  { date: "01/23/2026", description: "Professional Plan", amount: "$29.99" },
  { date: "12/23/2025", description: "Professional Plan", amount: "$29.99" },
];

const CHECKIN_HISTORY: CheckInHistoryRecord[] = [
  { date: "02/24/2026", time: "09:15 AM", ip: "192.168.1.100", loginName: "john.doe@email.com", deviceOS: "Windows 11" },
  { date: "02/17/2026", time: "02:30 PM", ip: "192.168.1.100", loginName: "john.doe@email.com", deviceOS: "Windows 11" },
  { date: "02/10/2026", time: "11:45 AM", ip: "192.168.1.100", loginName: "john.doe@email.com", deviceOS: "Windows 11" },
  { date: "02/03/2026", time: "08:20 AM", ip: "192.168.1.100", loginName: "john.doe@email.com", deviceOS: "Windows 11" },
  { date: "01/27/2026", time: "03:55 PM", ip: "10.0.0.52", loginName: "john.doe@email.com", deviceOS: "macOS Sonoma" },
];

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const changeUserSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newUsername: z.string().min(1, "New username is required.").email("Enter a valid email address."),
});

// ── UPDATED: strong password rules ──
const resetPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(64, "Password must be 64 characters or fewer.")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter (A–Z).")
    .regex(/[a-z]/, "Must contain at least one lowercase letter (a–z).")
    .regex(/[0-9]/, "Must contain at least one number (0–9).")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character (e.g. !@#$%^&*)."),
  confirmPassword: z.string().min(1, "Please confirm your password."),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

const cancelSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionWrapper({ children, isCancel }: { children: React.ReactNode; isCancel?: boolean }) {
  return (
    <div className={`rounded-xl overflow-hidden border ${isCancel ? "border-red-200" : "border-gray-200"} shadow-sm`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, isCancel }: { title: string; isCancel?: boolean }) {
  return (
    <div className={`px-5 py-3 ${isCancel ? "bg-red-50 border-b border-red-200" : "bg-gray-100 border-b border-gray-200"}`}>
      <span className={`text-xs font-bold uppercase tracking-widest ${isCancel ? "text-red-500" : "text-gray-600"}`}>{title}</span>
    </div>
  );
}

function AccordionRow({
  label,
  expanded,
  onToggle,
  statusBadge,
  disabled,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  statusBadge?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      className={`w-full flex items-center justify-between px-5 py-3.5 text-sm text-left transition-colors border-b border-gray-100 last:border-b-0
        ${disabled ? "bg-gray-50 cursor-not-allowed opacity-60" : expanded ? "bg-white" : "bg-white hover:bg-gray-50"}`}
    >
      <div className="flex items-center gap-3">
        <span className="font-medium text-gray-800">{label}</span>
        {statusBadge}
      </div>
      <span className="text-gray-400 shrink-0 ml-2">
        {expanded ? <MdOutlineKeyboardArrowUp size={22} /> : <MdOutlineKeyboardArrowDown size={22} />}
      </span>
    </button>
  );
}

function AccordionContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border-b border-gray-100 last:border-b-0 px-5 py-5">
      {children}
    </div>
  );
}

function InputField({ label, type, value, onChange, placeholder, error, autoComplete }: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; autoComplete?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full border rounded-lg px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all pr-10
            ${error ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-orange-200 focus:border-orange-400"}`}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

function WarningBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-red-200 bg-red-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-orange-500">⚠</span>
        <span className="font-bold text-red-600 text-sm">{title}</span>
      </div>
      <div className="text-xs text-gray-700 leading-relaxed space-y-1.5">{children}</div>
    </div>
  );
}

// ─── Password Strength Indicator (used only in Reset Password mode) ───────────

function PasswordStrengthIndicator({ password }: { password: string }) {
  const rules = [
    { label: "At least 8 characters",          pass: password.length >= 8 },
    { label: "At least one uppercase (A–Z)",    pass: /[A-Z]/.test(password) },
    { label: "At least one lowercase (a–z)",    pass: /[a-z]/.test(password) },
    { label: "At least one number (0–9)",        pass: /[0-9]/.test(password) },
    { label: "At least one special character",  pass: /[^A-Za-z0-9]/.test(password) },
  ];

  const passed = rules.filter(r => r.pass).length;
  const strength = passed <= 1 ? "Weak" : passed <= 3 ? "Fair" : passed === 4 ? "Good" : "Strong";
  const strengthColor =
    passed <= 1 ? "bg-red-500" :
    passed <= 3 ? "bg-yellow-400" :
    passed === 4 ? "bg-blue-500" :
    "bg-green-500";
  const strengthTextColor =
    passed <= 1 ? "text-red-600" :
    passed <= 3 ? "text-yellow-600" :
    passed === 4 ? "text-blue-600" :
    "text-green-600";

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
            style={{ width: `${(passed / 5) * 100}%` }}
          />
        </div>
        <span className={`text-xs font-bold ${strengthTextColor}`}>{strength}</span>
      </div>

      {/* Rules checklist */}
      <ul className="space-y-1">
        {rules.map(r => (
          <li key={r.label} className="flex items-center gap-2 text-xs">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold
              ${r.pass ? "bg-green-100 text-green-600 border border-green-300" : "bg-gray-100 text-gray-400 border border-gray-200"}`}>
              {r.pass ? "✓" : "✕"}
            </span>
            <span className={r.pass ? "text-green-700" : "text-gray-400"}>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Login Content ────────────────────────────────────────────────────────────

function LoginContent({ userEmail, onSuccess }: { userEmail: string; onSuccess?: () => void }) {
  type LoginMode = "changeUser" | "resetPassword";
  const [mode, setMode] = useState<LoginMode>("changeUser");
  const [form, setForm] = useState({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<AnyErrors>({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const setField = (key: string, val: string) => { setForm(p => ({ ...p, [key]: val })); setErrors(p => ({ ...p, [key]: undefined })); };

  const handleSave = async () => {
    const data = mode === "changeUser"
      ? { currentPassword: form.currentPassword, newUsername: form.newUsername }
      : { currentPassword: form.currentPassword, newPassword: form.newPassword, confirmPassword: form.confirmPassword };
    const schema = mode === "changeUser" ? changeUserSchema : resetPasswordSchema;
    const result = schema.safeParse(data);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, (v as string[])?.[0]])));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      if (mode === "changeUser") {
        // Update user profile login email (username)
        await api.profileUpdate({ username: form.newUsername });
        // Also update 2FA email config in setup-accounting config
        await api.updateSetupAccounting({ two_fa_email: form.newUsername });
        setSuccess("Email updated successfully.");
      } else {
        // Update password
        await api.passwordChange({
          old_password: form.currentPassword,
          new_password: form.newPassword,
          new_password_confirm: form.confirmPassword,
        });
        setSuccess("Password updated successfully.");
      }
      setForm({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" });
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error(err);
      setErrors({
        currentPassword: err?.message || "Operation failed. Please check your credentials."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <p className="text-sm text-gray-600 leading-relaxed">
        This is the Email address (User Name) and password needed to login to the Dashboard and the Settings and Configuration pages you are currently viewing. For security reasons we recommend changing this on a regular basis.
      </p>

      {success && (
        <div className="bg-green-50 border border-green-300 text-green-700 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
          <span>✓</span> {success}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-600 shrink-0">Current Login Email</span>
        <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-sm text-gray-700 flex-1 min-w-48">
          {userEmail}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setMode("changeUser"); setErrors({}); setForm({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" }); }}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors
              ${mode === "changeUser" ? "bg-orange-400 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            CHANGE USER EMAIL
          </button>
          <button
            onClick={() => { setMode("resetPassword"); setErrors({}); setForm({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" }); }}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors
              ${mode === "resetPassword" ? "bg-orange-400 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            RESET PASSWORD
          </button>
        </div>
      </div>

      <InputField
        label="Enter Current Password"
        type="password"
        value={form.currentPassword}
        onChange={v => setField("currentPassword", v)}
        placeholder=""
        autoComplete="new-password"
        error={errors.currentPassword}
      />

      {mode === "changeUser" && (
        <InputField
          label="Enter New Email Address"
          type="email"
          value={form.newUsername}
          onChange={v => setField("newUsername", v)}
          placeholder="New email address"
          error={errors.newUsername}
        />
      )}

      {/* ── UPDATED: Reset Password fields with strength indicator ── */}
      {mode === "resetPassword" && (
        <>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Enter New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={form.newPassword}
                onChange={e => setField("newPassword", e.target.value)}
                placeholder="Min. 8 characters"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all pr-10
                  ${errors.newPassword ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-orange-200 focus:border-orange-400"}`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                onClick={() => setShowNewPassword(!showNewPassword)}
                tabIndex={-1}
              >
                {showNewPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
              </button>
            </div>
            {errors.newPassword && <p className="text-red-500 text-xs">{errors.newPassword}</p>}
            {/* Live strength indicator shown while typing */}
            <PasswordStrengthIndicator password={form.newPassword} />
          </div>

          <InputField
            label="Confirm New Password"
            type="password"
            value={form.confirmPassword}
            onChange={v => setField("confirmPassword", v)}
            placeholder="Repeat new password"
            error={errors.confirmPassword}
          />
        </>
      )}

      <WarningBox title="Important Notice">
        <p>For your security, you will only be able to access your account using the email and password you just created. There is <strong>no</strong> &quot;forgot my password&quot; option. If you lose or forget your password, you will permanently lose the ability to access your account.</p>
        <p>The system will continue to function normally and you will still receive check-in emails, but you will <strong>not</strong> be able to change your email address, login credentials, or any other account settings.</p>
      </WarningBox>

      <button onClick={handleSave} disabled={loading} className="bg-orange-400 hover:bg-orange-500 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-colors disabled:bg-gray-400">
        {loading ? "SAVING..." : "CONFIRM AND SAVE"}
      </button>
    </div>
  );
}

// ─── Login Security ───────────────────────────────────────────────────────────

const MOCK_CHECKIN_EMAIL = "john.doe@email.com";

function LoginSecurityContent({ hasTwoFA }: { hasTwoFA: boolean }) {
  const [twoFAEnabled, setTwoFAEnabled] = useState(hasTwoFA);
  const [twoFAEmail, setTwoFAEmail] = useState(hasTwoFA ? MOCK_CHECKIN_EMAIL : "");
  const [saved, setSaved] = useState(false);

  if (!hasTwoFA) {
    return (
      <div className="text-sm space-y-4">
        <p className="text-gray-600 leading-relaxed">
          You have not purchased two-factor authentication (2FA).<br />
          To do so please select <strong>Additional Services</strong> and select Two-Factor Authentication (2FA).
        </p>
      </div>
    );
  }

  return (
    <div className="text-sm space-y-4">
      {saved && (
        <div className="bg-green-50 border border-green-300 text-green-700 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
          <span>✓</span> 2FA email saved successfully.
        </div>
      )}

      <p className="text-gray-600 leading-relaxed">
        You have purchased two factor authentication (2FA). This will provide you a code each time you login to the I Was Killed For This Information interface.
      </p>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
          2FA Email Address
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="email"
            value={twoFAEmail}
            onChange={e => setTwoFAEmail(e.target.value)}
            placeholder="Enter email for 2FA codes"
            required
            className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all flex-1 min-w-64"
          />
          <button
            onClick={() => { if (twoFAEmail.trim()) { setSaved(true); setTimeout(() => setSaved(false), 3000); } }}
            className="bg-orange-400 hover:bg-orange-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors"
          >
            SAVE
          </button>
          <button
            onClick={() => setTwoFAEnabled(true)}
            className={`text-xs font-bold px-5 py-2.5 rounded-lg transition-colors ${twoFAEnabled ? "bg-green-500 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            ENABLE 2FA
          </button>
          <button
            onClick={() => setTwoFAEnabled(false)}
            className={`text-xs font-bold px-5 py-2.5 rounded-lg transition-colors ${!twoFAEnabled ? "bg-gray-500 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            DISABLE 2FA
          </button>
        </div>
      </div>

      <WarningBox title="Important Notice About Your 2FA Email">
        <p>If you forget or lose access to the two factor authentication (2FA) email address you entered, you will permanently lose access to your &quot;I Was Killed For This Information&quot; account and your information will be released.</p>
      </WarningBox>
    </div>
  );
}

// ─── Subscription (Accounting summary) ───────────────────────────────────────

function SubscriptionRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3 border-b border-gray-100 last:border-b-0 min-h-[72px]">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <div className="text-sm font-bold text-gray-900">{value}</div>
    </div>
  );
}

function isWithinThreeMonthsOfExpiry(activeUntil: string): boolean {
  const parsed = Date.parse(activeUntil);
  if (isNaN(parsed)) return false;
  const expiry = parsed;
  const threeMonthsMs = 90 * 24 * 60 * 60 * 1000;
  return expiry - Date.now() <= threeMonthsMs && expiry > Date.now();
}

interface SubscriptionContentProps {
  services: Array<{ name: string; additional_info: string; active_until: string; is_purchased: boolean }>;
  billing: Array<{ id?: number; date: string; description: string; amount: string; is_included?: boolean }>;
  startedDate: string;
  storageUsedGB: number;
  storageTotalGB: number;
  onRenew: (names: string[]) => Promise<void>;
}

function SubscriptionContent({ services, billing, startedDate, storageUsedGB, storageTotalGB, onRenew }: SubscriptionContentProps) {
  const [renewSuccess, setRenewSuccess] = useState(false);
  const [renewing, setRenewing] = useState<string | null>(null);

  const purchasedServices = services.filter((s) => s.is_purchased);

  const handleRenewSingle = async (name: string) => {
    setRenewing(name);
    try {
      await onRenew([name]);
      setRenewSuccess(true);
      setTimeout(() => setRenewSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setRenewing(null);
    }
  };

  const getPrice = (name: string) => {
    if (name === "I Was Killed For This Information") return "$91.00";
    if (name === "Additional Storage") return "$15.00+"; 
    if (name === "Two-Factor Authentication") return "$39.00";
    if (name === "Private Email") return "$39.00";
    if (name === "Press Release") return "$250.00+";
    return "—";
  };
  
  const getLabel = (s: any) => {
    if (s.name === "I Was Killed For This Information") return s.additional_info ? `${s.additional_info.replace(" Check-in", "")} Check-In` : "Main Check-In Plan";
    if (s.name === "Additional Storage") return `Extra Storage (${s.additional_info})`;
    if (s.name === "Press Release") return `Press Release (${s.additional_info})`;
    return s.name;
  };

  return (
    <div className="space-y-4">
      {renewSuccess && (
        <div className="bg-green-50 border border-green-300 text-green-700 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
          <span>✓</span> Service renewed successfully.
        </div>
      )}

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-blue-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest">Active Subscriptions</h3>
          <span className="text-xs text-blue-600 font-medium">Storage Used: {storageUsedGB} GB / {storageTotalGB} GB</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Service</th>
                <th className="px-5 py-3 font-semibold">Start Date</th>
                <th className="px-5 py-3 font-semibold">End Date</th>
                <th className="px-5 py-3 font-semibold">Price/Yr</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {purchasedServices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                    No active subscriptions found.
                  </td>
                </tr>
              ) : (
                purchasedServices.map((s, i) => {
                  const isExpiringSoon = isWithinThreeMonthsOfExpiry(s.active_until);
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-gray-900 font-medium">{getLabel(s)}</td>
                      <td className="px-5 py-4 text-gray-600">{startedDate}</td>
                      <td className="px-5 py-4">
                        <span className={`font-medium ${isExpiringSoon ? "text-orange-600" : "text-gray-900"}`}>
                          {s.active_until}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{getPrice(s.name)}</td>
                      <td className="px-5 py-4 text-right">
                        {isExpiringSoon ? (
                          <button
                            onClick={() => handleRenewSingle(s.name)}
                            disabled={renewing === s.name}
                            className="bg-orange-400 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded transition-colors"
                          >
                            {renewing === s.name ? "RENEWING..." : "RENEW"}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ActiveServicesContent({
  services,
  billing,
  onRenew,
  startedDate,
  storageUsedGB,
  storageTotalGB,
}: {
  services: Array<{ name: string; additional_info: string; active_until: string; is_purchased: boolean }>;
  billing: Array<{ id?: number; date: string; description: string; amount: string; is_included?: boolean }>;
  onRenew: (names: string[]) => Promise<void>;
  startedDate: string;
  storageUsedGB: number;
  storageTotalGB: number;
}) {
  return <SubscriptionContent services={services} billing={billing} startedDate={startedDate} storageUsedGB={storageUsedGB} storageTotalGB={storageTotalGB} onRenew={onRenew} />;
}

// ─── Additional Services (formerly New Orders) ───────────────────────────────
interface NewOrdersContentProps {
  addonsList: Array<{ key: string; label: string; description: string; price: number }>;
  pressOptionsList: Array<{ key: string; label: string; description: string; price: number }>;
  purchasedServices: Array<{ name: string; is_purchased: boolean }>;
  onSuccess?: () => void;
}

function NewOrdersContent({ addonsList, pressOptionsList, purchasedServices, onSuccess }: NewOrdersContentProps) {
  const [step, setStep] = useState<NewOrderStep>("addons");
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [deliveryChoice, setDeliveryChoice] = useState<"trusted" | "press" | "">("");
  const [pressRelease, setPressRelease] = useState<{
    sendToRecipients: boolean;
    pressOption: string;
    category: string;
  }>({
    sendToRecipients: true,
    pressOption: "",
    category: "",
  });
  const [payment, setPayment] = useState<NewOrderPayment>({ extraStorageGB: 3, checkInService: "", checkInTerm: "" });

  const isPrivateEmailPurchased = purchasedServices.some((s) => s.name === "Private Email" && s.is_purchased);
  const is2FAPurchased = purchasedServices.some((s) => s.name === "Two-Factor Authentication" && s.is_purchased);

  const baseAddonsList = addonsList && addonsList.length > 0 ? addonsList : [
    { key: "private_email", label: "Private - Check In Email address", description: "", price: 39 },
    { key: "2fa", label: "Secured Login - Two-Factor Authentication (2FA)", description: "", price: 39 },
    { key: "extra_storage", label: "Additional Storage", description: "Add extra vault storage ($15/GB/year)", price: 15 },
  ];

  const finalAddonsList = baseAddonsList.filter((addon) => {
    if (addon.key === "private_email" && isPrivateEmailPurchased) return false;
    if (addon.key === "2fa" && is2FAPurchased) return false;
    if (addon.key === "extra_storage") return true;
    return true;
  });

  const finalPressOptions = pressOptionsList && pressOptionsList.length > 0 ? pressOptionsList : [
    { key: "press_release_250", label: "250 media organizations", description: "", price: 250 },
    { key: "press_release_500", label: "500 media organizations", description: "", price: 495 },
    { key: "press_release_1000", label: "1,000+ media organizations", description: "", price: 695 }
  ];

  // Calculate pricing dynamically
  const addonsTotal = finalAddonsList
    .filter(a => selectedAddons[a.key])
    .reduce((sum, a) => sum + a.price, 0);

  const pressTotal = deliveryChoice === "press"
    ? (finalPressOptions.find(p => p.key === pressRelease.pressOption)?.price ?? 0)
    : 0;

  const storageTotal = payment.extraStorageGB * 15;
  const checkInTotal = (payment.checkInService && payment.checkInTerm ? 91 : 0);
  const total = addonsTotal + pressTotal + storageTotal + checkInTotal;

  const handlePayNow = async () => {
    try {
      const orderItems: Array<{ label: string; price: number }> = [];
      const purchaseServices: string[] = [];

      // Add selected addons
      finalAddonsList.forEach(a => {
        if (selectedAddons[a.key]) {
          orderItems.push({ label: a.label, price: a.price });
          if (a.key === "private_email") {
            purchaseServices.push("Private Email");
          } else if (a.key === "2fa") {
            purchaseServices.push("Two-Factor Authentication");
          } else {
            purchaseServices.push(a.label);
          }
        }
      });

      // Add press option
      if (deliveryChoice === "press" && pressRelease.pressOption) {
        const selectedPress = finalPressOptions.find(p => p.key === pressRelease.pressOption);
        if (selectedPress) {
          orderItems.push({ label: selectedPress.label, price: selectedPress.price });
          purchaseServices.push("Press Release");
        }
      }

      // Add storage
      if (payment.extraStorageGB > 0) {
        orderItems.push({ label: `Additional Storage (${payment.extraStorageGB} GB)`, price: storageTotal });
      }

      // Add check-in plan
      if (payment.checkInService && payment.checkInTerm) {
        orderItems.push({ label: `${payment.checkInService} (${payment.checkInTerm})`, price: checkInTotal });
      }

      if (orderItems.length === 0) {
        Swal.fire({
          title: "Empty Order",
          text: "Please select at least one service or add extra storage before paying.",
          icon: "warning"
        });
        return;
      }

      localStorage.setItem("checkout_amount", total.toString());
      localStorage.setItem("checkout_order_items", JSON.stringify(orderItems));
      localStorage.setItem(
        "checkout_metadata",
        JSON.stringify({
          type: "setup_accounting_purchase",
          purchase_services: purchaseServices,
          extra_storage_gb: payment.extraStorageGB > 0 ? payment.extraStorageGB : undefined,
          check_in_service: payment.checkInService || undefined,
          press_option: deliveryChoice === "press" ? pressRelease.pressOption : undefined
        })
      );

      window.location.href = "/payment";
    } catch (err) {
      console.error("Initiating payment failed", err);
      Swal.fire({
        title: "Order Failed",
        text: "Failed to initiate checkout. Please try again.",
        icon: "error"
      });
    }
  };

  if (step === "addons") {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-xs text-gray-500 mb-2">Select additional services you have not yet purchased:</p>
        {finalAddonsList.length === 0 ? (
          <p className="text-sm text-gray-600">All available add-on services are already active on your account.</p>
        ) : (
          finalAddonsList.map((addon) => (
          <div
            key={addon.key}
            className={`border rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 transition-colors cursor-pointer
              ${selectedAddons[addon.key] ? "border-green-400 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
            onClick={() => setSelectedAddons(p => ({ ...p, [addon.key]: !p[addon.key] }))}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <input
                type="checkbox"
                checked={!!selectedAddons[addon.key]}
                onChange={() => setSelectedAddons(p => ({ ...p, [addon.key]: !p[addon.key] }))}
                onClick={e => e.stopPropagation()}
                className="w-4 h-4 accent-green-500 shrink-0 cursor-pointer"
              />
              <span className={`font-medium ${selectedAddons[addon.key] ? "text-green-800" : "text-gray-800"}`}>{addon.label}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
              <span className="text-red-500 font-bold text-sm">${addon.price} / year</span>
              <button
                onClick={() => setSelectedAddons(p => ({ ...p, [addon.key]: !p[addon.key] }))}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${selectedAddons[addon.key] ? "bg-red-500 hover:bg-red-400 text-white" : "bg-green-500 hover:bg-green-400 text-white"}`}
              >
                {selectedAddons[addon.key] ? "REMOVE" : "ADD"}
              </button>
            </div>
          </div>
        ))
        )}
        <div className="flex justify-end pt-2">
          <button onClick={() => setStep("payment")} className="bg-green-500 hover:bg-green-400 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-colors">
            CONTINUE →
          </button>
        </div>
      </div>
    );
  }

  if (step === "delivery") {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Select Delivery Method</p>
        <p className="text-gray-600 leading-relaxed text-sm">Choose how your information will be delivered when a check-in is missed:</p>

        <div className="space-y-3">
          <div
            onClick={() => setDeliveryChoice("trusted")}
            className={`border rounded-lg p-4 flex items-start gap-3 cursor-pointer transition-colors
              ${deliveryChoice === "trusted" ? "border-green-400 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
          >
            <input
              type="radio"
              name="deliveryChoice"
              checked={deliveryChoice === "trusted"}
              onChange={() => setDeliveryChoice("trusted")}
              className="w-4 h-4 accent-green-500 mt-0.5 shrink-0"
            />
            <div>
              <p className="font-semibold text-gray-800">Send to Trusted Recipients</p>
              <p className="text-xs text-gray-500 mt-0.5">Your information will be sent directly to your pre-configured trusted recipients.</p>
            </div>
          </div>

          <div
            onClick={() => setDeliveryChoice("press")}
            className={`border rounded-lg p-4 flex items-start gap-3 cursor-pointer transition-colors
              ${deliveryChoice === "press" ? "border-green-400 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
          >
            <input
              type="radio"
              name="deliveryChoice"
              checked={deliveryChoice === "press"}
              onChange={() => setDeliveryChoice("press")}
              className="w-4 h-4 accent-green-500 mt-0.5 shrink-0"
            />
            <div>
              <p className="font-semibold text-gray-800">Press Release</p>
              <p className="text-xs text-gray-500 mt-0.5">Your information will be distributed to media organizations via a press release.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-2">
          <button onClick={() => setStep("addons")} className="bg-red-500 hover:bg-red-400 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors">← BACK</button>
          <button
            onClick={() => {
              if (deliveryChoice === "press") setStep("press-release");
              else if (deliveryChoice === "trusted") setStep("payment");
            }}
            disabled={!deliveryChoice}
            className={`text-sm font-bold px-6 py-2.5 rounded-lg transition-colors ${deliveryChoice ? "bg-green-500 hover:bg-green-400 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
          >
            CONTINUE →
          </button>
        </div>
      </div>
    );
  }

  if (step === "press-release") {
    const categoryDisabled = pressRelease.pressOption === "";

    return (
      <div className="space-y-4 text-sm">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Press Release</p>
          <div className="space-y-2">
            {finalPressOptions.map((opt) => (
              <label key={opt.key} className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${pressRelease.pressOption === opt.key ? "border-green-300 bg-green-50" : "border-gray-200 hover:bg-gray-50"}`}>
                <input
                  type="radio"
                  name="pressOption"
                  checked={pressRelease.pressOption === opt.key}
                  onChange={() => setPressRelease(p => ({ ...p, pressOption: opt.key, category: "" }))}
                  className="w-4 h-4 accent-green-500"
                />
                <span className="font-medium text-gray-700">{opt.label} — ${opt.price}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${categoryDisabled ? "text-gray-300" : "text-gray-500"}`}>
            Press Release — Category of Information
          </p>
          <select
            value={pressRelease.category}
            onChange={e => setPressRelease(p => ({ ...p, category: e.target.value }))}
            disabled={categoryDisabled}
            className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all
              ${categoryDisabled
                ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                : "border-gray-200 bg-gray-50 text-gray-600 focus:ring-orange-200 focus:border-orange-400 cursor-pointer"
              }`}
          >
            <option value="">{categoryDisabled ? "Select a press release option first" : "Category of information..."}</option>
            {!categoryDisabled && ["Political Corruption", "Corporate Fraud", "Environmental Crimes", "Human Rights Violations", "Financial Misconduct", "Government Corruption"].map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-between pt-2">
          <button onClick={() => setStep("delivery")} className="bg-red-500 hover:bg-red-400 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors">← BACK</button>
          <button onClick={() => setStep("payment")} className="bg-green-500 hover:bg-green-400 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-colors">CONTINUE →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        Pro-rated charges apply for mid-cycle additional service purchases via PayPal.
      </p>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Add Extra Storage — $15/GB/Year</p>
        <div className="flex items-center gap-3">
          <button onClick={() => setPayment(p => ({ ...p, extraStorageGB: Math.max(0, p.extraStorageGB - 1) }))} className="w-9 h-9 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg text-lg transition-colors">−</button>
          <div className="w-12 h-9 bg-gray-700 flex items-center justify-center text-white font-bold rounded-lg">{payment.extraStorageGB}</div>
          <button onClick={() => setPayment(p => ({ ...p, extraStorageGB: p.extraStorageGB + 1 }))} className="w-9 h-9 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg text-lg transition-colors">+</button>
          <span className="text-blue-500 font-bold">GB</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "Check in Service", field: "checkInService" as const, opts: ["Monthly Check-In", "Quarterly Check-In", "Annual Check-In"], placeholder: "Select Services" },
          { label: "Check in Term - Years", field: "checkInTerm" as const, opts: ["1 Year", "2 Years", "3 Years", "5 Years"], placeholder: "Select Terms" },
        ].map(({ label, field, opts, placeholder }) => (
          <div key={field}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</p>
            <select
              value={payment[field]}
              onChange={e => setPayment(p => ({ ...p, [field]: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            >
              <option value="">{placeholder}</option>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex justify-between bg-gray-100 px-4 py-2.5 border-b border-gray-200">
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Services</span>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Price</span>
        </div>
        {[
          ...finalAddonsList.filter(a => selectedAddons[a.key]).map(a => ({ label: a.label, price: `$${a.price}` })),
          ...(deliveryChoice === "press" && pressRelease.pressOption ? [
            {
              label: finalPressOptions.find(p => p.key === pressRelease.pressOption)?.label ?? "Press Release",
              price: `$${finalPressOptions.find(p => p.key === pressRelease.pressOption)?.price ?? 0}`
            }
          ] : []),
          { label: `Main Service | ${payment.checkInService || "—"}`, price: payment.checkInService ? "$91" : "—" },
          { label: `Additional Storage ${payment.extraStorageGB} GB`, price: `$${payment.extraStorageGB * 15}` },
        ].map((r, i) => (
          <div key={i} className="flex justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 bg-white">
            <span className="text-gray-600 text-sm">{r.label}</span>
            <span className="font-semibold text-sm">{r.price}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button onClick={() => setStep("addons")} className="bg-red-500 hover:bg-red-400 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors">← BACK</button>
        <div className="flex items-center gap-3">
          <div className="bg-green-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg text-center min-w-24">
            <div className="text-green-100 text-xs">Total Price</div>
            <div className="text-lg font-black">${total}</div>
          </div>
          <button
            onClick={handlePayNow}
            className="bg-green-500 hover:bg-green-400 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-colors"
          >
            PAY NOW
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Billing History ──────────────────────────────────────────────────────────

interface BillingHistoryProps {
  billing: Array<{ id?: number; date: string; description: string; amount: string; is_included?: boolean }>;
}

function BillingHistoryContent({ billing }: BillingHistoryProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order #</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction Code</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {billing.map((r, i) => {
              const txId = r.id ? String(r.id).padStart(3, "0") : String(i + 1).padStart(3, "0");
              const ppId = r.id ? String(r.id).padStart(2, "0") : String(i + 1).padStart(2, "0");
              const dateStr = r.date.replace(/\//g, "");
              return (
                <tr key={i} className="bg-white hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 text-gray-700 whitespace-nowrap font-semibold">{r.date}</td>
                  <td className="px-3 py-3 text-gray-600 font-mono text-xs whitespace-nowrap">
                    26-{dateStr}-{txId}
                  </td>
                  <td className="px-3 py-3 text-gray-700 whitespace-nowrap">Credit Card</td>
                  <td className="px-3 py-3 text-gray-700">{r.description}</td>
                  <td className={`px-3 py-3 text-right font-semibold whitespace-nowrap ${r.is_included ? "text-green-600" : "text-gray-800"}`}>
                    {r.is_included ? "Included" : r.amount}
                  </td>
                  <td className="px-3 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">
                    {r.is_included ? "—" : `TXN-${dateStr}${ppId}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">PR = Pro-Rated charges may appear for mid-cycle storage upgrades.</p>
    </div>
  );
}

// ─── Check-In History ─────────────────────────────────────────────────────────

interface CheckInHistoryProps {
  history: Array<{ date: string; time: string; ip: string; login_name: string; device_os: string }>;
}

function CheckInHistoryContent({ history }: CheckInHistoryProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {["Check-In Date", "Check-In Time", "IP #", "Login Name", "Device O/S"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.map((r, i) => (
              <tr key={i} className="bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.date}</td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.time}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs whitespace-nowrap">{r.ip}</td>
                <td className="px-4 py-3 text-blue-600 underline whitespace-nowrap cursor-pointer hover:text-blue-800">{r.login_name}</td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.device_os}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border border-blue-200 bg-blue-50 rounded-lg px-4 py-3 flex items-start gap-2">
        <span className="text-lg shrink-0">🔒</span>
        <div className="text-xs text-gray-700 leading-relaxed">
          <span className="font-bold text-blue-700">Security Note</span><br />
          Your check-in history helps you monitor account activity. If you notice any suspicious login attempts, please change your password immediately and enable 2FA.
        </div>
      </div>
    </div>
  );
}

// ─── Cancel Content ───────────────────────────────────────────────────────────

function CancelContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AnyErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setSubmitted(true);
    const result = cancelSchema.safeParse({ email, password });
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, (v as string[])?.[0]])));
      return;
    }

    const confirmed = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete your account and all data. This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e8281e",
      cancelButtonColor: "#555",
      confirmButtonText: "Yes, delete my account!",
      cancelButtonText: "Cancel",
    });

    if (!confirmed.isConfirmed) return;

    setLoading(true);
    try {
      await api.deleteAccount({ email, password });

      // Clear all auth tokens and local storage
      const { tokenStorage } = await import("@/lib/api");
      tokenStorage.clear();
      localStorage.clear();
      sessionStorage.clear();

      await Swal.fire({
        title: "Account Deleted",
        text: "Your account has been permanently deleted. You will now be redirected.",
        icon: "success",
        timer: 2500,
        showConfirmButton: false,
      });

      // Redirect to landing page
      window.location.href = "/";
    } catch (err: unknown) {
      setLoading(false);
      if (err && typeof err === "object" && "body" in err) {
        const apiErr = err as { body?: { errors?: Record<string, string[] | string> } };
        const fieldErrors = apiErr.body?.errors || {};
        const mapped: AnyErrors = {};
        for (const [key, val] of Object.entries(fieldErrors)) {
          mapped[key] = Array.isArray(val) ? val[0] : String(val);
        }
        if (Object.keys(mapped).length > 0) {
          setErrors(mapped);
          return;
        }
      }
      Swal.fire({
        title: "Error",
        text: err instanceof Error ? err.message : "Failed to delete account. Please try again.",
        icon: "error",
      });
    }
  };

  return (
    <div className="text-sm space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label="Login Email Address" type="email" value={email} onChange={v => { setEmail(v); if (submitted) setErrors(p => ({ ...p, email: undefined })); }} placeholder="your@email.com" error={errors.email} />
        <InputField label="Password" type="password" value={password} onChange={v => { setPassword(v); if (submitted) setErrors(p => ({ ...p, password: undefined })); }} placeholder="••••••••" error={errors.password} />
      </div>

      <div className="border border-red-200 bg-red-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-orange-500">⚠</span>
          <span className="font-bold text-red-600 text-sm">Cancellation Policy</span>
        </div>
        <div className="text-xs text-gray-700 leading-relaxed space-y-2">
          <p>You are about to cancel your subscription. Please review the following terms before proceeding:</p>
          <p><span className="font-bold">Permanent Data Deletion:</span> Upon confirmation, all account data, configurations, and files will be deleted immediately. This action is permanent and cannot be undone.</p>
          <p><span className="font-bold">No Refunds or Credits:</span> You will lose access to all premium features immediately. No refunds or pro-rated credits will be provided for the remaining billing cycle.</p>
        </div>
      </div>

      <button
        onClick={handleCancel}
        disabled={loading}
        className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold py-3.5 rounded-lg transition-colors tracking-wide cursor-pointer"
      >
        {loading ? "DELETING ACCOUNT…" : "CANCEL ALL SERVICES — DELETE MY VAULT"}
      </button>
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────

export default function SetupAccounting({ onRefresh }: { onRefresh?: () => void }) {
  const [data, setData] = useState<{
    config: { id: number; two_fa_enabled: boolean; two_fa_email: string; has_two_fa: boolean };
    services: Array<{ name: string; additional_info: string; active_until: string; is_purchased: boolean }>;
    billing: Array<{ id?: number; date: string; description: string; amount: string; is_included: boolean }>;
    history: Array<{ date: string; time: string; ip: string; login_name: string; device_os: string }>;
    addons?: Array<{ key: string; label: string; description: string; price: number }>;
    press_release_options?: Array<{ key: string; label: string; description: string; price: number }>;
    extra?: { startedDate: string; storageUsedGB: number; storageTotalGB: number };
  } | null>(null);

  const [open, setOpen] = useState<Record<string, boolean>>({
    login: false, loginSecurity: false, activeServices: false,
    newOrders: false, billingHistory: false, checkInHistory: false, cancelServices: false,
  });

  const loadData = async () => {
    try {
      const [setupRes, vaultRes, profileRes] = await Promise.all([
        api.getSetupAccounting(),
        api.getVaultFiles(),
        api.profile()
      ]);
      
      const storageTotalGB = vaultRes.data.storage_config.total_storage_gb || 5;
      const totalSizeMB = vaultRes.data.files.reduce((sum: number, f: any) => sum + parseFloat(f.file_size_mb || "0"), 0);
      const storageUsedGB = parseFloat((totalSizeMB / 1024).toFixed(3));
      
      let startedDate = "-";
      if (profileRes.data.date_joined) {
        try {
          const dateObj = new Date(profileRes.data.date_joined);
          if (!isNaN(dateObj.getTime())) {
            startedDate = `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}/${dateObj.getFullYear()}`;
          }
        } catch (e) {}
      }

      setData({
        ...setupRes.data,
        extra: {
          startedDate,
          storageUsedGB,
          storageTotalGB
        }
      });
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to load setup and accounting data", err);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const toggle = (key: string) => setOpen(p => ({ ...p, [key]: !p[key] }));

  const handleUpdate2FA = async (enabled: boolean, emailVal?: string) => {
    try {
      const res = await api.updateSetupAccounting({
        two_fa_enabled: enabled,
        two_fa_email: emailVal,
      });
      setData(res.data);
      if (onRefresh) {
        onRefresh();
      }
      return true;
    } catch (err) {
      console.error("Failed to update 2FA", err);
      return false;
    }
  };

  const handlePurchaseService = async (serviceName: string) => {
    try {
      const res = await api.updateSetupAccounting({
        purchase_service: serviceName,
      });
      setData(res.data);
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to purchase service", err);
    }
  };

  const handleRenewServices = async (serviceNames: string[]) => {
    try {
      const res = await api.updateSetupAccounting({
        renew_services: serviceNames,
      });
      setData(res.data);
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to renew services", err);
    }
  };

  if (!data) {
    return (
      <div className="p-4 lg:px-16 py-6 text-black flex items-center justify-center container mx-auto max-w-6xl min-h-[300px]">
        <span className="inline-block h-10 w-10 rounded-full border-4 border-gray-200 border-t-[#EF3832] animate-spin" />
      </div>
    );
  }

  const hasTwoFA = data.config.has_two_fa;
  const twoFAEnabled = data.config.two_fa_enabled;
  const twoFAEmail = data.config.two_fa_email || "";

  const twoFABadge = !hasTwoFA
    ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-300">NOT PURCHASED</span>
    : !twoFAEmail.trim()
      ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300">NOT CONFIGURED</span>
      : twoFAEnabled
        ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300">ENABLED</span>
        : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-300">DISABLED</span>;

  return (
    <div className="p-4 lg:px-16 py-6 text-black space-y-5 container mx-auto max-w-6xl">

      {/* ── Page Header ── */}
      <div>
        <h1 className="block text-[2rem] md:text-[4rem] lg:text-[2rem] uppercase leading-none tracking-wide mt-4"
          style={{ fontFamily: "var(--font-anton)", fontWeight: 300 }}>Setup &amp; Accounting</h1>
        <p className="text-sm text-gray-400 mt-4">Manage your login, billing, and account settings</p>
      </div>

      {/* ── SETUP ── */}
      <SectionWrapper>
        <SectionHeader title="Setup" />
        <AccordionRow label="Login" expanded={open.login} onToggle={() => toggle("login")} />
        {open.login && <AccordionContent><LoginContent userEmail={data.config.two_fa_email || "user@example.com"} onSuccess={loadData} /></AccordionContent>}

        <AccordionRow
          label="Login Security (2FA)"
          expanded={open.loginSecurity}
          onToggle={() => { if (hasTwoFA) toggle("loginSecurity"); }}
          statusBadge={twoFABadge}
          disabled={!hasTwoFA}
        />
        {open.loginSecurity && hasTwoFA && (
          <AccordionContent>
            <LoginSecurityContentWithCallback
              hasTwoFA={hasTwoFA}
              twoFAEnabled={twoFAEnabled}
              initialEmail={data.config.two_fa_email || ""}
              onUpdate={handleUpdate2FA}
            />
          </AccordionContent>
        )}
      </SectionWrapper>

      {/* ── ACCOUNTING ── */}
      <SectionWrapper>
        <SectionHeader title="Accounting" />
        <AccordionRow label="Subscription" expanded={open.activeServices} onToggle={() => toggle("activeServices")} />
        {open.activeServices && (
          <AccordionContent>
            <ActiveServicesContent
              services={data.services}
              billing={data.billing}
              startedDate={data.extra?.startedDate || "-"}
              storageUsedGB={data.extra?.storageUsedGB || 0}
              storageTotalGB={data.extra?.storageTotalGB || 5}
              onRenew={handleRenewServices}
            />
          </AccordionContent>
        )}
        <AccordionRow label="Additional Services" expanded={open.newOrders} onToggle={() => toggle("newOrders")} />
        {open.newOrders && (
          <AccordionContent>
            <NewOrdersContent
              addonsList={data.addons || []}
              pressOptionsList={data.press_release_options || []}
              purchasedServices={data.services}
              onSuccess={loadData}
            />
          </AccordionContent>
        )}
        <AccordionRow label="Billing History" expanded={open.billingHistory} onToggle={() => toggle("billingHistory")} />
        {open.billingHistory && <AccordionContent><BillingHistoryContent billing={data.billing} /></AccordionContent>}
      </SectionWrapper>

      {/* ── CHECK-IN HISTORY ── */}
      <SectionWrapper>
        <SectionHeader title="Check-In History" />
        <AccordionRow label="View" expanded={open.checkInHistory} onToggle={() => toggle("checkInHistory")} />
        {open.checkInHistory && <AccordionContent><CheckInHistoryContent history={data.history} /></AccordionContent>}
      </SectionWrapper>

      {/* ── CANCEL ── */}
      <SectionWrapper isCancel>
        <SectionHeader title="Cancel" isCancel />
        <AccordionRow label="Cancel All Services" expanded={open.cancelServices} onToggle={() => toggle("cancelServices")} />
        {open.cancelServices && <AccordionContent><CancelContent /></AccordionContent>}
      </SectionWrapper>

    </div>
  );
}

// ─── LoginSecurityContent with callback for badge sync ────────────────────────

interface LoginSecurityProps {
  hasTwoFA: boolean;
  twoFAEnabled: boolean;
  initialEmail: string;
  onUpdate: (enabled: boolean, email?: string) => Promise<boolean>;
}

function LoginSecurityContentWithCallback({
  hasTwoFA,
  twoFAEnabled,
  initialEmail,
  onUpdate,
}: LoginSecurityProps) {
  const [twoFAEmail, setTwoFAEmail] = useState(initialEmail);
  const [saved, setSaved] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [localEnabled, setLocalEnabled] = useState(twoFAEnabled);

  useEffect(() => {
    setTwoFAEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    setLocalEnabled(twoFAEnabled);
  }, [twoFAEnabled]);

  const statusLabel = !hasTwoFA
    ? "Not Purchased"
    : !twoFAEmail.trim()
      ? "Not Configured"
      : localEnabled
        ? "Enabled"
        : "Disabled";

  const statusClass = !hasTwoFA
    ? "bg-red-100 text-red-600 border-red-300"
    : !twoFAEmail.trim()
      ? "bg-orange-100 text-orange-700 border-orange-300"
      : localEnabled
        ? "bg-green-100 text-green-700 border-green-300"
        : "bg-gray-100 text-gray-600 border-gray-300";

  if (!hasTwoFA) {
    return (
      <div className="text-sm space-y-4">
        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border ${statusClass}`}>{statusLabel}</span>
        <p className="text-gray-600 leading-relaxed">
          You have not purchased two-factor authentication (2FA).<br />
          To do so please select <strong>Additional Services</strong> and select Two-Factor Authentication (2FA).
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    if (twoFAEmail.trim()) {
      const ok = await onUpdate(localEnabled, twoFAEmail);
      if (ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    }
  };

  const handleTestEmail = () => {
    if (!twoFAEmail.trim()) return;
    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);
  };

  return (
    <div className="text-sm space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status:</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusClass}`}>{statusLabel}</span>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-300 text-green-700 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
          <span>✓</span> 2FA email saved successfully.
        </div>
      )}
      {testSent && (
        <div className="bg-blue-50 border border-blue-300 text-blue-800 text-xs px-4 py-2.5 rounded-lg">
          Test 2FA email sent to {twoFAEmail}.
        </div>
      )}

      <p className="text-gray-600 leading-relaxed">
        Two-factor authentication (2FA) protects both your <strong>login to this website</strong> and your <strong>check-in</strong>.
        A verification code will be sent to your 2FA email address each time.
      </p>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
          2FA Email Address
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="email"
            value={twoFAEmail}
            onChange={e => setTwoFAEmail(e.target.value)}
            placeholder="Enter email for 2FA codes"
            required
            className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all flex-1 min-w-64"
          />
          <button
            onClick={handleSave}
            className="bg-orange-400 hover:bg-orange-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            SAVE
          </button>
          <button
            onClick={handleTestEmail}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            TEST EMAIL
          </button>
          <button
            onClick={async () => { const ok = await onUpdate(true, twoFAEmail); if (ok) setLocalEnabled(true); }}
            disabled={!twoFAEmail.trim()}
            className={`text-xs font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${localEnabled ? "bg-green-500 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            ENABLE 2FA
          </button>
          <button
            onClick={async () => { const ok = await onUpdate(false, twoFAEmail); if (ok) setLocalEnabled(false); }}
            className={`text-xs font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer ${!localEnabled ? "bg-gray-500 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            DISABLE 2FA
          </button>
        </div>
      </div>

      <WarningBox title="Important Notice About Your 2FA Email">
        <p>If you forget or lose access to the two factor authentication (2FA) email address you entered, you will permanently lose access to your &quot;I Was Killed For This Information&quot; account and your information will be released.</p>
      </WarningBox>
    </div>
  );
}