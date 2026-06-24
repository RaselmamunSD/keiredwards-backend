"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const STORAGE_KEY = "iwk_masked_path";

function maskAddressBar() {
  const masked = `${window.location.origin}/`;
  if (window.location.href !== masked) {
    window.history.replaceState(
      window.history.state,
      "",
      masked
    );
  }
}

/**
 * Keeps the browser address bar showing only the site origin (e.g. https://iwaskilledforthisinformation.com/)
 * while Next.js client routing continues to work internally.
 */
export default function UrlMask() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const restoredOnReload = useRef(false);

  // After a reload on the masked "/" URL, restore the last in-app route.
  useEffect(() => {
    if (restoredOnReload.current) return;
    restoredOnReload.current = true;

    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const isReload = nav?.type === "reload";
    const saved = sessionStorage.getItem(STORAGE_KEY);

    if (isReload && pathname === "/" && saved && saved !== "/") {
      router.replace(saved);
    }
  }, [pathname, router]);

  // Persist the real route and mask the visible URL on every navigation.
  useEffect(() => {
    const route = pathname ?? "/";
    const query = searchParams?.toString() ?? "";
    const fullPath = query ? `${route}?${query}` : route;

    sessionStorage.setItem(STORAGE_KEY, fullPath);
    maskAddressBar();
  }, [pathname, searchParams]);

  // Re-apply mask if the user uses browser back/forward.
  useEffect(() => {
    const handlePopState = () => {
      maskAddressBar();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return null;
}
