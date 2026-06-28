"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DashboardTab, TABS } from "@/Types/Types";
import { api } from "@/lib/api";
import CheckInEmail from "./CheckInEmail";
import CheckInSchedule from "./CheckInSchedule";
import TrustedRecipients from "./TrustedRecipients";
import EmailToRecipients from "./EmailToRecipients";
import PressRelease from "./PressRelease";
import DocumentsAndImages from "./DocumentsAndImages";
import SetupAccounting from "./SetupAccounting";

export default function DashboardLayout() {
  const { isLoggedIn, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<DashboardTab>("check-in-email");
  const [summary, setSummary] = useState<{
    total_payments: number;
    completed_payment_amount: number;
  } | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, number> | null>(null);

  const [lastCheckIn, setLastCheckIn] = useState("");
  const [nextDue, setNextDue] = useState("");
  const [checkInStatus, setCheckInStatus] = useState("");

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as DashboardTab;
      if (
        tabParam &&
        [
          "check-in-email",
          "check-in-schedule",
          "trusted-recipients",
          "email-to-recipients",
          "press-release",
          "documents-and-images",
          "setup-accounting",
        ].includes(tabParam)
      ) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      const [summaryRes, analyticsRes, scheduleRes, accountingRes] = await Promise.all([
        api.dashboardSummary(),
        api.dashboardAnalytics(30),
        api.getCheckInSchedule(),
        api.getSetupAccounting(),
      ]);
      setSummary(summaryRes.data);
      setAnalytics(analyticsRes.data.status_breakdown);

      const history = accountingRes.data.history;
      if (history && history.length > 0) {
        setLastCheckIn(`${history[0].date} ${history[0].time}`);
      } else {
        setLastCheckIn("No check-ins yet");
      }

      setNextDue(scheduleRes.data.renewal_date || "Not Configured");
      setCheckInStatus(scheduleRes.data.paused ? "PAUSED" : "CHECK-IN OK");
    } catch (err) {
      console.error("Failed to load dashboard summary metrics", err);
      setSummary(null);
      setAnalytics(null);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    void loadDashboardData();
  }, [isLoggedIn]);

  // Removed authLoading early return to prevent SSG white flash.

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">

      {/* ── Header bar: white bg, gear icon title + badge + check-in dates ── */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4">

          {/* Left: gear icon + title */}
          <div className="flex items-center gap-2">
            {/* Gear icon */}
            <svg
              className="w-4 h-4 text-[#EF3832] shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h1
              className="text-[#EF3832] font-bold text-xs sm:text-sm tracking-widest uppercase mt-0.5"
            >
              Settings &amp; Configuration
            </h1>
          </div>

          {/* Right: CHECK-IN OK / PAUSED badge + last/next dates */}
          <div className="flex items-center gap-3 ml-auto">
            <span className={`flex items-center gap-1.5 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full tracking-widest uppercase whitespace-nowrap ${
              checkInStatus === "CHECK-IN OK" ? "bg-green-500" : "bg-red-500"
            }`}>
              <span className="w-2 h-2 rounded-full bg-white inline-block shrink-0" />
              {checkInStatus}
            </span>
            <div className="text-gray-500 text-xs leading-5 font-mono text-right">
              <div>
                Last check-in:{" "}
                <span className="font-bold text-gray-900">{lastCheckIn}</span>
              </div>
              <div>
                Next Check-In:{" "}
                <span className="font-bold text-gray-900">{nextDue}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="bg-[#1A56DB] w-full sticky top-0 z-10">

        {/* Mobile: compact wrap, tabs hug their text */}
        <div className="flex flex-wrap md:hidden w-full">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                "px-4 py-2.5 shrink-0",
                "text-white text-[10px] font-bold text-center uppercase tracking-widest whitespace-nowrap cursor-pointer",
                "border border-white/30 transition-colors duration-150",
                "focus:outline-none",
                activeTab === tab.id
                  ? "bg-[#EF3832]"
                  : "bg-[#1A56DB] hover:bg-blue-600 active:bg-blue-700",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop: compact tabs left-aligned, blue fills the rest */}
        <div className="hidden md:flex w-full items-stretch">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                "px-5 py-3.5 shrink-0",
                "text-white text-[11px] font-bold text-center uppercase tracking-widest whitespace-nowrap cursor-pointer",
                "border-r-2 border-white/90 transition-colors duration-150",
                "focus:outline-none",
                activeTab === tab.id
                  ? "bg-[#EF3832]"
                  : "bg-[#1A56DB] hover:bg-blue-600 active:bg-blue-700",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
          {/* Blue spacer fills remaining width */}
          <div className="flex-1 bg-[#1A56DB]" />
        </div>

      </div>

      {/* ── Content Area ── */}
      <div className="bg-white min-h-[calc(100vh-120px)] w-full">
        {activeTab === "check-in-email"       && <CheckInEmail userEmail={user?.email || "mycurrent@email.com"} />}
        {activeTab === "check-in-schedule"    && <CheckInSchedule onRefresh={loadDashboardData} />}
        {activeTab === "trusted-recipients"   && <TrustedRecipients userEmail={user?.email || "mycurrent@email.com"} />}
        {activeTab === "email-to-recipients"  && <EmailToRecipients />}
        {activeTab === "press-release"        && <PressRelease />}
        {activeTab === "documents-and-images" && <DocumentsAndImages />}
        {activeTab === "setup-accounting"     && <SetupAccounting onRefresh={loadDashboardData} />}
      </div>

    </div>
  );
}