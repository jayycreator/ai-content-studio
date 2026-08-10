"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProjectEditor from "@/components/ProjectEditor";
import type { PlanSegment } from "@/lib/jobs/types";
import { FREE_FORMATS_LABEL, isAcceptedFile } from "@/lib/plans";

type Phase = "idle" | "working" | "done" | "error";

type RecipeOption = { id: string; name: string; blurb: string };

const statusCopy: Record<string, string> = {
  queued: "Queued\u2026",
  processing: "Building your short\u2026",
  done: "Ready",
  error: "Something went wrong",
};

export default function Uploader({
  initialJobId,
  recipes = [],
}: {
  initialJobId?: string;
  recipes?: RecipeOption[];
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [instruction, setInstruction] = useState("");
  const [recipeId, setRecipeId] = useState(recipes[0]?.id ?? "");
  const [phase, setPhase] = useState<Phase>(initialJobId ? "working" : "idle");
  const [status, setStatus] = useState<string>("queued");
  const [jobId, setJobId] = useState<string | null>(initialJobId ?? null);
  const [title, setTitle] = useState<string | null>(null);
  const [segments, setSegments] = useState<PlanSegment[]>([]);
  const [clipDurations, setClipDurations] = useState<number[]>([]);
  const [editing, setEditing] = useState(false);
  const [videoNonce, setVideoNonce] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Apply a fetched job record to local state. Centralized so the initial
  // load and the poll behave identically.
  const applyJob = useCallback(
    (job: {
      status: string;
      title?: string;
      error?: string;
      plan?: { segments: PlanSegment[] };
      clipDurations?: number[];
    }) => {
      setStatus(job.status);
      if (job.title) setTitle(job.title);
      if (job.status === "done") {
        setSegments(job.plan?.segments ?? []);
        setClipDurations(job.clipDurations ?? []);
        setVideoNonce(Date.now());
        setEditing(false);
        setPhase("done");
      } else if (job.status === "error") {
        setError(job.error ?? "Processing failed.");
        setPhase("error");
      } else {
        setPhase("working");
      }
    },
    [],
  );

  // Reopening a saved draft: pull its current state right away.
  useEffect(() => {
    if (!initialJobId) return;
    (async () => {
      const res = await fetch(`/api/jobs/${initialJobId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setError("This project could not be found.");
        setPhase("error");
        return;
      }
      applyJob(await res.json());
    })();
  }, [initialJobId, applyJob]);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const all = Array.from(incoming);
    const accepted = all.filter((f) => isAcceptedFile("free", f.name));
    setFiles((prev) => [...prev, ...accepted]);
    if (accepted.length < all.length) {
      setError(`Some files were skipped. Supported formats: ${FREE_FORMATS_LABEL}.`);
    } else {
      setError(null);
    }
  }, []);

  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  useEffect(() => {
    if (phase !== "working" || !jobId) return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
      if (!res.ok) return;
      const job = await res.json();
      if (job.status === "done" || job.status === "error") {
        clearInterval(timer);
      }
      applyJob(job);
    }, 1500);
    return () => clearInterval(timer);
  }, [phase, jobId, applyJob]);

  function startRerender() {
    setEditing(false);
    setError(null);
    setStatus("processing");
    setPhase("working");
  }

  async function handleSubmit() {
    if (files.length === 0) return;
    setError(null);
    setPhase("working");
    setStatus("queued");

    const body = new FormData();
    body.set("instruction", instruction);
    if (recipeId) body.set("recipeId", recipeId);
    files.forEach((f) => body.append("clips", f));

    const res = await fetch("/api/jobs", { method: "POST", body });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed.");
      setPhase("error");
      return;
    }
    const data = await res.json();
    setJobId(data.id);
  }

  function reset() {
    setFiles([]);
    setInstruction("");
    setJobId(null);
    setTitle(null);
    setSegments([]);
    setClipDurations([]);
    setEditing(false);
    setError(null);
    setStatus("queued");
    setPhase("idle");
  }

  if (phase === "working") {
    return (
      <div className="rounded-2xl border border-line bg-paper-2 p-8 text-center">
        <div
          aria-hidden
          className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-line border-t-accent"
        />
        <p className="mt-5 font-display text-lg font-semibold tracking-tight">
          {statusCopy[status] ?? "Working\u2026"}
        </p>
        <p className="mt-1 text-sm text-muted">
          Watching your clips, picking the good moments, and cutting them to a
          9:16 short. This can take a moment.
        </p>
      </div>
    );
  }

  if (phase === "done" && jobId) {
    return (
      <div className="rounded-2xl border border-line bg-paper-2 p-6">
        <p className="font-display text-lg font-semibold tracking-tight">
          {title || "Your short is ready"}
        </p>
        <p className="mt-1 text-sm text-muted">
          The AI watched your clips, picked the strongest moments, and cut them
          to a 9:16 short. Saved to your projects.
        </p>
        <video
          key={videoNonce}
          controls
          playsInline
          className="mt-5 aspect-[9/16] w-full max-w-[280px] rounded-xl border border-line bg-black"
          src={`/api/jobs/${jobId}/download?v=${videoNonce}`}
        />
        {editing ? (
          <ProjectEditor
            jobId={jobId}
            clipDurations={clipDurations}
            initialSegments={segments}
            initialTitle={title || "Untitled"}
            onRerenderStart={startRerender}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`/api/jobs/${jobId}/download?dl=1`}
              className="btn-primary rounded-lg px-5 py-3 font-medium text-white"
            >
              Download MP4
            </a>
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={segments.length === 0}
              className="btn-ghost rounded-lg px-5 py-3 font-medium disabled:opacity-40"
            >
              Edit captions &amp; cuts
            </button>
            <button
              type="button"
              onClick={reset}
              className="btn-ghost rounded-lg px-5 py-3 font-medium"
            >
              Start another
          </button>
          <a
            href="/projects"
            className="btn-ghost rounded-lg px-5 py-3 font-medium"
          >
            All projects
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragging
            ? "border-accent bg-accent-soft"
            : "border-line bg-paper-2 hover:border-accent/50"
        }`}
      >
        <p className="font-display text-lg font-semibold tracking-tight">
          Drop the day&rsquo;s clips &amp; photos
        </p>
        <p className="mt-1 text-sm text-muted">
          or click to choose &mdash; videos or photos ({FREE_FORMATS_LABEL})
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="video/*,image/*,.mov,.mp4,.m4v,.heic,.heif,.jpg,.jpeg,.png"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper px-3 py-2.5"
            >
              <span className="truncate text-sm">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="shrink-0 text-sm text-muted hover:text-accent-ink"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {recipes.length > 0 && (
        <div className="mt-6">
          <span className="font-display text-sm font-semibold tracking-tight">
            Pick a format
          </span>
          <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
            {recipes.map((r) => {
              const active = r.id === recipeId;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRecipeId(r.id)}
                  aria-pressed={active}
                  className={`rounded-xl border p-3.5 text-left transition-colors ${
                    active
                      ? "border-accent bg-accent-soft"
                      : "border-line bg-paper-2 hover:border-accent/50"
                  }`}
                >
                  <span className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
                    <span
                      aria-hidden
                      className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                        active ? "border-accent bg-accent" : "border-line"
                      }`}
                    />
                    {r.name}
                  </span>
                  <span className="mt-1 block pl-[22px] text-xs text-muted">
                    {r.blurb}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <label className="mt-6 block">
        <span className="font-display text-sm font-semibold tracking-tight">
          What do you want?
        </span>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={2}
          placeholder="Tight 40-second morning recap, upbeat."
          className="mt-2 w-full resize-none rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <span className="mt-1 block text-xs text-muted">
          Saved with your clips &mdash; the AI engine will use this next phase.
        </span>
      </label>

      {error && <p className="mt-4 text-sm text-accent-ink">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={files.length === 0}
        className="btn-primary mt-6 rounded-lg px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Create my short
      </button>
    </div>
  );
}
