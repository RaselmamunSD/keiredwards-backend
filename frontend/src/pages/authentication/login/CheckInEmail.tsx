"use client";

// Tab 1 — Check-In Email
// Updated to match client HTML reference exactly

import { useState } from "react";
import { z } from "zod";

interface Props {
  userEmail: string;
}

// ── Zod schemas ───────────────────────────────────────────────────────────────

const changeEmailSchema = z.object({
  newEmail: z.string().min(1, "Email is required.").email("Enter a valid email."),
  confirmEmail: z.string().min(1, "Please confirm the email."),
}).refine(d => d.newEmail === d.confirmEmail, {
  message: "Emails do not match.",
  path: ["confirmEmail"],
});

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-5" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="bg-white rounded-[14px] w-full max-w-[520px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-[18px]" style={{ background: "#1a4fd6" }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: ".06em", color: "#fff" }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 6, color: "#fff", fontSize: 18, fontWeight: 700, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Pill badges ───────────────────────────────────────────────────────────────

function PillGreen({ label = "Active" }: { label?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
      padding: "3px 9px", borderRadius: 20,
      background: "rgba(34,197,94,.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,.35)"
    }}>{label}</span>
  );
}

// ── Inline field ──────────────────────────────────────────────────────────────

function Field({ label, type = "text", value, onChange, placeholder, error }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string;
}) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4, color: "#333" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", background: "#f5f5f5", border: `1px solid ${error ? "#ef4444" : "#d0d0d0"}`,
          borderRadius: 9, padding: "11px 14px", fontFamily: "'DM Sans', sans-serif",
          fontSize: 14, color: "#111", outline: "none"
        }}
      />
      {error && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

// ── Shared button style helper ────────────────────────────────────────────────

const btnBase: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7, border: "none", borderRadius: 9,
  cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12,
  letterSpacing: ".06em", textTransform: "uppercase", padding: "9px 16px", flexShrink: 0,
  transition: "opacity .15s, transform .15s"
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function CheckInEmail({ userEmail }: Props) {
  const [email, setEmail] = useState(userEmail);

  // Check-in password
  const [checkinPw, setCheckinPw] = useState("");
  const [checkinPwSaved, setCheckinPwSaved] = useState(false);
  const [checkinPwEnabled, setCheckinPwEnabled] = useState(true);
  const [showCheckinPw, setShowCheckinPw] = useState(false);
  const [checkinPwError, setCheckinPwError] = useState("");

  // Private email
  const [privateUsername, setPrivateUsername] = useState("");
  const [privateAddressSaved, setPrivateAddressSaved] = useState(false);
  const [emailUnavailable, setEmailUnavailable] = useState(false);

  // Private email password
  const [privatePw, setPrivatePw] = useState("");
  const [privatePwSaved, setPrivatePwSaved] = useState(false);
  const [showPrivatePw, setShowPrivatePw] = useState(false);

  // 2FA — read-only, no cycling. Phase 3 will handle this.
  const [tfaState] = useState<"active" | "disabled" | "notordered">("active");

  // Test email message
  const [testEmailVisible, setTestEmailVisible] = useState(false);

  // Modal & change-email form
  const [modal, setModal] = useState<"change-email" | "whitelist" | "webmail" | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [emailErrors, setEmailErrors] = useState<{ newEmail?: string; confirmEmail?: string }>({});

  // Webmail copy feedback
  const [copied, setCopied] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleChangeEmail = () => {
    const result = changeEmailSchema.safeParse({ newEmail, confirmEmail });
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setEmailErrors({ newEmail: flat.newEmail?.[0], confirmEmail: flat.confirmEmail?.[0] });
      return;
    }
    setEmail(newEmail);
    setNewEmail(""); setConfirmEmail(""); setEmailErrors({});
    setModal(null);
    showToast("Check-in email updated successfully.");
  };

  const handleTestEmail = () => {
    if (!email.trim()) return;
    setTestEmailVisible(true);
    setTimeout(() => setTestEmailVisible(false), 5000);
  };

  const handleSaveCheckinPw = () => {
    if (!checkinPw.trim()) {
      setCheckinPwError("Password is required.");
      return;
    }
    setCheckinPwError("");
    setCheckinPwSaved(true);
    showToast("Check-in password saved.");
  };

  const handleChangeCheckinPw = () => {
    setCheckinPw("");
    setCheckinPwSaved(false);
    setCheckinPwError("");
  };

  const handleSaveAddress = () => {
    if (!privateUsername.trim() || privateAddressSaved) return;
    const taken = Math.random() < 0.5;
    if (taken) {
      setEmailUnavailable(true);
      setPrivateUsername("");
    } else {
      setEmailUnavailable(false);
      setPrivateAddressSaved(true);
    }
  };

  const handleSavePrivatePw = () => {
    if (!privatePw.trim()) return;
    setPrivatePwSaved(true);
  };
  const handleChangePrivatePw = () => {
    setPrivatePw("");
    setPrivatePwSaved(false);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const tfaStyle = (): React.CSSProperties => {
    if (tfaState === "active") return { background: "rgba(34,197,94,.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,.35)" };
    if (tfaState === "disabled") return { background: "rgba(232,40,30,.08)", color: "#e8281e", border: "1px solid rgba(232,40,30,.3)" };
    return { background: "rgba(255,255,255,.04)", color: "#888", border: "1px solid rgba(0,0,0,.15)" };
  };
  const tfaLabel = tfaState === "active" ? "Active" : tfaState === "disabled" ? "Disabled" : "Not Ordered";

  const checkinPwStatusStyle = (): React.CSSProperties =>
    checkinPwEnabled
      ? { background: "rgba(34,197,94,.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,.35)" }
      : { background: "rgba(232,40,30,.08)", color: "#e8281e", border: "1px solid rgba(232,40,30,.3)" };

  // ── Styles ───────────────────────────────────────────────────────────────────

  const panelStyle: React.CSSProperties = {
    background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, marginBottom: 20, overflow: "hidden"
  };
  const panelHeadStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px", borderBottom: "1px solid #e8e8e8", background: "#f8f8f8"
  };
  const panelTitleStyle: React.CSSProperties = {
    fontSize: 14, fontWeight: 700, color: "#111", display: "flex", alignItems: "center", gap: 8
  };
  const panelBodyStyle: React.CSSProperties = { padding: 20 };
  const fieldInputStyle: React.CSSProperties = {
    background: "#f5f5f5", border: "1px solid #d0d0d0", borderRadius: 9,
    padding: "11px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    color: "#111", outline: "none"
  };

  const domains = ["@domain1.com", "@domain2.com", "@domain3.com", "@domain4.com", "@domain5.com"];

  const webmailUrl = "https://mail.privateemail.com";
  const fullPrivateEmail = privateAddressSaved && privateUsername ? `${privateUsername}@privateemail.com` : null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto" style={{ padding: "32px 40px", background: "#fff", color: "#111", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ marginBottom: 20, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", fontSize: 13, fontWeight: 600, padding: "12px 16px", borderRadius: 10 }}>
          ✓ {toast}
        </div>
      )}

      {/* Page title */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #e8e8e8" }}>
        <div>
          <div className="block text-[2rem] md:text-[4rem] lg:text-[2rem] uppercase leading-none tracking-wide mt-4"
            style={{ fontFamily: "var(--font-anton)", fontWeight: 300 }}>Check-In Email</div>
          <div className="text-gray-500" style={{ fontSize: 13, marginTop: 2 }}>Manage the email address used for your check-in notifications</div>
        </div>
      </div>

      {/* ── PANEL 1: Check-In Email Address ── */}
      <div style={panelStyle}>
        <div style={panelHeadStyle}>
          <div style={panelTitleStyle}><span>📧</span> Check-In Email Address</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a4fd6", flex: 1, textAlign: "center" }}>
            The email listed below will be your Check-In Email Address.
          </div>
          <PillGreen />
        </div>
        <div style={panelBodyStyle}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
            Your check-in notification will be sent to this address. You must have access to this inbox to complete your check-in.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <input
              readOnly
              value={email}
              style={{ ...fieldInputStyle, maxWidth: 300, width: "100%" }}
            />
            <button style={{ ...btnBase, background: "#f59e0b", color: "#000" }} onClick={() => setModal("change-email")}>
              Change Email
            </button>
            <button style={{ ...btnBase, background: "#22c55e", color: "#000" }} onClick={handleTestEmail}>
              Test Email
            </button>
            <button
              style={{ ...btnBase, background: "#f0f0f0", color: "#333", border: "1px solid #ccc" }}
              onClick={() => setModal("whitelist")}
            >
              Show Domains to Whitelist
            </button>
          </div>

          {testEmailVisible && (
            <div style={{ marginTop: 12, fontSize: 13, color: "#15803d", fontWeight: 600 }}>
              ✓ Test email sent to {email}
            </div>
          )}

          {/* Warning notice */}
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#b45309", padding: "14px 16px", borderRadius: 10, marginTop: 14, fontSize: 13, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>⚠️ Important — Whitelist Our Domains</div>
            To prevent check-in emails from going to spam, add our sending domains to your safe senders list. Missing a check-in email could trigger unintended release of your vault contents.{" "}
            <span style={{ color: "#1a4fd6" }}>Private Check-In Email Addresses already have all required domains whitelisted.</span>
          </div>
        </div>
      </div>

      {/* ── PANEL 2: Check-In Password ── */}
      <div style={panelStyle}>
        <div style={panelHeadStyle}>
          <div style={panelTitleStyle}><span>🔑</span> Check-In Password</div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
            padding: "3px 9px", borderRadius: 20, marginLeft: "auto",
            ...checkinPwStatusStyle()
          }}>
            {checkinPwEnabled ? "Active" : "Disabled"}
          </span>
        </div>
        <div style={panelBodyStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* password input with eye toggle */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 200, maxWidth: 320 }}>
              <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                <input
                  type={showCheckinPw ? "text" : "password"}
                  value={checkinPw}
                  onChange={e => {
                    if (!checkinPwSaved) {
                      setCheckinPw(e.target.value);
                      if (e.target.value.trim()) setCheckinPwError("");
                    }
                  }}
                  readOnly={checkinPwSaved}
                  placeholder="Enter password"
                  style={{
                    ...fieldInputStyle, paddingRight: 40, width: "100%",
                    ...(checkinPwSaved ? { background: "#f0f0f0", color: "#555" } : {})
                  }}
                />
                <span
                  onClick={() => setShowCheckinPw(v => !v)}
                  style={{ position: "absolute", right: 10, cursor: "pointer", fontSize: 16, color: "#888", userSelect: "none" }}
                >👁</span>
              </div>
              {checkinPwError && (
                <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{checkinPwError}</p>
              )}
            </div>
            {/* Save / Change Password */}
            {!checkinPwSaved ? (
              <button style={{ ...btnBase, background: "#f59e0b", color: "#000" }} onClick={handleSaveCheckinPw}>
                Save Password
              </button>
            ) : (
              <button style={{ ...btnBase, background: "#f59e0b", color: "#000" }} onClick={handleChangeCheckinPw}>
                Change Password
              </button>
            )}
            {/* Disable / Enable Password */}
            <button
              style={{
                ...btnBase,
                background: checkinPwEnabled ? "#e8281e" : "#22c55e",
                color: checkinPwEnabled ? "#fff" : "#000"
              }}
              onClick={() => {
                setCheckinPwEnabled(v => !v);
                showToast(checkinPwEnabled ? "Check-in password disabled." : "Check-in password enabled.");
              }}
            >
              {checkinPwEnabled ? "Disable Password" : "Enable Password"}
            </button>
          </div>
          <div style={{ fontSize: 12, color: "#1a4fd6", fontWeight: 600, marginTop: 10 }}>
            We are recommending you use a Check-In Password. It is a safer option.
          </div>
        </div>
      </div>

      {/* ── PANEL 3: Two-Factor Authentication ── */}
      <div style={panelStyle}>
        <div style={panelHeadStyle}>
          <div style={panelTitleStyle}><span>🛡</span> Two-Factor Authentication (2FA)</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
                padding: "3px 9px", borderRadius: 20,
                ...tfaStyle()
              }}
            >
              {tfaLabel}
            </span>
          </div>
        </div>
        <div style={panelBodyStyle}>
          <div style={{ fontSize: 12, color: "#1a4fd6", fontWeight: 600 }}>
            Configuration of Two-Factor Authentication (2FA) can be found in the Setup &amp; Accounting Tab - SETUP.
          </div>
        </div>
      </div>

      {/* ── Private Check-In Email Section Title ── */}
      <div style={{ marginTop: 36, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #e8e8e8" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: ".04em", color: "#111" }}>
          Private Check-In Email
        </div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>Manage your private dedicated check-in email address</div>
      </div>

      {/* ── PANEL 4: Private Check-In Email Address ── */}
      <div style={panelStyle}>
        <div style={panelHeadStyle}>
          <div style={panelTitleStyle}><span>🔒</span> Private Check-In Email Address</div>
          <PillGreen />
        </div>
        <div style={panelBodyStyle}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 14, lineHeight: 1.7 }}>
            Enter your preferred email name and click <strong>Save Address</strong>. The domain is fixed and cannot be modified.
            If your chosen name is already in use, please try an alternative.
            <br /><br />
            <strong>Note: Once saved, this email address is permanent and cannot be changed.</strong>
          </div>

          <div style={{ display: "flex", alignItems: "stretch", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
            {/* username + @privateemail.com combined input */}
            <div style={{ display: "flex", alignItems: "stretch", flex: 1, minWidth: 280 }}>
              <input
                value={privateUsername}
                onChange={e => { if (!privateAddressSaved) { setPrivateUsername(e.target.value); setEmailUnavailable(false); } }}
                readOnly={privateAddressSaved}
                placeholder="enter your email address"
                style={{
                  ...fieldInputStyle,
                  borderRadius: "9px 0 0 9px", borderRight: "none", flex: 1,
                  ...(privateAddressSaved ? { background: "#f0f0f0", color: "#888" } : {})
                }}
              />
              <div style={{
                background: "#ebebeb", border: "1px solid #d0d0d0", borderLeft: "none",
                borderRadius: "0 9px 9px 0", padding: "0 14px",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#777",
                display: "flex", alignItems: "center", whiteSpace: "nowrap"
              }}>
                @privateemail.com
              </div>
            </div>
            <button
              style={{
                ...btnBase,
                background: privateAddressSaved ? "#ccc" : "#f97316",
                color: privateAddressSaved ? "#888" : "#fff",
                cursor: privateAddressSaved ? "default" : "pointer"
              }}
              onClick={handleSaveAddress}
              disabled={privateAddressSaved}
            >
              Save Address
            </button>

            {/* ── WebMail Info Button ── */}
            <button
              style={{ ...btnBase, background: "#e0f2fe", color: "#0369a1", border: "1px solid #7dd3fc" }}
              onClick={() => setModal("webmail")}
            >
              WebMail Info
            </button>
          </div>

          <div style={{ fontSize: 12, color: "#555", marginBottom: emailUnavailable ? 14 : 0 }}>
            To access your email press <strong>WebMail Info</strong> to get the website and login details.
          </div>

          {emailUnavailable && (
            <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, marginTop: 8 }}>
              ⚠ Address unavailable. Please select a unique email name to continue.
            </div>
          )}

          {/* Private Email Password — merged inside */}
          <div style={{ borderTop: "1px solid #e8e8e8", paddingTop: 14, marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span>🔐</span> Private Email Password
            </div>
            <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 200, maxWidth: 320, position: "relative" }}>
              <input
                type={showPrivatePw ? "text" : "password"}
                value={privatePw}
                onChange={e => { if (!privatePwSaved) setPrivatePw(e.target.value); }}
                readOnly={privatePwSaved}
                placeholder="Enter password"
                style={{
                  ...fieldInputStyle, paddingRight: 40, width: "100%",
                  ...(privatePwSaved ? { background: "#f0f0f0", color: "#555" } : {})
                }}
              />
              <span
                onClick={() => setShowPrivatePw(v => !v)}
                style={{ position: "absolute", right: 10, cursor: "pointer", fontSize: 16, color: "#888", userSelect: "none" }}
              >👁</span>
            </div>
            {!privatePwSaved ? (
              <button style={{ ...btnBase, background: "#f59e0b", color: "#000" }} onClick={handleSavePrivatePw}>
                Save Password
              </button>
            ) : (
              <button style={{ ...btnBase, background: "#f59e0b", color: "#000" }} onClick={handleChangePrivatePw}>
                Change Password
              </button>
            )}
          </div>
        </div>
      </div>

      {/* UPDATED: blue for main sentence, red only for "New Orders." per client screenshot */}
      <div style={{ padding: "11px 14px", background: "#fafafa", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
        <span style={{ color: "#1a4fd6" }}>
          If you would like to benefit from a Private Check-In Email address - Select the tab <span style={{ color: "#e8281e" }}>Setup &amp; Accounting</span> → Accounting →{" "}
        </span>
        <span style={{ color: "#e8281e" }}>New Orders.</span>
      </div>

      {/* ══════════════════ MODALS ══════════════════ */}

      {/* Change Email Modal */}
      {modal === "change-email" && (
        <Modal title="Change Check-In Email" onClose={() => { setModal(null); setEmailErrors({}); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="New Email" type="email" value={newEmail} onChange={setNewEmail} placeholder="new@example.com" error={emailErrors.newEmail} />
            <Field label="Confirm New Email" type="email" value={confirmEmail} onChange={setConfirmEmail} placeholder="new@example.com" error={emailErrors.confirmEmail} />
            <button
              onClick={handleChangeEmail}
              style={{ ...btnBase, background: "#22c55e", color: "#000", width: "100%", justifyContent: "center", padding: "13px 16px", fontSize: 13, fontWeight: 800 }}
            >
              Save New Email
            </button>
          </div>
        </Modal>
      )}

      {/* Whitelist Domains Modal */}
      {modal === "whitelist" && (
        <Modal title="Domains to Whitelist" onClose={() => setModal(null)}>
          <p style={{ fontSize: 13, color: "#555", marginBottom: 16, lineHeight: 1.7 }}>
            Add the following domains to your email whitelist or safe senders list to ensure check-in emails are never marked as spam:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {domains.map(d => (
              <div key={d} style={{ background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: 8, padding: "10px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#111" }}>
                {d}
              </div>
            ))}
            <div style={{ background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: 8, padding: "11px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#111", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>noreply@iwaskilledfortis.com</span>
              <span style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: ".08em", marginLeft: 12, flexShrink: 0 }}>No Reply</span>
            </div>
          </div>
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#b45309", marginBottom: 20 }}>
            ⚠️ Failure to whitelist these domains may result in missed check-in emails going to your spam folder, triggering an unintended release.
          </div>
          <button
            onClick={() => setModal(null)}
            style={{ ...btnBase, background: "#e8281e", color: "#fff", width: "100%", justifyContent: "center", padding: "13px 16px", fontSize: 13, fontWeight: 800 }}
          >
            Close
          </button>
        </Modal>
      )}

      {/* ── WebMail Info Modal ── */}
      {modal === "webmail" && (
        <Modal title="WebMail Access Info" onClose={() => { setModal(null); setCopied(null); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Info notice */}
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#1e40af", lineHeight: 1.7 }}>
              📬 Use the details below to access your private check-in inbox via webmail.
            </div>

            {/* Webmail URL */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                Webmail Login URL
              </div>
              <div style={{ background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: 9, padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <a
                  href={webmailUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 13, color: "#1a4fd6", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", wordBreak: "break-all", textDecoration: "underline" }}
                >
                  {webmailUrl}
                </a>
                <button
                  onClick={() => handleCopy(webmailUrl, "url")}
                  style={{ ...btnBase, background: copied === "url" ? "#22c55e" : "#e0f2fe", color: copied === "url" ? "#fff" : "#0369a1", border: `1px solid ${copied === "url" ? "#22c55e" : "#7dd3fc"}`, padding: "6px 12px", fontSize: 11, minWidth: 60 }}
                >
                  {copied === "url" ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                Your Email Address
              </div>
              <div style={{ background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: 9, padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: fullPrivateEmail ? "#111" : "#aaa", fontStyle: fullPrivateEmail ? "normal" : "italic" }}>
                  {fullPrivateEmail ?? "No address saved yet"}
                </span>
                {fullPrivateEmail && (
                  <button
                    onClick={() => handleCopy(fullPrivateEmail, "email")}
                    style={{ ...btnBase, background: copied === "email" ? "#22c55e" : "#e0f2fe", color: copied === "email" ? "#fff" : "#0369a1", border: `1px solid ${copied === "email" ? "#22c55e" : "#7dd3fc"}`, padding: "6px 12px", fontSize: 11, minWidth: 60 }}
                  >
                    {copied === "email" ? "✓ Copied" : "Copy"}
                  </button>
                )}
              </div>
              {!fullPrivateEmail && (
                <p style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600, marginTop: 5 }}>
                  ⚠ Save your private email address first to see it here.
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                Password
              </div>
              <div style={{ background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: 9, padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: privatePwSaved ? "#111" : "#aaa", letterSpacing: privatePwSaved ? ".1em" : "normal", fontStyle: privatePwSaved ? "normal" : "italic" }}>
                  {privatePwSaved ? "••••••••••" : "No password saved yet"}
                </span>
                {privatePwSaved && privatePw && (
                  <button
                    onClick={() => handleCopy(privatePw, "pw")}
                    style={{ ...btnBase, background: copied === "pw" ? "#22c55e" : "#e0f2fe", color: copied === "pw" ? "#fff" : "#0369a1", border: `1px solid ${copied === "pw" ? "#22c55e" : "#7dd3fc"}`, padding: "6px 12px", fontSize: 11, minWidth: 60 }}
                  >
                    {copied === "pw" ? "✓ Copied" : "Copy"}
                  </button>
                )}
              </div>
              {!privatePwSaved && (
                <p style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600, marginTop: 5 }}>
                  ⚠ Save your private email password first to copy it here.
                </p>
              )}
            </div>

            {/* Security warning */}
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#b45309" }}>
              ⚠️ Keep these credentials private. Do not share your webmail login with anyone.
            </div>

            {/* Close */}
            <button
              onClick={() => { setModal(null); setCopied(null); }}
              style={{ ...btnBase, background: "#1a4fd6", color: "#fff", width: "100%", justifyContent: "center", padding: "13px 16px", fontSize: 13, fontWeight: 800 }}
            >
              Close
            </button>

          </div>
        </Modal>
      )}

    </div>
  );
}