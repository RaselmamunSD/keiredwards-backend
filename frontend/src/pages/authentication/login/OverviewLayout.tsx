"use client";

// OverviewLayout — the "Welcome Back" dashboard page shown immediately after login.
// Contains: welcome header, Settings/Help/Logout buttons, Check-In Status card,
// Subscription card, and Services table. Fully responsive.
// UPDATED: Help button now opens an inline modal instead of external link.
// UPDATED: Check-In Email now displays as plain text (no mailto link).
// UPDATED: Mock next check-in date updated to 3/30/2025 – 7:11 PM per client note.
// UPDATED: Two-Factor Authentication set to Active per client feedback.
// UPDATED: Storage split into Standard Storage + Additional Storage rows per client feedback.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// ── Mock data — replace with real API data in production ──────────────────────
const MOCK_DATA = {
  lastLogin: "03/10/2026 09:15 AM",
  accountStatus: "Active",
  checkIn: {
    status: "Active",
    nextCheckInDate: "03/30/2025 7:11 PM",
    minutesRemaining: 999999,
    frequency: "Weekly",
    gracePeriod: "None",
    email: "mycurrent@email.com",
  },
  subscription: {
    plan: "Weekly Check-In",
    started: "03/07/2025",
    renews: "03/07/2027",
    term: "2 Years",
    storage: "5 GB Included",
    storageUsedGB: 0.1,
    storageTotalGB: 5,
    distributionTo: "Press Release 250",
  },
  services: [
    { name: "I Was Killed For This Information", details: "Daily Check-In", activeUntil: "March 7, 2027", status: "Active", active: true },
    // UPDATED: Split into two rows per client feedback
    { name: "Standard Storage", details: "5 GB Included", activeUntil: "March 7, 2027", status: "Active", active: true },
    { name: "Additional Storage", details: "2 GB Added", activeUntil: "March 7, 2027", status: "Active", active: true },
    { name: "Press Release", details: "250 Media Organizations", activeUntil: "March 7, 2027", status: "Active", active: true },
    { name: "Private Email", details: "500 Messages / Year", activeUntil: "March 7, 2027", status: "Active", active: true },
    // UPDATED: Two-Factor Authentication set to Active per client feedback
    { name: "Two-Factor Authentication", details: "Login & Check-In Security", activeUntil: "March 7, 2027", status: "Active", active: true },
  ],
};

// ── Help modal items ──────────────────────────────────────────────────────────
const HELP_ITEMS = [
  {
    icon: "🗓",
    title: "Check-In Schedule",
    description:
      "Set how often you check in. If you miss your check-in and the grace period expires, your vault will be released to your recipients.",
  },
  {
    icon: "👥",
    title: "Trusted Recipients",
    description:
      "The people who will receive your information if your vault is triggered. Keep this list current.",
  },
  {
    icon: "📋",
    title: "Press Release",
    description:
      "If purchased, your information will be distributed to media organizations when your vault is triggered instead of (or in addition to) trusted recipients.",
  },
  {
    icon: "🟨",
    title: "Documents & Images",
    description:
      "Upload the files you want released. Up to 5 GB included. Files are encrypted and inaccessible to administrators.",
  },
  {
    icon: "📧",
    title: "Check-In Email",
    description:
      "This is the email address where your check-in link will be sent. Whitelist our domains to prevent it going to spam.",
  },
];

// ── Help Modal ────────────────────────────────────────────────────────────────
function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[520px] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: "#1a4fd6" }}
        >
          <span
            className="text-white font-black uppercase tracking-widest text-base"
            style={{ fontFamily: "var(--font-anton)", fontWeight: 400, letterSpacing: "0.08em" }}
          >
            Help &amp; Support
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-lg transition-colors hover:bg-white/20"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          {HELP_ITEMS.map((item) => (
            <div
              key={item.title}
              className="border border-gray-200 rounded-xl px-4 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{item.icon}</span>
                <span className="font-bold text-gray-900 text-sm">{item.title}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed pl-6">
                {item.description}
              </p>
            </div>
          ))}

          {/* Footer notice */}
          <div className="border border-yellow-200 bg-yellow-50 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-yellow-500 text-sm">⚠</span>
            <p className="text-xs text-yellow-700 font-medium">
              For account issues or billing support, please contact us directly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Storage bar ───────────────────────────────────────────────────────────────
function StorageBar({ used, total }: { used: number; total: number }) {
  const pct = Math.min((used / total) * 100, 100);
  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
        {used} GB / {total} GB
      </span>
    </div>
  );
}

