
"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

const ScrollToTopButton: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const toggleVisibility = () => setVisible(window.scrollY > 300);

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Smooth scroll with custom duration
  const scrollToTop = (duration = 600) => {
    const start = window.scrollY;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, start * (1 - progress));
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  return (
    visible && (
      <button
        onClick={() => scrollToTop(500)} 
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[#EF3832] text-white shadow-lg hover:bg-[#d32f2f] transition transform hover:scale-110 cursor-pointer"
        aria-label="Scroll to top"
      >
        <ArrowUp size={20} />
      </button>
    )
  );
};

export default ScrollToTopButton;