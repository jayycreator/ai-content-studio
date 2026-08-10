import path from "node:path";
import { planEdit } from "@/lib/ai/plan";
import { tagClips } from "@/lib/ai/vision";
import { env } from "@/lib/env";
import { normalizeAndConcat, type RenderSegment, renderPlan } from "@/lib/ffmpeg";
import { getRecipe } from "@/lib/recipes";
import { jobDir, outputPath, readJob, writeJob } from "./store";
import type { PlanSegment } from "./types";

// Keep only segments that point at a real clip and a valid, in-bounds window.
// Editor input is untrusted, so this guards the render from bad data.
function validateSegments(
  segments: PlanSegment[],
  clipCount: number,
  durations: number[],
): RenderSegment[] {
  const out: RenderSegment[] = [];
  for (const s of segments) {
    const clip = Number(s?.clip);
    if (!Number.isInteger(clip) || clip < 0 || clip >= clipCount) continue;
    const max = durations[clip] ?? Number.POSITIVE_INFINITY;
    let start = Number(s?.start);
    let end = Number(s?.end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    start = Math.max(0, Math.min(start, max));
    end = Math.max(0, Math.min(end, max));
    if (end - start < 0.3) continue;
    const caption =
      typeof s?.caption === "string" ? s.caption.trim().slice(0, 80) : undefined;
    out.push({ clip, start, end, caption: caption || undefined });
  }
  return out;
}

// Orchestrates a single job from queued -> done.
// AI path: sample frames -> Claude tags each clip -> Claude plans the edit ->
// FFmpeg renders the cut. Without an API key it falls back to a plain concat.
export async function processJob(id: string): Promise<void> {
  const job = await readJob(id);
  if (!job) return;

  await writeJob({ ...job, status: "processing" });

  try {
    const dir = jobDir(id);
    const inputs = job.clips.map((clip) => path.join(dir, clip));

    if (!env.hasAnthropicKey) {
      await normalizeAndConcat(inputs, outputPath(id));
      await writeJob({ ...job, status: "done" });
      return;
    }

    const recipe = getRecipe(job.recipeId);
    const framesDir = path.join(dir, "frames");
    const tags = await tagClips(inputs, framesDir, recipe);
    const plan = await planEdit(job.instruction, tags, recipe);
    // Initial version ships clip-only: assemble the cut without burning in
    // captions. Captions stay available as an opt-in in the editor.
    const segments = plan.segments.map((s) => ({ ...s, caption: undefined }));
    await renderPlan(inputs, segments, outputPath(id));

    await writeJob({
      ...job,
      status: "done",
      title: plan.title,
      plan: {
        title: plan.title,
        targetSeconds: plan.targetSeconds,
        segments,
      },
      clipDurations: tags.map((t) => t.duration),
    });
  } catch (err) {
    await writeJob({
      ...job,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// Re-render an existing job from an edited plan (captions and trims changed
// in the editor). Returns false if the job is missing or the edit is empty.
export async function rerenderJob(
  id: string,
  segments: PlanSegment[],
  title?: string,
): Promise<boolean> {
  const job = await readJob(id);
  if (!job) return false;

  const valid = validateSegments(
    segments,
    job.clips.length,
    job.clipDurations ?? [],
  );
  if (valid.length === 0) return false;

  const nextTitle = title?.trim() || job.title || "Untitled";
  await writeJob({ ...job, status: "processing", error: undefined });

  try {
    const dir = jobDir(id);
    const inputs = job.clips.map((clip) => path.join(dir, clip));
    await renderPlan(inputs, valid, outputPath(id));
    await writeJob({
      ...job,
      status: "done",
      title: nextTitle,
      plan: {
        title: nextTitle,
        targetSeconds: job.plan?.targetSeconds ?? 0,
        segments: valid,
      },
    });
  } catch (err) {
    await writeJob({
      ...job,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return true;
}
