// Tab 7 — Setup & Accounting

import { useState } from "react";
import { MdOutlineKeyboardArrowDown, MdOutlineKeyboardArrowUp } from "react-icons/md";
import Swal from "sweetalert2";
import { z } from "zod";

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

function InputField({ label, type, value, onChange, placeholder, error }: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all
          ${error ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-orange-200 focus:border-orange-400"}`}
      />
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

function LoginContent({ userEmail }: { userEmail: string }) {
  type LoginMode = "changeUser" | "resetPassword";
  const [mode, setMode] = useState<LoginMode>("changeUser");
  const [form, setForm] = useState({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<AnyErrors>({});
  const [success, setSuccess] = useState("");
  const setField = (key: string, val: string) => { setForm(p => ({ ...p, [key]: val })); setErrors(p => ({ ...p, [key]: undefined })); };

  const handleSave = () => {
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
    setForm({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" });
    setSuccess(mode === "changeUser" ? "Email updated successfully." : "Password updated successfully.");
    setTimeout(() => setSuccess(""), 3000);
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
        placeholder="••••••••"
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
            <input
              type="password"
              value={form.newPassword}
              onChange={e => setField("newPassword", e.target.value)}
              placeholder="Min. 8 characters"
              className={`w-full border rounded-lg px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all
                ${errors.newPassword ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-orange-200 focus:border-orange-400"}`}
            />
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

      <button onClick={handleSave} className="bg-orange-400 hover:bg-orange-500 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-colors">
        CONFIRM AND SAVE
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
          To do so please select <strong>New Orders</strong> and select Two-Factor Authentication (2FA).
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

// ─── Active Services ──────────────────────────────────────────────────────────

function ActiveServicesContent() {
  const [services, setServices] = useState(ACTIVE_SERVICES.map(s => ({ ...s, renew: false })));
  const [renewSuccess, setRenewSuccess] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const handlePurchaseNow = (serviceName: string) => {
    setServices(prev => prev.map(s => s.name === serviceName ? { ...s, isPurchased: true, activeUntil: "March 7, 2027" } : s));
    setPurchaseSuccess(serviceName);
    setTimeout(() => setPurchaseSuccess(null), 3000);
  };

  const handleRenewSelected = () => {
    const selected = services.filter(s => s.renew);
    if (selected.length === 0) return;
    setServices(prev => prev.map(s => s.renew ? { ...s, renew: false, activeUntil: "March 7, 2028" } : s));
    setRenewSuccess(true);
    setTimeout(() => setRenewSuccess(false), 3000);
  };

  return (
    <div className="space-y-4">
      {renewSuccess && (
        <div className="bg-green-50 border border-green-300 text-green-700 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
          <span>✓</span> Selected services have been renewed successfully.
        </div>
      )}
      {purchaseSuccess && (
        <div className="bg-green-50 border border-green-300 text-green-700 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2">
          <span>✓</span> &quot;{purchaseSuccess}&quot; has been purchased successfully.
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Additional Information</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Active Until</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Renew</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {services.map((s, i) => (
              <tr key={i} className={`transition-colors ${s.isPurchased ? "bg-green-50/40 hover:bg-green-50" : "bg-red-50/40 hover:bg-red-50"}`}>
                <td className="px-2 py-3 font-semibold text-gray-800 text-sm">{s.name}</td>
                <td className="px-2 py-3 text-gray-500 text-sm hidden sm:table-cell">{s.additionalInfo}</td>
                <td className="px-2 py-3 text-sm">
                  {s.isPurchased
                    ? <span className="text-gray-700">{s.activeUntil}</span>
                    : <span className="border border-red-400 text-red-500 text-xs font-bold rounded-full px-2 py-0.5">NOT PURCHASED</span>
                  }
                </td>
                <td className="px-4 py-3 text-center">
                  {s.isPurchased
                    ? (
                      <input
                        type="checkbox"
                        checked={s.renew}
                        onChange={e => setServices(prev => prev.map((x, j) => j === i ? { ...x, renew: e.target.checked } : x))}
                        className="w-4 h-4 accent-orange-400 cursor-pointer"
                      />
                    )
                    : (
                      <button
                        onClick={() => handlePurchaseNow(s.name)}
                        className="bg-red-500 hover:bg-red-400 text-white text-xs font-bold px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        PURCHASE NOW
                      </button>
                    )
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">*Press Release is a one-time service deployed only when the check-in is missed. It&apos;s valid until the last day of an active service agreement or deployment, whichever comes first.</p>
      <button
        onClick={handleRenewSelected}
        className="bg-orange-400 hover:bg-orange-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors"
      >
        RENEW SELECTED
      </button>
    </div>
  );
}

// ─── New Orders ───────────────────────────────────────────────────────────────

function NewOrdersContent() {
  const [step, setStep] = useState<NewOrderStep>("addons");
  const [addons, setAddons] = useState<NewOrderAddons>({ privateEmail: false, twoFA: false });
  const [deliveryChoice, setDeliveryChoice] = useState<"trusted" | "press" | "">("");
  const [pressRelease, setPressRelease] = useState<NewOrderPressRelease>({
    sendToRecipients: true, pressOption: "", category: "",
  });
  const [payment, setPayment] = useState<NewOrderPayment>({ extraStorageGB: 3, checkInService: "", checkInTerm: "" });
  const [orderSuccess, setOrderSuccess] = useState(false);

  if (step === "addons") {
    return (
      <div className="space-y-3 text-sm">
        {[
          { key: "privateEmail" as const, title: "Private - Check In Email address", price: "$39 / year" },
          { key: "twoFA" as const, title: "Secured Login - Two-Factor Authentication (2FA)", price: "$39 / year" },
        ].map(({ key, title, price }) => (
          <div
            key={key}
            className={`border rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 transition-colors cursor-pointer
              ${addons[key] ? "border-green-400 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
            onClick={() => setAddons(p => ({ ...p, [key]: !p[key] }))}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <input
                type="checkbox"
                checked={addons[key]}
                onChange={() => setAddons(p => ({ ...p, [key]: !p[key] }))}
                onClick={e => e.stopPropagation()}
                className="w-4 h-4 accent-green-500 shrink-0 cursor-pointer"
              />
              <span className={`font-medium ${addons[key] ? "text-green-800" : "text-gray-800"}`}>{title}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
              <span className="text-red-500 font-bold text-sm">{price}</span>
              <button
                onClick={() => setAddons(p => ({ ...p, [key]: !p[key] }))}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${addons[key] ? "bg-red-500 hover:bg-red-400 text-white" : "bg-green-500 hover:bg-green-400 text-white"}`}
              >
                {addons[key] ? "REMOVE" : "ADD"}
              </button>
            </div>
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <button onClick={() => setStep("delivery")} className="bg-green-500 hover:bg-green-400 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-colors">
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
            {([
              { key: "press100" as const, label: "100 media organizations — $110" },
              { key: "press250" as const, label: "250 media organizations — $250" },
              { key: "press500" as const, label: "500 media organizations — $495" },
            ]).map(({ key, label }) => (
              <label key={key} className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${pressRelease.pressOption === key ? "border-green-300 bg-green-50" : "border-gray-200 hover:bg-gray-50"}`}>
                <input
                  type="radio"
                  name="pressOption"
                  checked={pressRelease.pressOption === key}
                  onChange={() => setPressRelease(p => ({ ...p, pressOption: key, category: "" }))}
                  className="w-4 h-4 accent-green-500"
                />
                <span className="font-medium text-gray-700">{label}</span>
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

  const total = (payment.checkInService && payment.checkInTerm ? 91 : 0) + payment.extraStorageGB * 15;

  if (orderSuccess) {
    return (
      <div className="text-sm space-y-4">
        <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-4 rounded-lg flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <p className="font-bold">Order Placed Successfully!</p>
            <p className="text-xs text-green-600 mt-0.5">Your order has been submitted. You will receive a confirmation email shortly.</p>
          </div>
        </div>
        <button onClick={() => { setStep("addons"); setOrderSuccess(false); setAddons({ privateEmail: false, twoFA: false }); setDeliveryChoice(""); setPayment({ extraStorageGB: 3, checkInService: "", checkInTerm: "" }); }}
          className="bg-orange-400 hover:bg-orange-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors">
          PLACE ANOTHER ORDER
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
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
        <button onClick={() => setStep(deliveryChoice === "press" ? "press-release" : "delivery")} className="bg-red-500 hover:bg-red-400 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors">← BACK</button>
        <div className="flex items-center gap-3">
          <div className="bg-green-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg text-center min-w-24">
            <div className="text-green-100 text-xs">Total Price</div>
            <div className="text-lg font-black">${total}</div>
          </div>
          <button
            onClick={() => setOrderSuccess(true)}
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

function BillingHistoryContent() {
  return (
    <div className="space-y-4">
      <div className="border border-blue-200 bg-blue-50 rounded-lg px-4 py-3 flex items-start gap-2">
        <span className="text-lg shrink-0">ℹ️</span>
        <div className="text-xs text-gray-700 leading-relaxed">
          <span className="font-bold text-blue-700">Phase 3 — Billing data will be connected to live payment records in a future phase.</span><br />
          The data below is placeholder information for layout and design review only.
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date — Description</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {BILLING_RECORDS.map((r, i) => (
              <tr key={i} className="bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-700">
                  <span className="font-semibold">{r.date}</span> — {r.description}
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${r.isIncluded ? "text-green-600" : "text-gray-800"}`}>
                  {r.isIncluded ? "Included" : r.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Check-In History ─────────────────────────────────────────────────────────

function CheckInHistoryContent() {
  return (
    <div className="space-y-4">
      <div className="border border-blue-200 bg-blue-50 rounded-lg px-4 py-3 flex items-start gap-2">
        <span className="text-lg shrink-0">ℹ️</span>
        <div className="text-xs text-gray-700 leading-relaxed">
          <span className="font-bold text-blue-700">Phase 3 — Check-in history will be connected to live account data in a future phase.</span><br />
          The records below are placeholder data for layout and design review only.
        </div>
      </div>
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
            {CHECKIN_HISTORY.map((r, i) => (
              <tr key={i} className="bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.date}</td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.time}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs whitespace-nowrap">{r.ip}</td>
                <td className="px-4 py-3 text-blue-600 underline whitespace-nowrap cursor-pointer hover:text-blue-800">{r.loginName}</td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.deviceOS}</td>
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

  const handleCancel = () => {
    setSubmitted(true);
    const result = cancelSchema.safeParse({ email, password });
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, (v as string[])?.[0]])));
      return;
    }

    Swal.fire({
      title: "Are you sure?",
      text: "Account cancellation submitted. All data will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) Swal.fire({
        title: "Account Cancelled",
        text: "Your account has been permanently deleted.",
        icon: "success"
      });
    });
  };

  return (
    <div className="text-sm space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label="Email Address" type="email" value={email} onChange={v => { setEmail(v); if (submitted) setErrors(p => ({ ...p, email: undefined })); }} placeholder="your@email.com" error={errors.email} />
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
        className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-3.5 rounded-lg transition-colors tracking-wide cursor-pointer"
      >
        CANCEL ALL SERVICES — DELETE MY VAULT
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SetupAccounting() {
  const MOCK_USER_EMAIL = "user@example.com";
  const MOCK_HAS_2FA = true;
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);

  const [open, setOpen] = useState<Record<string, boolean>>({
    login: false, loginSecurity: false, activeServices: false,
    newOrders: false, billingHistory: false, checkInHistory: false, cancelServices: false,
  });
  const toggle = (key: string) => setOpen(p => ({ ...p, [key]: !p[key] }));

  const twoFABadge = !MOCK_HAS_2FA
    ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-300">NOT PURCHASED</span>
    : twoFAEnabled
      ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300">ENABLED</span>
      : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-300">DISABLED</span>;

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
        {open.login && <AccordionContent><LoginContent userEmail={MOCK_USER_EMAIL} /></AccordionContent>}

        <AccordionRow
          label="Login Security (2FA)"
          expanded={open.loginSecurity}
          onToggle={() => { if (MOCK_HAS_2FA) toggle("loginSecurity"); }}
          statusBadge={twoFABadge}
          disabled={!MOCK_HAS_2FA}
        />
        {open.loginSecurity && MOCK_HAS_2FA && (
          <AccordionContent>
            <LoginSecurityContentWithCallback
              hasTwoFA={MOCK_HAS_2FA}
              onToggle={(val: boolean) => setTwoFAEnabled(val)}
              twoFAEnabled={twoFAEnabled}
            />
          </AccordionContent>
        )}
      </SectionWrapper>

      {/* ── ACCOUNTING ── */}
      <SectionWrapper>
        <SectionHeader title="Accounting" />
        <AccordionRow label="Active Services" expanded={open.activeServices} onToggle={() => toggle("activeServices")} />
        {open.activeServices && <AccordionContent><ActiveServicesContent /></AccordionContent>}
        <AccordionRow label="New Orders" expanded={open.newOrders} onToggle={() => toggle("newOrders")} />
        {open.newOrders && <AccordionContent><NewOrdersContent /></AccordionContent>}
        <AccordionRow label="Billing History" expanded={open.billingHistory} onToggle={() => toggle("billingHistory")} />
        {open.billingHistory && <AccordionContent><BillingHistoryContent /></AccordionContent>}
      </SectionWrapper>

      {/* ── CHECK-IN HISTORY ── */}
      <SectionWrapper>
        <SectionHeader title="Check-In History" />
        <AccordionRow label="View" expanded={open.checkInHistory} onToggle={() => toggle("checkInHistory")} />
        {open.checkInHistory && <AccordionContent><CheckInHistoryContent /></AccordionContent>}
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

function LoginSecurityContentWithCallback({
  hasTwoFA,
  onToggle,
  twoFAEnabled,
}: {
  hasTwoFA: boolean;
  onToggle: (val: boolean) => void;
  twoFAEnabled: boolean;
}) {
  const [twoFAEmail, setTwoFAEmail] = useState(hasTwoFA ? MOCK_CHECKIN_EMAIL : "");
  const [saved, setSaved] = useState(false);

  if (!hasTwoFA) {
    return (
      <div className="text-sm space-y-4">
        <p className="text-gray-600 leading-relaxed">
          You have not purchased two-factor authentication (2FA).<br />
          To do so please select <strong>New Orders</strong> and select Two-Factor Authentication (2FA).
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
            onClick={() => onToggle(true)}
            className={`text-xs font-bold px-5 py-2.5 rounded-lg transition-colors ${twoFAEnabled ? "bg-green-500 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            ENABLE 2FA
          </button>
          <button
            onClick={() => onToggle(false)}
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