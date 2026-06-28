"use client";

// OverviewLayout — the "Welcome Back" dashboard page shown immediately after login.
// Contains: welcome header, Settings/Help/Logout buttons, Check-In Status card,
// Subscription card, and Services table. Fully responsive.
// UPDATED: Help button now opens an inline modal instead of external link.
// UPDATED: Check-In Email now displays as plain text (no mailto link).
// UPDATED: Mock next check-in date updated to 3/30/2025 – 7:11 PM per client note.
// UPDATED: Two-Factor Authentication set to Active per client feedback.
// UPDATED: Storage split into Standard Storage + Additional Storage rows per client feedback.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

// ── Minutes remaining until 11:59 PM Eastern on the given date ─────────────────
function getMinutesRemainingUntilEndOfDayET(dateStr: string): number {
  if (!dateStr) return 0;
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const etFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = etFormatter.formatToParts(d);
    const year = Number(parts.find((p) => p.type === "year")?.value);
    const month = Number(parts.find((p) => p.type === "month")?.value);
    const day = Number(parts.find((p) => p.type === "day")?.value);
    const endOfDayET = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T23:59:00-04:00`);
    const diffMs = endOfDayET.getTime() - Date.now();
    return diffMs > 0 ? Math.floor(diffMs / 60000) : 0;
  }
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, mm, dd, yyyy] = slashMatch;
    const endOfDayET = new Date(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T23:59:00-04:00`);
    const diffMs = endOfDayET.getTime() - Date.now();
    return diffMs > 0 ? Math.floor(diffMs / 60000) : 0;
  }
  return 0;
}

function formatGracePeriodDisplay(gracePeriod: string): string {
  if (!gracePeriod || gracePeriod.toUpperCase() === "NONE") return "Not Configured";
  return gracePeriod;
}

function serviceStatusLabel(active: boolean, status: string): string {
  if (status === "Not Purchased" || status === "Not Configured") return status;
  return active ? "Active" : status;
}

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

