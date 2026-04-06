"use client";

import { useState } from "react";

const DAY_OPTIONS = [
  "Randomize", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday", "Sunday",
];

const GRACE_OPTIONS = [
  "NONE", "1 Hour", "2 Hours", "3 Hours",
  "4 Hours", "8 Hours", "24 Hours", "48 Hours",
];

interface ScheduleConfig {
  dayOfWeek: string;
  gracePeriod: string;
}

function Toast({ message, type = "success" }: { message: string; type?: "success" | "warning" }) {
  if (!message) return null;
  return (
    <div className={`text-sm px-4 py-3 rounded-xl border mb-5 ${type === "warning"
        ? "bg-yellow-50 border-yellow-300 text-yellow-800"
        : "bg-green-50 border-green-300 text-green-800"
      }`}>
      {message}
    </div>
  );
}

export default function CheckInSchedule() {
  const purchasedPlan = "Weekly";
  const renewalDate = "03/23/2026";

  const [config, setConfig] = useState<ScheduleConfig>({
    dayOfWeek: "Randomize",
    gracePeriod: "NONE",
  });

  const [savedConfig, setSavedConfig] = useState<ScheduleConfig>({
    dayOfWeek: "Randomize",
    gracePeriod: "NONE",
  });

  const [paused, setPaused] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "warning">("success");
  const [isDirty, setIsDirty] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const showToast = (msg: string, type: "success" | "warning" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 3500);
  };

  const set = <K extends keyof ScheduleConfig>(field: K, val: string) => {
    setConfig(prev => ({ ...prev, [field]: val }));
    setIsDirty(true);
  };

  const handleSave = () => {
    setSavedConfig({ ...config });
    setIsDirty(false);
    showToast("Schedule configuration saved successfully.");
  };

  const handlePauseToggle = () => {
    setPaused(p => !p);
    showToast(
      paused ? "Service resumed. Check-in requirements are active." : "Service paused. Remember to resume when ready.",
      paused ? "success" : "warning"
    );
  };

  const handleUpgradeRenewal = () => {
    setShowUpgradeModal(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 text-gray-900">

      <h2 className="block text-[2rem] md:text-[4rem] lg:text-[2rem] uppercase leading-none tracking-wide mt-4"
        style={{ fontFamily: "var(--font-anton)", fontWeight: 300 }}>Check-In Schedule</h2>
      <p className="text-sm text-gray-500 mb-6 mt-4">Configure when and how often you check in</p>

      <Toast message={toast} type={toastType} />

      {/* ── Upgrade / Renewal Modal ── */}
      {showUpgradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[.2em] uppercase text-blue-600 mb-1 font-mono">
                  Account
                </p>
                <h3
                  className="text-2xl uppercase leading-none tracking-wide text-gray-900"
                  style={{ fontFamily: "var(--font-anton)" }}
                >
                  Upgrade / Renewal
                </h3>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition-colors cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 space-y-3">
              {/* Current Plan Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
                <p className="text-xs text-blue-500 font-bold uppercase tracking-widest mb-1">Current Plan</p>
                <p className="text-lg font-black text-blue-700 uppercase">{purchasedPlan} Check-In</p>
                <p className="text-xs text-blue-500 mt-0.5">Renews on {renewalDate}</p>
              </div>

              {/* Options */}
              {[
                {
                  icon: "🔄",
                  title: "Renew Current Plan",
                  desc: "Extend your Weekly Check-In for another term.",
                  btnLabel: "RENEW NOW",
                  btnClass: "bg-green-500 hover:bg-green-400",
                },
                {
                  icon: "⚡",
                  title: "Upgrade Plan",
                  desc: "Switch to Daily, Monthly, or another frequency.",
                  btnLabel: "VIEW UPGRADES",
                  btnClass: "bg-blue-600 hover:bg-blue-500",
                },
                {
                  icon: "💬",
                  title: "Contact Support",
                  desc: "Need a custom plan or have questions? We're here.",
                  btnLabel: "CONTACT US",
                  btnClass: "bg-gray-700 hover:bg-gray-600",
                },
              ].map(({ icon, title, desc, btnLabel, btnClass }) => (
                <div
                  key={title}
                  className="flex items-center justify-between gap-4 border border-gray-200 rounded-xl px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUpgradeModal(false);
                      showToast(`${title} — coming soon! Please contact support.`, "success");
                    }}
                    className={`${btnClass} text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shrink-0 cursor-pointer`}
                  >
                    {btnLabel}
                  </button>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-5">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 text-sm font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero Service Banner ── */}
      <div className={`rounded-xl border mb-6 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        paused ? "bg-yellow-50 border-yellow-300" : "bg-green-50 border-green-200"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className={`text-5xl font-black tracking-tight leading-none ${paused ? "text-yellow-600" : "text-green-600"}`}>
            {purchasedPlan.toUpperCase()}
          </span>
          <div className="flex items-center gap-1.5">
            {paused ? (
              <>
                <span className="text-yellow-500">⏸</span>
                <span className="text-yellow-700 text-sm font-semibold">Check-In Service Paused</span>
              </>
            ) : (
              <>
                <span className="text-green-500">✓</span>
                <span className="text-green-700 text-sm font-semibold">Check-In Service Active</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2">
          <span className="text-sm text-blue-600 font-medium">
            Service Renews on <span className="font-bold">{renewalDate}</span>
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleUpgradeRenewal}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
              UPGRADE / RENEWAL OPTIONS
            </button>
            <button
              onClick={handlePauseToggle}
              className={`text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors ${
                paused ? "bg-green-500 hover:bg-green-400" : "bg-red-500 hover:bg-red-400"
              }`}
            >
              {paused ? "RESUME SERVICE" : "PAUSE SERVICE"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Configuration Card ── */}
      <div className="border border-gray-200 bg-white rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-blue-500 text-base">📅</span>
          <h3 className="font-bold text-base text-gray-800">Check-In Schedule Configuration</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">

          {/* Day of Week */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Day of the Week
            </label>
            <select
              value={config.dayOfWeek}
              onChange={e => set("dayOfWeek", e.target.value)}
              className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 text-gray-800"
            >
              {DAY_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Grace Period */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Grace Period
            </label>
            <select
              value={config.gracePeriod}
              onChange={e => set("gracePeriod", e.target.value)}
              className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 text-gray-800"
            >
              {GRACE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className={`text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-colors ${
            isDirty ? "bg-green-500 hover:bg-green-400 cursor-pointer" : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          SAVE SCHEDULE
        </button>

        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-2 items-start">
          <span className="text-blue-500 mt-0.5">ℹ️</span>
          <div>
            <p className="text-sm font-bold text-blue-700 mb-1">Deadline</p>
            <p className="text-sm text-blue-600 leading-relaxed">
              All check-ins must be completed by 11:59 PM EDT/EST on the scheduled day.
            </p>
            <p className="text-xs text-blue-500 mt-1.5 leading-relaxed">
              To avoid a missed check-in, we recommend setting a Grace Period based on your time zone.
              Since the check-in deadline is 11:59 PM Eastern Time — Central Time users should add 1 hour,
              Mountain Time users 2 hours, and Pacific Time users 3 hours.
            </p>
          </div>
        </div>
      </div>

      {/* ── Schedule Summary ── FIX: now uses live `config` so changes reflect immediately */}
      <div className="border border-blue-200 bg-blue-50 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-blue-500 text-base">⏰</span>
          <h3 className="font-bold text-base text-blue-800">Your Check-In Schedule</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "FREQUENCY", value: purchasedPlan },
            { label: "DAY OF WEEK", value: config.dayOfWeek },
            { label: "DEADLINE", value: "11:59 PM EDT/EST" },
            { label: "GRACE PERIOD", value: config.gracePeriod },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">{label}</p>
              <p className="font-bold text-sm text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Important Information ── */}
      <div className="border border-yellow-300 bg-yellow-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-yellow-600 text-base">⚠</span>
          <h3 className="font-bold text-sm text-yellow-800">Important Information</h3>
        </div>
        <ul className="space-y-2.5 text-sm text-gray-700">
          <li>
            <span className="font-bold">• Randomize Day:</span>{" "}
            Increases security by making your check-in schedule unpredictable to potential threats.
          </li>
          <li>
            <span className="font-bold">• Grace Period:</span>{" "}
            Gives you extra time to complete check-in if you miss the initial deadline. After the grace period expires, automatic distribution begins.
          </li>
          <li>
            <span className="font-bold">• Pause Service:</span>{" "}
            Temporarily suspends check-in requirements. Use this feature if you&apos;re traveling, in a remote area, or need a break. Remember to resume when ready.
          </li>
        </ul>
      </div>

    </div>
  );
}