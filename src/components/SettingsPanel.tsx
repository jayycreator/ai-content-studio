"use client";

import { useEffect, useState } from "react";
import { applyBg, getStoredBg, type BgPref } from "@/lib/theme";

const OPTIONS: { value: BgPref; label: string }[] = [
  { value: "gradient", label: "Gradient" },
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
];

export default function SettingsPanel() {
  const [pref, setPref] = useState<BgPref>("gradient");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPref(getStoredBg());
    setName(localStorage.getItem("profile.name") ?? "");
    setHandle(localStorage.getItem("profile.handle") ?? "");
  }, []);

  function choose(next: BgPref) {
    setPref(next);
    applyBg(next);
  }

  function saveProfile() {
    localStorage.setItem("profile.name", name.trim());
    localStorage.setItem("profile.handle", handle.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="space-y-10">
      <section className="reveal reveal-1">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Appearance
        </h2>
        <p className="mt-1 text-sm text-muted">
          Choose the backdrop. Gradient is the signature look; Black and White
          are clean, minimal alternatives.
        </p>
        <div className="mt-4 inline-flex rounded-xl border border-line bg-paper-2 p-1">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => choose(opt.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                pref === opt.value
                  ? "bg-accent text-white"
                  : "text-muted hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="reveal reveal-2 border-t border-line pt-10">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Profile
        </h2>
        <p className="mt-1 text-sm text-muted">
          Saved locally on this device for now — accounts come with the hosted
          release.
        </p>
        <div className="mt-4 max-w-md space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Display name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jayden"
              className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Handle</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@yourhandle"
              className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveProfile}
              className="btn-primary rounded-lg px-5 py-3 font-medium"
            >
              Save profile
            </button>
            {saved && (
              <span className="text-sm font-medium text-accent-ink">Saved</span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