export default function OverviewLayout() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, logout } = useAuth();
  const [data, setData] = useState<{
    lastLogin: string;
    accountStatus: string;
    checkIn: {
      status: string;
      nextCheckInDate: string;
      minutesRemaining: number;
      frequency: string;
      gracePeriod: string;
      email: string;
    };
    subscription: {
      plan: string;
      started: string;
      renews: string;
      term: string;
      storage: string;
      storageUsedGB: number;
      storageTotalGB: number;
      distributionTo: string;
    };
    services: Array<{
      name: string;
      details: string;
      activeUntil: string;
      status: string;
      active: boolean;
    }>;
  } | null>(null);

  const [error, setError] = useState<string>("");
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const load = async () => {
      try {
        setError("");
        const [accountingRes, scheduleRes, emailRes, vaultRes, profileRes] = await Promise.all([
          api.getSetupAccounting(),
          api.getCheckInSchedule(),
          api.getCheckInEmailConfig(),
          api.getVaultFiles(),
          api.profile(),
        ]);

        const history = accountingRes.data.history;
        const lastLoginStr = history && history.length > 0
          ? `${history[0].date} ${history[0].time}`
          : "No check-ins yet";

        const paused = scheduleRes.data.paused;
        const checkInEmail = emailRes.data.checkin_email || accountingRes.data.config.two_fa_email || "user@example.com";

        const storageTotalGB = vaultRes.data.storage_config.total_storage_gb || 5;
        const totalSizeMB = vaultRes.data.files.reduce((sum: number, f: any) => sum + parseFloat(f.file_size_mb || "0"), 0);
        const storageUsedGB = parseFloat((totalSizeMB / 1024).toFixed(3));

        const pressSvc = accountingRes.data.services.find((s: any) => s.name === "Press Release");
        const distributionTo = (pressSvc && pressSvc.is_purchased)
          ? `Press Release (${pressSvc.additional_info || "250 count"})`
          : "Trusted Recipients";

        const renewalDateStr = scheduleRes.data.renewal_date || "March 7, 2027";
        const parsedTime = Date.parse(renewalDateStr);
        let minutesRemaining = 999999;
        if (!isNaN(parsedTime)) {
          const diffMs = parsedTime - Date.now();
          minutesRemaining = diffMs > 0 ? Math.floor(diffMs / 60000) : 0;
        }

        const mainService = accountingRes.data.services.find((s: any) => s.name === "I Was Killed For This Information");
        const standardStorageActiveUntil = mainService ? mainService.active_until : "March 7, 2027";

        const mappedServices: any[] = [
          {
            name: "Standard Storage",
            details: "5 GB Included",
            activeUntil: standardStorageActiveUntil,
            status: "Active",
            active: true
          }
        ];

        accountingRes.data.services.forEach((s: any) => {
          if (s.name === "Additional Storage") {
            mappedServices.push({
              name: s.name,
              details: s.additional_info,
              activeUntil: s.active_until,
              status: s.is_purchased ? "Active" : "Not Purchased",
              active: s.is_purchased
            });
          } else if (s.name !== "I Was Killed For This Information") {
            mappedServices.push({
              name: s.name,
              details: s.additional_info,
              activeUntil: s.active_until,
              status: s.is_purchased ? "Active" : "Not Purchased",
              active: s.is_purchased
            });
          } else {
            mappedServices.push({
              name: s.name,
              details: s.additional_info,
              activeUntil: s.active_until,
              status: s.is_purchased ? "Active" : "Not Purchased",
              active: s.is_purchased
            });
          }
        });

        let startedDate = "03/07/2025";
        if (profileRes.data.date_joined) {
          try {
            const dateObj = new Date(profileRes.data.date_joined);
            if (!isNaN(dateObj.getTime())) {
              const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
              const dd = String(dateObj.getDate()).padStart(2, '0');
              const yyyy = dateObj.getFullYear();
              startedDate = `${mm}/${dd}/${yyyy}`;
            }
          } catch (e) {
            console.error("Error parsing date_joined", e);
          }
        }

        setData({
          lastLogin: lastLoginStr,
          accountStatus: paused ? "Paused" : "Active",
          checkIn: {
            status: paused ? "Paused" : "Active",
            nextCheckInDate: renewalDateStr,
            minutesRemaining,
            frequency: scheduleRes.data.purchased_plan,
            gracePeriod: scheduleRes.data.grace_period,
            email: checkInEmail,
          },
          subscription: {
            plan: `${scheduleRes.data.purchased_plan} Check-In`,
            started: startedDate,
            renews: renewalDateStr,
            term: "1 Year",
            storage: `${storageTotalGB} GB`,
            storageUsedGB,
            storageTotalGB,
            distributionTo,
          },
          services: mappedServices,
        });
      } catch (err) {
        console.error("Failed to load overview data", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard data. Please try again.");
      }
    };
    void load();
  }, [isLoggedIn, reloadKey]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Removed authLoading block to prevent SSG flashing.

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <p className="text-sm text-red-500 font-semibold mb-4 text-center">{error}</p>
        <button
          onClick={() => {
            setError("");
            setData(null);
            setReloadKey(prev => prev + 1);
          }}
          className="bg-[#EF3832] hover:bg-red-600 active:bg-red-700 text-white font-bold text-xs px-5 py-3 rounded-lg uppercase tracking-widest transition-colors duration-150 cursor-pointer"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <span className="inline-block h-10 w-10 rounded-full border-4 border-gray-200 border-t-[#EF3832] animate-spin" />
      </div>
    );
  }


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
              <span className="font-bold text-gray-800">{data.lastLogin}</span>
              {"  ·  "}
              Account status:{" "}
              <span className={`font-bold ${data.accountStatus === "Active" ? "text-green-600" : "text-yellow-600"}`}>
                ● {data.accountStatus}
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
              onClick={() => window.location.href = "http://iwaskilledforthisinformation.help"}
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
            <div className={`px-5 py-3 border-b border-gray-200 ${data.checkIn.status === "Active" ? "bg-green-50" : "bg-red-50"}`}>
              <h2 className={`text-xs font-bold uppercase tracking-widest ${data.checkIn.status === "Active" ? "text-green-700" : "text-red-700"}`}>
                Check-In Status
              </h2>
            </div>
            <div>
              <CardRow label="Status" value={<span className="font-bold text-gray-900">● {data.checkIn.status}</span>} />
              <CardRow label="Next Check-In Date" value={<span className="font-bold text-gray-900">{data.checkIn.nextCheckInDate}</span>} />
              <CardRow label="Minutes Remaining" value={<span className="font-bold text-gray-900">{getMinutesRemainingUntilEndOfDayET(data.checkIn.nextCheckInDate).toLocaleString()}</span>} />
              <CardRow label="Frequency" value={<span className="font-bold text-gray-900">{data.checkIn.frequency}</span>} />
              <CardRow label="Grace Period" value={<span className="font-bold text-gray-900">{formatGracePeriodDisplay(data.checkIn.gracePeriod)}</span>} />
              <CardRow
                label="Check-In Email"
                value={
                  <span className="font-bold text-gray-900 break-all">
                    {data.checkIn.email}
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
              <CardRow label="Plan" value={<span className="font-bold text-gray-900">{data.subscription.plan}</span>} />
              <CardRow label="Started" value={<span className="font-bold text-gray-900">{data.subscription.started}</span>} />
              <CardRow label="Renews" value={<span className="font-bold text-gray-900">{data.subscription.renews}</span>} />
              <CardRow label="Term" value={<span className="font-bold text-gray-900">{data.subscription.term}</span>} />
              <CardRow
                label="Storage"
                value={
                  <div className="text-right">
                    <div className="font-bold text-gray-900">Standard 5 GB</div>
                    {data.services.find((s) => s.name === "Additional Storage" && s.active) && (
                      <div className="font-bold text-gray-900">
                        Additional {data.services.find((s) => s.name === "Additional Storage")?.details || "0 GB"}
                      </div>
                    )}
                  </div>
                }
              />
              <CardRow
                label="Storage Used"
                value={<StorageBar used={data.subscription.storageUsedGB} total={data.subscription.storageTotalGB} />}
              />
              <CardRow
                label="Distribution"
                value={<span className="font-bold text-gray-900">{data.subscription.distributionTo}</span>}
              />
              <CardRow
                label="Private Email"
                value={
                  (() => {
                    const svc = data.services.find((s) => s.name === "Private Email");
                    const purchased = svc?.active ?? false;
                    return (
                      <span className={`font-bold ${purchased ? "text-gray-900" : "text-red-600"}`}>
                        {purchased ? "Active" : "Not Purchased"}
                      </span>
                    );
                  })()
                }
              />
              <CardRow
                label="Two-Factor Authentication (2FA)"
                value={
                  (() => {
                    const svc = data.services.find((s) => s.name === "Two-Factor Authentication");
                    if (!svc?.active) {
                      return <span className="font-bold text-orange-600">Not Configured</span>;
                    }
                    return <span className="font-bold text-gray-900">Active</span>;
                  })()
                }
              />
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
              {data.services.map((svc, idx) => (
                <tr
                  key={svc.name}
                  className={`hover:bg-gray-50 transition-colors ${idx < data.services.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <td className="px-5 py-3.5 font-semibold text-gray-900">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2.5 ${svc.active ? "bg-green-500" : "bg-red-500"}`} />
                    {svc.name}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{svc.details}</td>
                  <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">{svc.activeUntil}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-normal ${svc.active ? "text-gray-700" : svc.status === "Not Configured" ? "text-orange-600" : "text-gray-500"}`}>
                      {serviceStatusLabel(svc.active, svc.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-gray-100">
            {data.services.map((svc) => (
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
    </div>
  );
}