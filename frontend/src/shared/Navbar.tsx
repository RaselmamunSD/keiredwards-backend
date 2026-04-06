"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
  { title: "About", path: "/about" },
  { title: "How It Works", path: "/how-it-works" },
  { title: "Pricing", path: "/pricing" },
];

const HELP_URL = "https://help.iwaskilled.com";

// ── All paths where the nav should be locked for logged-in users ──
// Add any new authenticated routes here
const LOCKED_PATHS = [
  "/overview",
  "/settings",
  "/dashboard",
  "/check-in-email",
  "/check-in-schedule",
  "/trusted-recipients",
  "/email-to-recipients",
  "/press-release",
  "/documents-and-images",
  "/setup-accounting",
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, logout } = useAuth();

  // Lock nav when logged in AND on any authenticated/dashboard path
  const navLocked =
    isLoggedIn &&
    pathname &&
    LOCKED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    router.push("/");
  };

  return (
    <>
      <nav
        className={`w-full sticky top-0 z-50 py-2 transition-all duration-300 ${
          scrolled
            ? "bg-black/70 backdrop-blur-md shadow-md border-b border-white/10"
            : "bg-black"
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* ── Logo ── */}
          {navLocked ? (
            <div className="flex items-center gap-3 shrink-0 opacity-40 cursor-not-allowed select-none">
              <Image
                src={"/website_logo/logo.svg"}
                width={50}
                height={50}
                alt="I_was_killed"
              />
              <div className="flex flex-col justify-center leading-tight">
                <span
                  className="block text-[2rem] md:text-[4rem] lg:text-[1.5rem] uppercase leading-none tracking-wide"
                  style={{ fontFamily: "var(--font-anton)", fontWeight: 400 }}
                >
                  I WAS KILLED
                </span>
                <span
                  className="block text-[2rem] md:text-[4rem] lg:text-[1rem] uppercase leading-none tracking-wide mt-1 text-[#EF3832]"
                  style={{ fontFamily: "var(--font-anton)", fontWeight: 400 }}
                >
                  FOR THIS INFORMATION
                </span>
              </div>
            </div>
          ) : (
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <Image
                src={"/website_logo/logo.svg"}
                width={50}
                height={50}
                alt="I_was_killed"
              />
              <div className="flex flex-col justify-center leading-tight">
                <span
                  className="block text-[2rem] md:text-[4rem] lg:text-[1.5rem] uppercase leading-none tracking-wide"
                  style={{ fontFamily: "var(--font-anton)", fontWeight: 400 }}
                >
                  I WAS KILLED
                </span>
                <span
                  className="block text-[2rem] md:text-[4rem] lg:text-[1rem] uppercase leading-none tracking-wide mt-1 text-[#EF3832]"
                  style={{ fontFamily: "var(--font-anton)", fontWeight: 400 }}
                >
                  FOR THIS INFORMATION
                </span>
              </div>
            </Link>
          )}

          {/* ── Desktop Nav Links ── */}
          <ul className="hidden md:flex items-center gap-1 ml-auto mr-4">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.path;

              if (navLocked) {
                // Fully hidden when nav is locked on dashboard/settings pages
                return null;
              }

              return (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className={`relative text-base lg:text-lg px-3 py-1.5 rounded-lg transition-all duration-200 group
                      ${
                        isActive
                          ? "text-[#4CBB17]"
                          : "text-white hover:text-[#4CBB17] hover:bg-red-50/10"
                      }`}
                  >
                    {link.title}
                    <span
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#4CBB17] rounded-full transition-all duration-300
                        ${isActive ? "w-4/5" : "w-0 group-hover:w-4/5"}`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ── Desktop CTA Buttons ── */}
          <div className="hidden md:flex items-center gap-3">

            {/* Dashboard (logged in) or Login (logged out) */}
            {isLoggedIn ? (
              <Link
                href="/overview"
                className={`flex items-center gap-1.5 cursor-pointer text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 shadow-sm
                  ${
                    pathname === "/overview"
                      ? "border border-[#4CBB17] text-[#4CBB17] bg-red-50/10"
                      : "border border-[#4CBB17] text-[#4CBB17] hover:bg-red-50/10"
                  }`}
              >
                Dashboard <MdKeyboardDoubleArrowRight />
              </Link>
            ) : (
              <Link
                href="/login"
                className={`flex items-center gap-1.5 cursor-pointer text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 shadow-sm
                  ${
                    pathname === "/login"
                      ? "border border-[#4CBB17] text-[#4CBB17] bg-red-50/10"
                      : "border border-white/30 hover:border-[#4CBB17] hover:text-[#4CBB17] hover:bg-red-50/10 text-white"
                  }`}
              >
                Login <MdKeyboardDoubleArrowRight />
              </Link>
            )}

            {/* Protect Truth — always visible, disabled only when nav locked */}
            {navLocked ? (
              <span
                className="flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-full border border-white/10 text-white/30 cursor-not-allowed select-none"
                title="Not available on this page"
              >
                Protect Truth <MdKeyboardDoubleArrowRight />
              </span>
            ) : (
              <Link
                href="/register"
                className={`flex items-center gap-1.5 cursor-pointer text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200
                  ${
                    pathname === "/register"
                      ? "border border-[#4CBB17] text-[#4CBB17]"
                      : "border border-white/30 text-white hover:border-[#4CBB17] hover:text-[#4CBB17] hover:bg-red-50/10"
                  }`}
              >
                Protect Truth <MdKeyboardDoubleArrowRight />
              </Link>
            )}
          </div>

          {/* ── Mobile Toggle Button ── */}
          <button
            onClick={toggleMenu}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-lg text-white hover:text-[#4CBB17] hover:bg-red-50/10 transition-colors duration-200"
          >
            <svg
              className={`absolute w-5 h-5 transition-all duration-300 ${
                isOpen
                  ? "opacity-0 rotate-90 scale-50"
                  : "opacity-100 rotate-0 scale-100"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg
              className={`absolute w-5 h-5 transition-all duration-300 ${
                isOpen
                  ? "opacity-100 rotate-0 scale-100"
                  : "opacity-0 -rotate-90 scale-50"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Mobile Backdrop ── */}
      <div
        onClick={closeMenu}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* ── Mobile Drawer ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-black z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          {navLocked ? (
            <div className="flex items-center gap-3 shrink-0 opacity-40 cursor-not-allowed select-none">
              <Image src={"/website_logo/logo.svg"} width={40} height={40} alt="I_was_killed" />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-extrabold text-white uppercase">I WAS KILLED</span>
                <span className="text-sm font-extrabold text-[#EF3832] uppercase">FOR THIS INFORMATION</span>
              </div>
            </div>
          ) : (
            <Link href="/" onClick={closeMenu} className="flex items-center gap-3 shrink-0 group">
              <Image src={"/website_logo/logo.svg"} width={40} height={40} alt="I_was_killed" />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-extrabold text-white uppercase">I WAS KILLED</span>
                <span className="text-sm font-extrabold text-[#EF3832] uppercase">FOR THIS INFORMATION</span>
              </div>
            </Link>
          )}
        </div>

        {/* Drawer Nav Links */}
        <ul className="flex flex-col px-3 pt-5 gap-1 flex-1">

          {/* Public nav links — hidden entirely when navLocked */}
          {!navLocked && NAV_LINKS.map((link) => {
            const isActive = pathname === link.path;
            return (
              <li key={link.path}>
                <Link
                  href={link.path}
                  onClick={closeMenu}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                    ${
                      isActive
                        ? "bg-[#4CBB17] text-white shadow-md"
                        : "text-white hover:bg-red-50/10 hover:text-[#4CBB17]"
                    }`}
                >
                  <span>{link.title}</span>
                  <svg
                    className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            );
          })}

          {/* Help — always visible in drawer */}
          <li>
            <a
              href={HELP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white hover:bg-red-50/10 hover:text-[#4CBB17] transition-all duration-200 group"
            >
              <span>Help</span>
              <svg
                className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </li>

          {/* Dashboard — only when logged in */}
          {isLoggedIn && (
            <li>
              <Link
                href="/overview"
                onClick={closeMenu}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${
                    pathname === "/overview"
                      ? "bg-[#4CBB17] text-white shadow-md"
                      : "text-[#4CBB17] hover:bg-red-50/10"
                  }`}
              >
                <span>Dashboard</span>
                <svg
                  className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </li>
          )}

          {/* Logout — only when logged in */}
          {isLoggedIn && (
            <li className="mt-auto">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#EF3832] hover:bg-red-50/10 transition-all duration-200 group"
              >
                <span>Logout</span>
                <svg
                  className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </li>
          )}
        </ul>

        {/* Drawer Footer */}
        <div className="px-4 py-6 border-t border-white/10 flex flex-col gap-3">
          <p className="text-xs text-white/40 font-medium text-center tracking-wide uppercase mb-1">
            {isLoggedIn ? "Account" : "Get started"}
          </p>

          {isLoggedIn ? (
            <Link
              href="/overview"
              onClick={closeMenu}
              className="flex items-center justify-center gap-2 text-white text-sm font-semibold px-5 py-3 rounded-full transition-all duration-200 w-full bg-[#4CBB17] hover:bg-green-600"
            >
              Dashboard <MdKeyboardDoubleArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={closeMenu}
              className={`flex items-center justify-center gap-2 text-white text-sm font-semibold px-5 py-3 rounded-full transition-all duration-200 w-full
                ${pathname === "/login" ? "bg-red-700" : "bg-[#4CBB17] hover:bg-red-700"}`}
            >
              Login <MdKeyboardDoubleArrowRight className="w-4 h-4" />
            </Link>
          )}

          {/* Protect Truth — disabled when nav is locked */}
          {navLocked ? (
            <span
              className="flex items-center justify-center gap-2 text-sm font-semibold px-5 py-3 rounded-full border border-white/10 text-white/25 cursor-not-allowed select-none w-full"
              title="Not available on this page"
            >
              Protect Truth <MdKeyboardDoubleArrowRight className="w-4 h-4" />
            </span>
          ) : (
            <Link
              href="/register"
              onClick={closeMenu}
              className={`flex items-center justify-center gap-2 text-sm font-semibold px-5 py-3 rounded-full transition-all duration-200 w-full
                ${
                  pathname === "/register"
                    ? "border border-[#4CBB17] text-[#4CBB17]"
                    : "border border-white/30 text-white hover:border-[#4CBB17] hover:text-[#4CBB17] hover:bg-red-50/10"
                }`}
            >
              Protect Truth <MdKeyboardDoubleArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </aside>
    </>
  );
};

export default Navbar;