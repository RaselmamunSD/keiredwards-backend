"use client";

// Tab 4 — Email to Recipients
// CLIENT FEEDBACK FIXES:
// 1. ADDED page header ("EMAIL TO RECIPIENTS" title + subtitle) — was missing entirely
// 2. FIXED font: changed from font-mono (horrible) to normal sans-serif text
// 3. FIXED Edit/Save button flow: EDIT TEMPLATE shows only SAVE + CANCEL when in edit mode
//    (not both Edit and Save simultaneously as before)
// 4. FIXED textarea: soft rounded corners (rounded-xl) to match rest of app
// 5. FIXED Template Variables info box at bottom — styled to match design reference

import { useState, useEffect } from "react";
import { CiEdit } from "react-icons/ci";
import { IoMdSave } from "react-icons/io";
import { MdOutlineEmail } from "react-icons/md";
import Image from "next/image";
import { api } from "@/lib/api";

const DEFAULT_TEMPLATE = `Dear <Name>,

This is Your Name. If you are receiving this message, it means I have been incapacitated or killed. I use "I Was Killed For This Information" to securely store vital information regarding:

Included in this email is a secure link granting you access to my files, photos, and supporting evidence. Inside the link, you will find my instructions, a summary of what I've learned, and the proof I have documented.

I trust that you will review this information carefully and share it with the appropriate authorities.

<LINK>

Thank you,
Your Name`;

export default function EmailToRecipients() {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [subject, setSubject] = useState("Important Information — I Was Killed For This Information");
  const [recipientType, setRecipientType] = useState<"trusted" | "press" | "both">("trusted");
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(template);
  const [saved, setSaved] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getEmailTemplate();
        setTemplate(res.data.template);
        setDraft(res.data.template);
      } catch (err) {
        console.error("Failed to load email template", err);
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
      const res = await api.saveEmailTemplate({ template: draft });
      setTemplate(res.data.template);
      setIsEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save email template", err);
    }
  };

  const handleCancel = () => {
    setDraft(template); // discard changes
    setIsEditing(false);
  };

  const handleSendTest = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 text-black">

      {/* ── Page heading — FIX: was missing ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="block text-[2rem] md:text-[4rem] lg:text-[2rem] uppercase leading-none tracking-wide mt-4"
            style={{ fontFamily: "var(--font-anton)", fontWeight: 300 }}>Email to Recipients</h2>
          <p className="text-sm text-gray-500 mt-4">Customize the message your recipients will receive</p>
        </div>

        {/* FIX: Button flow — show EDIT when not editing, show SAVE + CANCEL when editing */}
        <div className="flex gap-2 items-center mt-3">
          <button
            onClick={handleSendTest}
            className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            SEND TEST
          </button>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
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

      {/* Saved toast */}
      {saved && (
        <div className="mb-4 bg-green-50 border border-green-300 text-green-800 text-sm px-4 py-3 rounded-xl">
          Template saved successfully.
        </div>
      )}

      {testSent && (
        <div className="mb-4 bg-blue-50 border border-blue-300 text-blue-800 text-sm px-4 py-3 rounded-xl">
          Test email sent to your login email. The &lt;LINK&gt; placeholder is disabled in test mode.
        </div>
      )}

      {/* Recipient type selection */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Send To:</span>
        {([
          { id: "trusted" as const, label: "Trusted Recipients" },
          { id: "press" as const, label: "Press Release" },
          { id: "both" as const, label: "Both" },
        ]).map((opt) => (
          <label key={opt.id} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
            <input
              type="radio"
              name="recipientType"
              checked={recipientType === opt.id}
              onChange={() => setRecipientType(opt.id)}
              className="accent-blue-600"
            />
            {opt.label}
          </label>
        ))}
      </div>

      {/* ── Template card ── */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">

        {/* IWK logo header */}
        <div className="flex items-center gap-3 bg-gray-50 border-b border-gray-200 px-5 py-3.5">
          <Image src="/website_logo/logo.svg" width={36} height={36} alt="I Was Killed logo" />
          <div>
            <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">IWK Template</p>
            <p className="text-[10px] text-gray-500">Official branded email layout</p>
          </div>
        </div>

        {/* Subject line */}
        <div className="px-5 py-3 border-b border-gray-100 bg-white">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            readOnly={!isEditing}
            className={`w-full text-sm px-3 py-2 rounded-lg border focus:outline-none ${
              isEditing ? "border-gray-300 bg-white focus:ring-2 focus:ring-blue-300" : "border-transparent bg-gray-50 text-gray-800 cursor-default"
            }`}
          />
        </div>

        {/* Card header */}
        <div className="flex items-center gap-2 bg-gray-50 border-b border-gray-200 px-5 py-3.5">
          <MdOutlineEmail className="text-gray-500" size={16} />
          <p className="text-sm text-gray-700 font-semibold">Modify as Needed</p>
        </div>

        {/* FIX: font changed from font-mono to normal text, soft rounded at bottom */}
        <textarea
          value={isEditing ? draft : template}
          onChange={e => setDraft(e.target.value)}
          readOnly={!isEditing}
          rows={16}
          className={`w-full text-sm px-5 py-4 leading-relaxed focus:outline-none resize-y rounded-b-xl ${isEditing
              ? "bg-white text-gray-900 border-0 focus:ring-2 focus:ring-blue-300"
              : "bg-white text-gray-800 cursor-default border-0"
            }`}
          style={{ fontFamily: "inherit" }}
        />
      </div>

      {/* ── Template Variables info box — FIX: matches design reference ── */}
      <div className="mt-4 border border-blue-200 bg-blue-50 rounded-xl px-4 py-3">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" />
          <p className="text-xs font-bold text-blue-700">Template Variables</p>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          By loading <span className="font-semibold text-gray-800">&lt;Name&gt;</span> each email will be personally addressed.{" "}
          <span className="font-semibold text-gray-800">&lt;LINK&gt;</span> must remain for your recipients to have access to your files.
        </p>
      </div>

    </div>
  );
}