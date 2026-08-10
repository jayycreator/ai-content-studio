export type BgPref = "gradient" | "black" | "white";

export function getStoredBg(): BgPref {
  if (typeof window === "undefined") return "gradient";
  const v = localStorage.getItem("bg");
  return v === "black" || v === "white" ? v : "gradient";
}

export function applyBg(pref: BgPref): void {
  const el = document.documentElement;
  el.classList.remove("mode-black", "mode-white");
  if (pref === "black") el.classList.add("mode-black");
  else if (pref === "white") el.classList.add("mode-white");

  if (pref === "gradient") localStorage.removeItem("bg");
  else localStorage.setItem("bg", pref);
}
