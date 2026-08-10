"use client";

import { useState } from "react";
import type { PlanSegment } from "@/lib/jobs/types";

interface Props {
  jobId: string;
  clipDurations: number[];
  initialSegments: PlanSegment[];
  initialTitle: string;
  onRerenderStart: () => void;
  onCancel: () => void;
}

const num = (v: string) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

export default function ProjectEditor({
  jobId,
  clipDurations,
  initialSegments,
  initialTitle,
  onRerenderStart,
  onCancel,
}: Props) {
  const [segments, setSegments] = useState<PlanSegment[]>(initialSegments);
  const [title, setTitle] = useState(initialTitle);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const patch = (i: number, next: Partial<PlanSegment>) =>
    setSegments((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...next } : s)),
    );

  const remove = (i: number) =>
    setSegments((prev) => prev.filter((_, idx) => idx !== i));

  const move = (i: number, dir: -1 | 1) =>
    setSegments((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  async function rerender() {
    if (segments.length === 0) {
      setError("Keep at least one segment.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/jobs/${jobId}/render`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ segments, title }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Re-render failed.");
      return;
    }
    onRerenderStart();
  }

  return (
    <div className="mt-6 border-t border-line pt-6">
      <label className="block">
        <span className="font-display text-sm font-semibold tracking-tight">
          Title
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>

      <p className="mt-6 font-display text-sm font-semibold tracking-tight">
        Segments
      </p>
      <p className="mt-1 text-xs text-muted">
        Reorder, retrim, rewrite the captions, or drop a shot. Captions burn
        into the lower third.
      </p>

      <ul className="mt-4 space-y-3">
        {segments.map((seg, i) => {
          const max = clipDurations[seg.clip] ?? seg.end;
          return (
            <li
              key={`${seg.clip}-${i}`}
              className="rounded-xl border border-line bg-paper p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-sm font-semibold tracking-tight">
                  Clip {seg.clip + 1}
                  <span className="ml-2 font-sans font-normal text-muted">
                    {max.toFixed(1)}s available
                  </span>
                </span>
                <div className="flex items-center gap-1 text-sm">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="rounded-md border border-line px-2 py-1 text-muted transition-colors hover:text-ink disabled:opacity-30"
                    aria-label="Move up"
                  >
                    &uarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === segments.length - 1}
                    className="rounded-md border border-line px-2 py-1 text-muted transition-colors hover:text-ink disabled:opacity-30"
                    aria-label="Move down"
                  >
                    &darr;
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="rounded-md border border-line px-2 py-1 text-muted transition-colors hover:text-accent-ink"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <input
                value={seg.caption ?? ""}
                onChange={(e) => patch(i, { caption: e.target.value })}
                placeholder="On-screen caption (optional)"
                maxLength={80}
                className="mt-3 w-full rounded-lg border border-line bg-paper-2 px-3 py-2 text-sm outline-none focus:border-accent"
              />

              <div className="mt-3 flex flex-wrap gap-4">
                <label className="text-xs text-muted">
                  Start (s)
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    max={max}
                    value={seg.start}
                    onChange={(e) =>
                      patch(i, {
                        start: Math.max(0, Math.min(num(e.target.value), max)),
                      })
                    }
                    className="mt-1 block w-24 rounded-lg border border-line bg-paper-2 px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
                  />
                </label>
                <label className="text-xs text-muted">
                  End (s)
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    max={max}
                    value={seg.end}
                    onChange={(e) =>
                      patch(i, {
                        end: Math.max(0, Math.min(num(e.target.value), max)),
                      })
                    }
                    className="mt-1 block w-24 rounded-lg border border-line bg-paper-2 px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
                  />
                </label>
              </div>
            </li>
          );
        })}
      </ul>

      {error && <p className="mt-4 text-sm text-accent-ink">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={rerender}
          disabled={submitting || segments.length === 0}
          className="btn-primary rounded-lg px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Rendering\u2026" : "Re-render short"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost rounded-lg px-5 py-3 font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
