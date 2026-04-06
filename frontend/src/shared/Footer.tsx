"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const FOOTER_LINKS = [
  { title: "Privacy Policy", path: "/privacy-policy" },
  { title: "Terms of Service", path: "/terms-of-service" },
  { title: "Contact", path: "/contact" },
];

const CURRENT_YEAR = new Date().getFullYear();

const Footer = () => {
  const pathname = usePathname();

  return (
    <footer className="w-full border-t border-white/10 bg-black">
      <div className=" px-4 sm:px-6 lg:px-12">

        {/* ── Top Row: Logo + Nav Links ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-6">

          {/* Logo */}
          <div className="shrink-0">
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <Image
                src={"/website_logo/logo.svg"}
                width={50}
                height={50}
                alt="I_was_killed"
              />
              <div className="flex flex-col leading-none">
                <span className="block text-[2rem] md:text-[4rem] lg:text-[1.5rem] uppercase leading-none tracking-wide"
                  style={{ fontFamily: "var(--font-anton)", fontWeight: 400 }}>I WAS KILLED</span>
                <span className="block text-[2rem] md:text-[4rem] lg:text-[1rem] uppercase leading-none tracking-wide mt-1 text-[#EF3832]"
                  style={{ fontFamily: "var(--font-anton)", fontWeight: 400 }}>FOR THIS INFORMATION</span>
              </div>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-6 sm:gap-8">
            {FOOTER_LINKS.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`relative text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 group
                    ${isActive
                      ? "text-[#4CBB17]"
                      : "text-gray-300 hover:text-[#4CBB17] hover:bg-red-50/10"
                    }`}
                >
                  {link.title}
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#4CBB17] rounded-full transition-all duration-300
                      ${isActive ? "w-4/5" : "w-0 group-hover:w-4/5"}`}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-white/10" />

        {/* ── Bottom Row: Copyright ── */}
        <div className="py-5 text-center">
          <p className="text-gray-500 text-sm">
            © {CURRENT_YEAR} I WAS KILLED FOR THIS INFORMATION. Secure automated disclosure platform.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;