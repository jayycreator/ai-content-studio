"use client";

import { useEffect, useState } from "react";
import { PLANS } from "@/lib/plans";

const KEY = "onboarded";

const STEPS = [
  {
    eyebrow: "Step 1",
    title: "Drop the day\u2019s clips",
    body: "The coffee run, a pan over the quad, a walk between classes \u2014 raw and unsorted is fine. Drag them in or tap to choose.",
    art: "clips",
  },
  {
    eyebrow: "Step 2",
    title: "Pick a format, say the vibe",
    body: "Choose how it should cut \u2014 day-in-the-life, vlog recap, get-ready, or a hype montage \u2014 then add a one-line brief.",
    art: "format",
  },
  {
    eyebrow: "Step 3",
    title: "Get a finished short",
    body: "The AI watches your clips, picks the strong moments, trims the dead air, and hands back a ready-to-post 9:16 short to download.",
    art: "short",
  },
] as const;

function Art({ kind }: { kind: (typeof STEPS)[number]["art"] }) {
  if (kind === "clips") {
    return (
      <div className="space-y-2">
        {["walk to class", "coffee run", "quad pan"].map((c) => (
          <div
            key={c}
            className="flex items-center gap-3 rounded-lg border border-line bg-paper px-3 py-2.5"
          >
            <span className="h-7 w-11 shrink-0 rounded bg-ink/10" />
            <span className="truncate text-sm text-muted">{c}</span>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "format") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {["Day in the life", "Vlog recap", "Get ready", "Hype montage"].map(
          (name, i) => (
            <div
              key={name}
              className={`rounded-lg border p-3 text-left ${
                i === 0 ? "border-accent bg-accent-soft" : "border-line bg-paper"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <span
                  aria-hidden
                  className={`h-3 w-3 shrink-0 rounded-full border-2 ${
                    i === 0 ? "border-accent bg-accent" : "border-line"
                  }`}
                />
                {name}
              </span>
            </div>
          ),
        )}
      </div>
    );
  }
  return (
    <div className="mx-auto aspect-[9/16] w-28 rounded-xl border border-accent/30 bg-accent-soft p-2">
      <div className="flex h-full flex-col justify-end rounded-lg bg-accent/10 p-2">
        <div className="h-1.5 w-3/4 rounded-full bg-accent/60" />
        <div className="mt-1 h-1.5 w-1/2 rounded-full bg-accent/40" />
      </div>
    </div>
  );
}

export default function Onboarding() {
  const [open, setOpen] = useState(false);
  // 0-2 = info steps, 3 = tappable orb, 4 = pricing plans
  const [stage, setStage] = useState(0);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      // ignore storage errors
    }
  }, []);

  function finish() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore storage errors
    }
    setOpen(false);
  }

  // Tap the orb: play the burst, then reveal the pricing plans.
  function launch() {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setStage(4);
      return;
    }
    setLaunching(true);
    setTimeout(() => {
      setLaunching(false);
      setStage(4);
    }, 800);
  }

  if (!open) return null;

  // Pricing plans: shown after the orb. The X (and the Free CTA) drop the
  // user into the app on the free plan — so they see how much Free includes.
  if (stage === 4) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
        style={{ background: "var(--bg)" }}
        role="dialog"
        aria-modal="true"
        aria-label="Choose your plan"
      >
        <button
          type="button"
          onClick={finish}
          aria-label="Close and continue on the Free plan"
          className="btn-ghost fixed top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-lg bg-paper-2/80 text-muted backdrop-blur hover:text-ink sm:top-6 sm:right-6"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="reveal my-auto w-full max-w-3xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Pick a plan
            </h2>
            <p className="mt-3 text-muted">
              Start free — the full editor, no watermark. Upgrade whenever you
              need more.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`flex flex-col rounded-2xl border bg-paper-2 p-6 ${
                  plan.highlight
                    ? "border-accent/60 shadow-2xl"
                    : "border-line"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold tracking-tight">
                    {plan.name}
                  </h3>
                  {plan.highlight && (
                    <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-ink">
                      Most creators
                    </span>
                  )}
                </div>
                <p className="mt-2 font-display text-3xl font-semibold tracking-tight">
                  {plan.price}
                </p>
                <p className="mt-1 text-sm text-muted">{plan.tagline}</p>

                <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <svg
                        viewBox="0 0 24 24"
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span
                        className={
                          feature.endsWith("plus:")
                            ? "font-medium text-ink"
                            : "text-muted"
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={finish}
                  className={`mt-6 rounded-lg px-5 py-3 font-medium ${
                    plan.highlight
                      ? "btn-primary text-white"
                      : "btn-ghost"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // The tappable orb that warps into the pricing plans.
  if (stage === 3) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-9 px-6 text-center"
        style={{ background: "var(--bg)" }}
        role="dialog"
        aria-modal="true"
        aria-label="Get started with Lumen Create"
      >
        <button
          type="button"
          onClick={launch}
          disabled={launching}
          aria-label="Get started"
          className={`lumen-sphere lumen-sphere--live h-40 w-40 cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
            launching ? "sphere-burst" : ""
          }`}
        />
        <div
          className={
            launching
              ? "opacity-0 transition-opacity duration-300"
              : "reveal reveal-1"
          }
        >
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            You&rsquo;re all set
          </h2>
          <p className="mt-2 text-muted">Tap the orb to get started.</p>
        </div>
      </div>
    );
  }

  const step = STEPS[stage];
  const last = stage === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Lumen Create"
    >
      <div className="reveal w-full max-w-md rounded-2xl border border-line bg-paper-2 p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-accent-ink uppercase">
            {step.eyebrow} of {STEPS.length}
          </span>
          <button
            type="button"
            onClick={finish}
            className="text-sm text-muted hover:text-ink"
          >
            Skip
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-line bg-paper p-4">
          <Art kind={step.art} />
        </div>

        <h2 className="mt-6 font-display text-xl font-semibold tracking-tight">
          {step.title}
        </h2>
        <p className="mt-2 text-sm text-muted">{step.body}</p>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5" aria-hidden>
            {STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === stage ? "w-5 bg-accent" : "w-1.5 bg-line"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {stage > 0 && (
              <button
                type="button"
                onClick={() => setStage((n) => n - 1)}
                className="btn-ghost rounded-lg px-4 py-2.5 text-sm font-medium"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => setStage((n) => n + 1)}
              className="btn-primary rounded-lg px-5 py-2.5 text-sm font-medium text-white"
            >
              {last ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
