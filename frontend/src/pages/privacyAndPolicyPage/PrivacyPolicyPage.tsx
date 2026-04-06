"use client";

// ── Types ──────────────────────────────────────────────────────────────────
interface PolicySection {
  id: string;
  title: string;
  content: string | string[];
}

// ── Data ──────────────────────────────────────────────────────────────────
const LAST_UPDATED = "March 9, 2026";
const CONTACT_EMAIL = "privacy@iwaskilled.com";

const POLICY_SECTIONS: PolicySection[] = [
  {
    id: "introduction",
    title: "1. Introduction",
    content:
      "Welcome to I Was Killed for This Information. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our secure disclosure platform.",
  },
  {
    id: "information-we-collect",
    title: "2. Information We Collect",
    content: [
      "Account Information: Name, email address, and encrypted password.",
      "Vault Content: Encrypted client-side before transmission. We never access your files.",
      "Usage Data: Login timestamps, check-in activity, and feature usage.",
      "Device Information: Device type, browser, IP address for security purposes.",
      "Payment Information: Processed securely via third-party processors. We do not store card details.",
    ],
  },
  {
    id: "how-we-use",
    title: "3. How We Use Information",
    content: [
      "To provide and maintain our secure disclosure platform.",
      "To process transactions and send purchase confirmations.",
      "To send check-in reminders based on your configured schedule.",
      "To monitor usage and improve platform performance.",
      "To detect and prevent fraud and security breaches.",
      "To comply with legal obligations.",
    ],
  },
  {
    id: "cookies",
    title: "4. Cookies and Tracking",
    content: [
      "Session Cookies: To keep you securely logged in.",
      "Security Cookies: To detect suspicious activity.",
      "Analytics Cookies: Privacy-respecting analytics with no personal data shared.",
      "You may disable cookies in your browser, but this may affect platform functionality.",
    ],
  },
  {
    id: "data-protection",
    title: "5. Data Protection",
    content: [
      "Zero-Knowledge Encryption: Files are encrypted on your device. We cannot read your vault.",
      "AES-256 Encryption: Military-grade protection at rest and in transit.",
      "Split-Key Architecture: No single party, including us, can access your data.",
      "Zero Admin Access: Administrators cannot access vault contents by design.",
      "Breach Protocol: Affected users notified within 72 hours of any security incident.",
    ],
  },
  {
    id: "third-party",
    title: "6. Third-Party Services",
    content: [
      "Payment Processors: Handle billing under their own privacy policies.",
      "Email Services: Only your email is shared for delivering notifications.",
      "Press Release: Public disclosures distributed to media only when triggered.",
      "We never sell or trade your personal information to third parties.",
    ],
  },
  {
    id: "user-rights",
    title: "7. Your Rights",
    content: [
      "Access: Request a copy of your personal data.",
      "Correction: Request correction of inaccurate information.",
      "Deletion: Delete your account and associated data at any time.",
      "Portability: Export your data in a machine-readable format.",
      "Withdraw Consent: Withdraw consent for data processing at any time.",
    ],
  },
  {
    id: "changes",
    title: "8. Changes to This Policy",
    content:
      "We may update this Privacy Policy at any time. When we do, we will update the date at the top and notify registered users by email. Continued use of the platform after changes constitutes acceptance of the updated policy.",
  },
  {
    id: "contact",
    title: "9. Contact Us",
    content: `For any questions or concerns about this Privacy Policy, contact us at ${CONTACT_EMAIL}. We will respond within 30 days.`,
  },
];

// ── Main Component ─────────────────────────────────────────────────────────
const PrivacyPolicyPage = () => {
  return (
    <section className="w-full py-16 sm:py-20 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs tracking-[0.3em] text-[#EF3832] uppercase font-semibold mb-3">
            Legal
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white uppercase tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-white/40 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-10">
          {POLICY_SECTIONS.map((section) => (
            <div key={section.id} id={section.id}>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-3 pb-3 border-b border-white/10">
                {section.title}
              </h2>
              {Array.isArray(section.content) ? (
                <ul className="flex flex-col gap-2">
                  {section.content.map((item, index) => (
                    <li key={index} className="flex gap-3 text-white/70 text-base leading-relaxed">
                      <span className="text-[#EF3832] shrink-0 mt-1">&#8250;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/70 text-base leading-relaxed">
                  {section.content}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <p className="text-white/40 text-sm leading-relaxed">
            For questions, contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#EF3832] hover:underline">
              {CONTACT_EMAIL}
            </a>.
          </p>
        </div>

      </div>
    </section>
  );
};

export default PrivacyPolicyPage;