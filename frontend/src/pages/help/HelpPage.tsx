"use client";

import { useState } from "react";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: "general",
    question: "What is I Was Killed For This Information?",
    answer: "I Was Killed for This Information is a secure-release dead-man's switch platform. It is designed to safeguard sensitive files, documents, and disclosures. If you become incapacitated, arrested, or pass away, the system automatically distributes your files to your trusted recipients or media organizations.",
  },
  {
    category: "checkin",
    question: "How does the Check-In system work?",
    answer: "You configure a check-in frequency (e.g., daily, weekly, monthly) and check in regularly via the dashboard or magic link. If you miss a scheduled check-in, the system enters a warning stage and triggers a grace period. If the grace period expires without you checking in, your vault is automatically triggered for distribution.",
  },
  {
    category: "security",
    question: "Are my uploaded files secure and private?",
    answer: "Yes, absolutely. We use zero-knowledge client-side encryption. All files are encrypted in your browser using AES-256 before they are uploaded. The encryption keys are derived from your credentials and never sent to our servers. We have absolutely no way to access or decrypt your files, nor do server administrators.",
  },
  {
    category: "recipients",
    question: "How do my trusted recipients get my files?",
    answer: "When your dead-man's switch is triggered, our servers automatically send secure, one-time decryption magic links to your configured trusted recipients. They can click these links to download and decrypt the files you've stored for them.",
  },
  {
    category: "press",
    question: "What is the Press Release feature?",
    answer: "If you purchase a Press Release add-on, your vault contents will be dispatched directly to leading media outlets and investigative journalism organizations when your switch is triggered. This ensures your information achieves maximum public exposure even if your trusted recipients are unable to share it.",
  },
  {
    category: "security",
    question: "Can I retrieve my password if I lose it?",
    answer: "No. Because we operate on a zero-knowledge architecture, we do not store your plain text password or have a recovery mechanism. If you lose your credentials, your vault becomes permanently locked and cannot be decrypted, ensuring that no unauthorized entity can spoof a recovery attempt to steal your data.",
  },
  {
    category: "general",
    question: "How do I delete my account and files?",
    answer: "You can permanently delete your vault and account at any time by going to the 'Settings & Configuration' panel on your dashboard. Enter your credentials to verify, and all of your stored files and keys will be immediately and irreversibly purged from our storage systems.",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Topics" },
  { id: "general", label: "General" },
  { id: "checkin", label: "Check-In" },
  { id: "security", label: "Security & Keys" },
  { id: "recipients", label: "Recipients" },
  { id: "press", label: "Press Release" },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const toggleAccordion = (index: number) => {
    if (openIndexes.includes(index)) {
      setOpenIndexes(openIndexes.filter((i) => i !== index));
    } else {
      setOpenIndexes([...openIndexes, index]);
    }
  };

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="w-full min-h-screen py-16 sm:py-20 px-4 bg-black text-white">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] text-[#EF3832] uppercase font-bold mb-3">
            Support center
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider mb-4 font-bebas">
            Help &amp; Documentation
          </h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto leading-relaxed">
            Find answers to frequently asked questions about security, check-in schedules, file encryption, and trusted recipients.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-10 max-w-xl mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#111] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setOpenIndexes([]);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border
                ${
                  activeCategory === cat.id
                    ? "bg-[#EF3832] border-[#EF3832] text-white"
                    : "bg-[#111] border-[#222] text-gray-400 hover:text-white hover:border-gray-600"
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4 mb-16">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const globalIndex = FAQ_ITEMS.indexOf(faq);
              const isOpen = openIndexes.includes(globalIndex);
              return (
                <div
                  key={idx}
                  className="border border-[#222] bg-[#111]/40 rounded-xl overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleAccordion(globalIndex)}
                    className="w-full text-left px-6 py-5 flex justify-between items-center gap-4 hover:bg-[#111]/80 cursor-pointer transition-colors"
                  >
                    <span className="font-semibold text-base text-gray-200 hover:text-white transition-colors leading-snug">
                      {faq.question}
                    </span>
                    <span className={`text-xl transform transition-transform duration-200 text-[#EF3832] ${isOpen ? "rotate-180" : ""}`}>
                      ▼
                    </span>
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? "max-h-96 opacity-100 border-t border-[#222]" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="px-6 py-5 text-gray-400 text-sm leading-relaxed bg-black/30">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 border border-dashed border-[#333] rounded-xl">
              <p className="text-gray-500 text-sm mb-2">No help articles found matching your criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="text-[#EF3832] text-xs font-bold uppercase tracking-wider hover:underline"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Contact/Support Footer */}
        <div className="border-t border-[#222] pt-8 text-center">
          <p className="text-gray-500 text-sm mb-4">
            Still have questions or need specific support with your account?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center bg-transparent border border-white hover:bg-white hover:text-black text-white font-bold text-xs px-8 py-3.5 rounded-lg uppercase tracking-widest transition-colors duration-150"
          >
            Contact Support
          </Link>
        </div>

      </div>
    </section>
  );
}