// ── Row item for cards ────────────────────────────────────────────────────────
function CardRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 text-sm border-b border-gray-100 last:border-b-0">
      <span className="text-gray-500 shrink-0 mr-4">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OverviewLayout() {
  const router = useRouter();
  const { logout } = useAuth();
  const [helpOpen, setHelpOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-white py-8 sm:py-10">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* ── Welcome Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">

          {/* Left: title + meta */}
          <div className="flex-1 min-w-0">
            <h1
              className="text-2xl sm:text-3xl md:text-3xl uppercase leading-tight tracking-wide text-gray-900"
              style={{ fontFamily: "var(--font-anton)", fontWeight: 400 }}
            >
              Welcome Back —{" "}
              <span className="text-[#EF3832]">Good to see you are well.</span>
            </h1>
            <p className="mt-2 text-sm text-gray-500 font-mono">
              Last login:{" "}
              <span className="font-bold text-gray-800">{MOCK_DATA.lastLogin}</span>
              {"  ·  "}
              Account status:{" "}
              <span className="font-bold text-green-600">
                ● {MOCK_DATA.accountStatus}
              </span>
            </p>
          </div>

          {/* Right: action buttons */}
          <div className="flex flex-wrap items-start gap-2 sm:shrink-0 sm:ml-6">
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-[#F59E0B] hover:bg-yellow-500 active:bg-yellow-600 text-white font-bold text-xs px-4 py-3 rounded-lg uppercase tracking-widest transition-colors duration-150 text-center leading-tight cursor-pointer"
              style={{ minWidth: "120px" }}
            >
              Settings &amp;<br className="hidden sm:block" /> Configuration
            </button>

            <button
              onClick={() => setHelpOpen(true)}
              className="bg-[#5DADE2] hover:bg-yellow-500 active:bg-yellow-600 text-white font-bold text-xs px-6 py-5 rounded-lg uppercase tracking-widest transition-colors duration-150 text-center cursor-pointer"
              style={{ minWidth: "80px" }}
            >
              Help
            </button>

            <button
              onClick={handleLogout}
              className="bg-[#EF3832] hover:bg-red-600 active:bg-red-700 text-white font-bold text-xs px-6 py-5 rounded-lg uppercase tracking-widest transition-colors duration-150 cursor-pointer text-center leading-tight"
              style={{ minWidth: "90px" }}
            >
              Logout
            </button>
          </div>
        </div>

        <hr className="border-gray-200 mb-6" />

        {/* ── Status + Subscription cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

          {/* Check-In Status */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-green-50 px-5 py-3 border-b border-gray-200">
              <h2 className="text-xs font-bold text-green-700 uppercase tracking-widest">
                Check-In Status
              </h2>
            </div>
            <div>
              <CardRow label="Status" value={<span className="font-bold text-gray-900">● Active</span>} />
              <CardRow label="Next Check-In Date" value={<span className="font-bold text-gray-900">{MOCK_DATA.checkIn.nextCheckInDate}</span>} />
              <CardRow label="Minutes Remaining" value={<span className="font-bold text-gray-900">{MOCK_DATA.checkIn.minutesRemaining.toLocaleString()}</span>} />
              <CardRow label="Frequency" value={<span className="font-bold text-gray-900">{MOCK_DATA.checkIn.frequency}</span>} />
              <CardRow label="Grace Period" value={<span className="font-bold text-gray-900">{MOCK_DATA.checkIn.gracePeriod}</span>} />
              <CardRow
                label="Check-In Email"
                value={
                  <span className="font-bold text-gray-900 break-all">
                    {MOCK_DATA.checkIn.email}
                  </span>
                }
              />
            </div>
          </div>

          {/* Subscription */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-blue-50 px-5 py-3 border-b border-gray-200">
              <h2 className="text-xs font-bold text-blue-700 uppercase tracking-widest">
                Subscription
              </h2>
            </div>
            <div>
              <CardRow label="Plan" value={<span className="font-bold text-gray-900">{MOCK_DATA.subscription.plan}</span>} />
              <CardRow label="Started" value={<span className="font-bold text-gray-900">{MOCK_DATA.subscription.started}</span>} />
              <CardRow label="Renews" value={<span className="font-bold text-gray-900">{MOCK_DATA.subscription.renews}</span>} />
              <CardRow label="Term" value={<span className="font-bold text-gray-900">{MOCK_DATA.subscription.term}</span>} />
              <CardRow label="Storage" value={<span className="font-bold text-gray-900">{MOCK_DATA.subscription.storage}</span>} />
              <CardRow
                label="Storage Used"
                value={<StorageBar used={MOCK_DATA.subscription.storageUsedGB} total={MOCK_DATA.subscription.storageTotalGB} />}
              />
              <CardRow label="Distribution To" value={<span className="font-bold text-gray-900">{MOCK_DATA.subscription.distributionTo}</span>} />
            </div>
          </div>
        </div>

        {/* ── Services Table ── */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Desktop table */}
          <table className="hidden sm:table w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Service</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Details</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Active Until</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_DATA.services.map((svc, idx) => (
                <tr
                  key={svc.name}
                  className={`hover:bg-gray-50 transition-colors ${idx < MOCK_DATA.services.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <td className="px-5 py-3.5 font-semibold text-gray-900">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2.5 ${svc.active ? "bg-green-500" : "bg-red-500"}`} />
                    {svc.name}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{svc.details}</td>
                  <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">{svc.activeUntil}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-normal ${svc.active ? "text-gray-700" : "text-gray-500"}`}>
                      {svc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-gray-100">
            {MOCK_DATA.services.map((svc) => (
              <div key={svc.name} className="px-4 py-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${svc.active ? "bg-green-500" : "bg-red-500"}`} />
                    {svc.name}
                  </span>
                  <span className={`text-xs font-semibold ${svc.active ? "text-gray-700" : "text-gray-500"}`}>
                    {svc.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 pl-5">{svc.details}</p>
                <p className="text-xs text-gray-400 font-mono pl-5">Until: {svc.activeUntil}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Help Modal ── */}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}