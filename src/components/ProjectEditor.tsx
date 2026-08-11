"use client";

import { type PointerEvent as ReactPointerEvent, useRef, useState } from "react";
import type { PlanSegment } from "@/lib/jobs/types";

interface Props {
  jobId: string;
  clipDurations: number[];
  initialSegments: PlanSegment[];
  initialTitle: string;
  onRerenderStart: () => void;
  onCancel: () => void;
}

const MIN_SEG = 0.3;
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(v, hi));
const num = (v: string) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const fmt = (s: number) => `${s.toFixed(1)}s`;

// A distinct hue per source clip, so a clip reused across segments is
// recognizable at a glance on the track.
const clipHue = (clip: number) => (clip * 63) % 360;

type Drag =
  | {
      kind: "trim";
      i: number;
      edge: "start" | "end";
      startX: number;
      secPerPx: number;
      origStart: number;
      origEnd: number;
      clipMax: number;
    }
  | { kind: "move"; i: number };

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
  const [selected, setSelected] = useState<number | null>(
    initialSegments.length ? 0 : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  const durations = segments.map((s) => Math.max(MIN_SEG, s.end - s.start));
  const total = durations.reduce((a, b) => a + b, 0) || 1;

  const patch = (i: number, next: Partial<PlanSegment>) =>
    setSegments((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...next } : s)),
    );

  const remove = (i: number) => {
    setSegments((prev) => prev.filter((_, idx) => idx !== i));
    const nextLen = segments.length - 1;
    setSelected(nextLen <= 0 ? null : Math.min(selected ?? 0, nextLen - 1));
  };

  const moveBy = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= segments.length) return;
    setSegments((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setSelected(j);
  };

  function indexAtX(x: number, width: number): number {
    let acc = 0;
    for (let i = 0; i < durations.length; i++) {
      acc += (durations[i] / total) * width;
      if (x < acc) return i;
    }
    return Math.max(0, durations.length - 1);
  }

  function beginTrim(
    e: ReactPointerEvent,
    i: number,
    edge: "start" | "end",
  ) {
    e.stopPropagation();
    const track = trackRef.current;
    if (!track) return;
    track.setPointerCapture(e.pointerId);
    const width = track.getBoundingClientRect().width || 1;
    const seg = segments[i];
    drag.current = {
      kind: "trim",
      i,
      edge,
      startX: e.clientX,
      secPerPx: total / width,
      origStart: seg.start,
      origEnd: seg.end,
      clipMax: clipDurations[seg.clip] ?? seg.end,
    };
    setSelected(i);
  }

  function beginMove(e: ReactPointerEvent, i: number) {
    const track = trackRef.current;
    if (!track) return;
    track.setPointerCapture(e.pointerId);
    drag.current = { kind: "move", i };
    setSelected(i);
  }

  function onPointerMove(e: ReactPointerEvent) {
    const d = drag.current;
    if (!d) return;
    if (d.kind === "trim") {
      const deltaSec = (e.clientX - d.startX) * d.secPerPx;
      if (d.edge === "start") {
        patch(d.i, {
          start: clamp(d.origStart + deltaSec, 0, d.origEnd - MIN_SEG),
        });
      } else {
        patch(d.i, {
          end: clamp(d.origEnd + deltaSec, d.origStart + MIN_SEG, d.clipMax),
        });
      }
      return;
    }
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const target = indexAtX(clamp(e.clientX - rect.left, 0, rect.width), rect.width);
    if (target !== d.i) {
      setSegments((prev) => {
        const next = [...prev];
        const [moved] = next.splice(d.i, 1);
        next.splice(target, 0, moved);
        return next;
      });
      d.i = target;
      setSelected(target);
    }
  }

  function endDrag(e: ReactPointerEvent) {
    drag.current = null;
    const track = trackRef.current;
    if (track?.hasPointerCapture(e.pointerId))
      track.releasePointerCapture(e.pointerId);
  }

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

  const sel = selected !== null ? segments[selected] : null;
  const selMax = sel ? clipDurations[sel.clip] ?? sel.end : 0;

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

      <div className="mt-6 flex items-baseline justify-between">
        <p className="font-display text-sm font-semibold tracking-tight">
          Timeline
        </p>
        <span className="text-xs text-muted">{fmt(total)} total</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Drag a clip to reorder, drag its edges to trim. Tap a clip to edit its
        caption below.
      </p>

      {segments.length === 0 ? (
        <p className="mt-4 rounded-xl border border-line bg-paper p-4 text-sm text-muted">
          No clips left. Add one back by starting over, or cancel.
        </p>
      ) : (
        <div
          ref={trackRef}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="mt-4 flex h-16 w-full touch-none select-none overflow-hidden rounded-xl border border-line bg-paper-2"
        >
          {segments.map((seg, i) => {
            const active = i === selected;
            const hue = clipHue(seg.clip);
            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: order is the identity here
                key={i}
                onPointerDown={(e) => beginMove(e, i)}
                style={{
                  width: `${(durations[i] / total) * 100}%`,
                  minWidth: 44,
                  background: `hsl(${hue} 64% ${active ? 56 : 40}%)`,
                }}
                className={`group relative flex cursor-grab touch-none items-center justify-center border-r border-black/25 last:border-r-0 ${
                  active ? "z-10 ring-2 ring-inset ring-white/85" : ""
                }`}
              >
                <span
                  onPointerDown={(e) => beginTrim(e, i, "start")}
                  className="absolute left-0 top-0 h-full w-2.5 cursor-ew-resize bg-black/30 group-hover:bg-black/50"
                />
                <span className="pointer-events-none px-1 text-center leading-tight text-white">
                  <span className="block text-[11px] font-semibold">
                    {seg.clip + 1}
                  </span>
                  <span className="block text-[10px] text-white/85">
                    {fmt(durations[i])}
                  </span>
                </span>
                <span
                  onPointerDown={(e) => beginTrim(e, i, "end")}
                  className="absolute right-0 top-0 h-full w-2.5 cursor-ew-resize bg-black/30 group-hover:bg-black/50"
                />
              </div>
            );
          })}
        </div>
      )}

      {sel && selected !== null && (
        <div className="mt-4 rounded-xl border border-line bg-paper p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-display text-sm font-semibold tracking-tight">
              Clip {sel.clip + 1}
              <span className="ml-2 font-sans font-normal text-muted">
                {selMax.toFixed(1)}s available
              </span>
            </span>
            <div className="flex items-center gap-1 text-sm">
              <button
                type="button"
                onClick={() => moveBy(selected, -1)}
                disabled={selected === 0}
                className="rounded-md border border-line px-2 py-1 text-muted transition-colors hover:text-ink disabled:opacity-30"
                aria-label="Move earlier"
              >
                &larr;
              </button>
              <button
                type="button"
                onClick={() => moveBy(selected, 1)}
                disabled={selected === segments.length - 1}
                className="rounded-md border border-line px-2 py-1 text-muted transition-colors hover:text-ink disabled:opacity-30"
                aria-label="Move later"
              >
                &rarr;
              </button>
              <button
                type="button"
                onClick={() => remove(selected)}
                className="rounded-md border border-line px-2 py-1 text-muted transition-colors hover:text-accent-ink"
              >
                Remove
              </button>
            </div>
          </div>

          <input
            value={sel.caption ?? ""}
            onChange={(e) => patch(selected, { caption: e.target.value })}
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
                max={selMax}
                value={sel.start}
                onChange={(e) =>
                  patch(selected, {
                    start: clamp(num(e.target.value), 0, sel.end - MIN_SEG),
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
                max={selMax}
                value={sel.end}
                onChange={(e) =>
                  patch(selected, {
                    end: clamp(num(e.target.value), sel.start + MIN_SEG, selMax),
                  })
                }
                className="mt-1 block w-24 rounded-lg border border-line bg-paper-2 px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
              />
            </label>
          </div>
        </div>
      )}

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
