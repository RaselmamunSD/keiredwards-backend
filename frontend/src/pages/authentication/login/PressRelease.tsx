"use client";

import { useState, useEffect } from "react";
import { CiEdit } from "react-icons/ci";
import { IoMdSave } from "react-icons/io";
import { api } from "@/lib/api";

const DEFAULT_PRESS_TEMPLATE = `URGENT: Critical Information Released by [Your Name]

This press release is being distributed in accordance with a pre-arranged security protocol. The account holder has missed their scheduled check-in, triggering this automatic distribution.

The following information has been secured and is now available to designated recipients and the public:

[Brief description of what the information contains]

This release was configured in advance as a protective measure. All materials have been encrypted and verified for authenticity.

For access to the complete documentation, please visit the secure link provided to verified recipients.

Contact Information:
Distributed via: I Was Killed For This Information
Date: [Auto-generated]
Reference ID: [Auto-generated]`;

// NOTE FOR ADMIN: These tiers should be configurable via admin panel (count + price)
const REACH_TIERS = [
  { count: "250", label: "Media Outlets", price: null },
  { count: "500", label: "Media Outlets", price: "$495" },
  { count: "1,000+", label: "Media Outlets", price: "$695" },
];

// ── Alert Modal ───────────────────────────────────────────────────────────────
function AlertModal({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-blue-500 text-lg">ℹ️</span>
          <h4 className="font-bold text-gray-800 text-sm">Notice</h4>
        </div>
        <p className="text-sm text-gray-700 mb-5 leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2.5 rounded-lg transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default function PressRelease() {
  const [isActive, setIsActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [template, setTemplate] = useState(DEFAULT_PRESS_TEMPLATE);
  const [draft, setDraft] = useState(template);
  const [saved, setSaved] = useState(false);
  const [currentTier, setCurrentTier] = useState(0);
  const [category, setCategory] = useState("");
  const [tiers, setTiers] = useState<Array<{ count: string; label: string; price: string | null }>>(REACH_TIERS);

  // ── Alert Modal State ──
  const [subject, setSubject] = useState("URGENT: Critical Information Released");
  const [alertMessage, setAlertMessage] = useState("");
  const [isPurchased, setIsPurchased] = useState(false);

  const safeCurrentTier = currentTier >= 0 && currentTier < tiers.length ? currentTier : 0;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getPressRelease();
        setIsActive(res.data.is_active);
        setTemplate(res.data.template);
        setDraft(res.data.template);
        setCurrentTier(res.data.current_tier);
        setIsPurchased(res.data.is_purchased ?? false);
        if (res.data.category) {
          setCategory(res.data.category);
        }
        if (res.data.subject) {
          setSubject(res.data.subject);
        }
        if (res.data.tiers && res.data.tiers.length > 0) {
          setTiers(res.data.tiers);
        }
      } catch (err) {
        console.error("Failed to load press release template", err);
      }
    };
    void load();
  }, []);

  const handleEdit = () => {
    setDraft(template);
    setIsEditing(true);
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      const res = await api.savePressRelease({
        template: draft,
        subject: subject,
        category: category
      });
      setTemplate(res.data.template);
      if (res.data.subject) setSubject(res.data.subject);
      if (res.data.category) setCategory(res.data.category);
      setIsEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save press release template", err);
    }
  };

  const handleActiveToggle = async () => {
    const nextActive = !isActive;
    try {
      const res = await api.savePressRelease({ is_active: nextActive });
      setIsActive(res.data.is_active);
    } catch (err) {
      console.error("Failed to toggle press release status", err);
    }
  };

  const handleCancel = () => {
    setDraft(template);
    setIsEditing(false);
  };

  const handleUpgradeTier = async (tierIndex: number, priceStr: string | null) => {
    if (priceStr === null) return;
    try {
      const priceNum = parseFloat(priceStr.replace("$", ""));
      if (isNaN(priceNum)) {
        throw new Error("Invalid price for the selected tier.");
      }
      localStorage.setItem("checkout_amount", priceNum.toString());
      localStorage.setItem(
        "checkout_order_items",
        JSON.stringify([
          { label: `${tiers[tierIndex].count} Media Outlets Upgrade`, price: priceNum }
        ])
      );
      localStorage.setItem(
        "checkout_metadata",
        JSON.stringify({
          type: "press_release_upgrade",
          tier: tierIndex
        })
      );
      window.location.href = "/payment";
    } catch (err) {
      setAlertMessage(err instanceof Error ? err.message : "Failed to initiate payment.");
    }
  };

  const handleUpgradeNext = () => {
    const nextTierIndex = safeCurrentTier + 1;
    if (nextTierIndex < tiers.length && tiers[nextTierIndex].price) {
      void handleUpgradeTier(nextTierIndex, tiers[nextTierIndex].price);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 text-black space-y-6">

      {/* ── Alert Modal ── */}
      <AlertModal message={alertMessage} onClose={() => setAlertMessage("")} />

      {/* ── Page heading ── */}
      <div>
        <h1 className="block text-[2rem] md:text-[4rem] lg:text-[2rem] uppercase leading-none tracking-wide mt-4"
          style={{ fontFamily: "var(--font-anton)", fontWeight: 300 }}>Press Release</h1>
        <p className="text-sm text-gray-500 mt-4">Configure your media distribution upon missed check-in</p>
      </div>

      {/* Saved toast */}
      {saved && (
        <div className="bg-green-50 border border-green-300 text-green-800 text-sm px-4 py-3 rounded-xl">
          Press release template saved.
        </div>
      )}

      {/* ── Service Status Banner ── */}
      <div className="border border-gray-200 bg-white rounded-xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <div>
            <p className="text-sm font-bold">
              Press Release Service:{" "}
              <span className={isActive ? "text-green-600" : "text-red-500"}>
                {isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </p>
            <p className="text-green-600 text-sm mt-0.5">
              Configured for {tiers[safeCurrentTier]?.count ?? "250"} media organizations
            </p>
          </div>
        </div>
        <button
          onClick={handleActiveToggle}
          disabled={!isPurchased}
          className={`text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors ${
            !isPurchased
              ? "bg-gray-400 cursor-not-allowed opacity-80"
              : isActive
              ? "bg-red-500 hover:bg-red-400"
              : "bg-green-500 hover:bg-green-400"
          }`}
        >
          {isActive ? "DISABLE PRESS RELEASE" : "ENABLE PRESS RELEASE"}
        </button>
      </div>

      {/* ── Service Information ── */}
      <div className="border border-blue-200 bg-blue-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-blue-500">ℹ</span>
          <h3 className="font-bold text-sm text-blue-800">Press Release Service Information</h3>
        </div>
        <p className="text-sm text-gray-700 mb-3">
          Upon a failure to Check-In, you have selected a press release of{" "}
          <span className="text-blue-600 font-bold">{tiers[safeCurrentTier]?.count ?? "250"} Media Organizations.</span>
        </p>
        <div className="border border-gray-200 bg-white p-3 inline-block rounded-xl">
          <p className="text-xs text-gray-500 mb-0.5">The category selected is:</p>
          <p className="text-blue-600 font-bold text-sm">{category}</p>
        </div>
      </div>

      {/* ── Press Release Template ── */}
      <div className="border border-gray-200 bg-white rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">📄</span>
            <h3 className="font-bold text-sm text-gray-800">Press Release Template</h3>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                disabled={!isPurchased}
                className={`text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${
                  !isPurchased
                    ? "bg-gray-300 text-gray-400 cursor-not-allowed border border-gray-200"
                    : "bg-blue-600 hover:bg-blue-500 cursor-pointer"
                }`}
              >
                <CiEdit size={14} /> EDIT TEMPLATE
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-500 hover:bg-green-400 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <IoMdSave size={14} /> SAVE
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-white hover:bg-gray-100 text-gray-600 text-xs font-bold px-4 py-2 rounded-lg border border-gray-300 transition-colors cursor-pointer"
                >
                  × CANCEL
                </button>
              </>
            )}
          </div>
        </div>

        {/* Subject line */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Subject Bar</label>
          <input
            type="text"
            placeholder="Enter press release email subject..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            readOnly={!isEditing}
            className={`w-full text-sm px-4 py-3 rounded-lg border focus:outline-none transition-all ${
              isEditing ? "border-blue-400 bg-white focus:ring-2 focus:ring-blue-200" : "border-gray-200 bg-gray-100 text-gray-700 cursor-not-allowed"
            }`}
          />
        </div>

        {/* Category selector */}
        <div className="px-5 py-3 border-b border-gray-100 bg-white">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Category of Information</label>
          {isEditing ? (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
            >
              <option value="">Select a category...</option>
              {["Political Corruption", "Corporate Fraud", "Environmental Crimes", "Human Rights Violations", "Financial Misconduct", "Government Corruption"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={category || "Not Selected"}
              readOnly
              className="w-full text-sm px-3 py-2 rounded-lg border border-transparent bg-gray-50 text-gray-800 cursor-default"
            />
          )}
        </div>

        <textarea
          value={isEditing ? draft : template}
          onChange={e => setDraft(e.target.value)}
          readOnly={!isEditing}
          rows={16}
          className={`w-full text-sm px-5 py-4 leading-relaxed focus:outline-none resize-y ${isEditing
              ? "bg-white text-gray-900 border-0 focus:ring-2 focus:ring-inset focus:ring-blue-300"
              : "bg-gray-50 text-gray-700 cursor-default border-0"
            }`}
          style={{ fontFamily: "inherit", minHeight: "320px" }}
        />
      </div>

      {/* ── User Notes ── */}
      <div className="border border-red-200 bg-red-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-yellow-600">⚠</span>
          <h3 className="font-bold text-sm text-red-600">User Notes</h3>
        </div>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold mt-0.5 shrink-0">•</span>
            If you choose to pause this service you must add 1 or more trusted recipients.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 font-bold mt-0.5 shrink-0">•</span>
            Credits / Refunds are not available once purchased.
          </li>
        </ul>
      </div>

      {/* ── Expand Your Reach ── */}
      {/* NOTE FOR ADMIN: Tier count and price need to be admin-configurable via backend */}
      <div className="border border-gray-200 bg-white rounded-xl p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <h3 className="font-bold text-sm text-gray-800">Expand Your Reach</h3>
          <div className="flex gap-2">
            {/* FIX: UPGRADE button now shows modal instead of doing nothing */}
            <button
              onClick={handleUpgradeNext}
              className="bg-green-500 hover:bg-green-400 text-white text-xs font-bold px-5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              UPGRADE
            </button>
            {/* FIX: ORDER button now shows modal instead of doing nothing */}
            <button
              onClick={handleUpgradeNext}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold px-5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ORDER
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`border rounded-xl p-5 flex flex-col gap-3 transition-colors ${safeCurrentTier === index
                  ? "border-green-400 bg-green-50"
                  : "border-gray-200 bg-white"
                }`}
            >
              <div>
                <p className={`text-2xl font-black ${safeCurrentTier === index ? "text-green-600" : "text-gray-800"}`}>
                  {tier.count}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{tier.label}</p>
              </div>

              {safeCurrentTier === index ? (
                <span className="inline-block border border-green-500 text-green-600 text-xs font-bold px-3 py-1 rounded-lg w-fit">
                  {index === 0 ? "STANDARD (CURRENT)" : "CURRENT TIER"}
                </span>
              ) : index > safeCurrentTier ? (
                <button
                  onClick={() => handleUpgradeTier(index, tier.price)}
                  className="bg-green-500 hover:bg-green-400 text-white text-xs font-bold px-4 py-2 rounded-lg w-fit transition-colors cursor-pointer"
                >
                  UPGRADE — {tier.price}
                </button>
              ) : (
                <span className="inline-block border border-gray-300 text-gray-500 text-xs font-bold px-3 py-1 rounded-lg w-fit">
                  INCLUDED
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}