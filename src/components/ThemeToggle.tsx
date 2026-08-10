"use client";

import { useEffect, useState } from "react";
import { applyBg, getStoredBg, type BgPref } from "@/lib/theme";

const ORDER: BgPref[] = ["gradient", "black", "white"];
const LABEL: Record<BgPref, string> = {
  gradient: "Gradient",
  black: "Black",
  white: "White",
};

export default function ThemeToggle() {
  const [bg, setBg] = useState<BgPref>("gradient");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setBg(getStoredBg());
    setMounted(true);
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(bg) + 1) % ORDER.length];
    setBg(next);
    applyBg(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Background: ${LABEL[bg]}. Click to change.`}
      title={`Background: ${LABEL[bg]}`}
      className="btn-ghost grid h-9 w-9 place-items-center rounded-lg text-muted hover:text-ink"
    >
      {mounted && bg === "gradient" && (
        <span
          aria-hidden
          className="h-4 w-4 rounded-full"
          style={{ background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)" }}
        />
      )}
      {mounted && bg === "black" && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
      {mounted && bg === "white" && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}
