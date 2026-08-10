import { readFile } from "node:fs/promises";
import path from "node:path";
import type Anthropic from "@anthropic-ai/sdk";
import { extractFrames, isPhoto, probeDuration, STILL_SECONDS } from "@/lib/ffmpeg";
import type { Recipe } from "@/lib/recipes";
import { anthropic, EDIT_MODEL } from "./anthropic";

export interface ClipTag {
  clip: number; // index into the job's clips
  duration: number; // seconds
  summary: string; // one line of what's on screen
  quality: "good" | "ok" | "poor";
  bestStart: number; // seconds — start of the strongest moment
  bestEnd: number; // seconds — end of the strongest moment
  notes: string; // anything the planner should know (shaky, dark, etc.)
}

// How many frames to pull from a clip, scaled by its length but capped hard
// to keep vision-token cost low.
function sampleTimestamps(duration: number): number[] {
  if (duration <= 0) return [0];
  const count = Math.min(5, Math.max(2, Math.round(duration / 2.5)));
  const step = duration / (count + 1);
  return Array.from({ length: count }, (_, i) => +(step * (i + 1)).toFixed(3));
}

const RECORD_TOOL: Anthropic.Tool = {
  name: "record_clip",
  description:
    "Record your visual analysis of this one clip so it can be used to plan an edit.",
  input_schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "One short line describing what happens on screen.",
      },
      quality: {
        type: "string",
        enum: ["good", "ok", "poor"],
        description:
          "Overall usable quality. 'poor' means shaky, blurred, dark, or accidental.",
      },
      bestStart: {
        type: "number",
        description: "Start (seconds) of the single strongest stretch to use.",
      },
      bestEnd: {
        type: "number",
        description: "End (seconds) of the single strongest stretch to use.",
      },
      notes: {
        type: "string",
        description: "Anything the editor should know: motion, framing, issues.",
      },
    },
    required: ["summary", "quality", "bestStart", "bestEnd"],
  },
};

async function imageBlock(file: string): Promise<Anthropic.ImageBlockParam> {
  const data = await readFile(file);
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: "image/jpeg",
      data: data.toString("base64"),
    },
  };
}

async function tagOne(
  clip: number,
  clipPath: string,
  framesDir: string,
  recipe: Recipe,
): Promise<ClipTag> {
  const photo = isPhoto(clipPath);
  const duration = photo ? STILL_SECONDS : await probeDuration(clipPath);
  const timestamps = photo ? [0] : sampleTimestamps(duration);
  const frames = await extractFrames(clipPath, timestamps, framesDir);

  const content: Anthropic.ContentBlockParam[] = [
    {
      type: "text",
      text: photo
        ? `This is a single still photo. It will be shown for about ` +
          `${duration.toFixed(1)}s with a slow zoom. Describe what's in it and ` +
          `how it fits the format. Set bestStart to 0 and bestEnd to ${duration.toFixed(1)}.`
        : `Clip length: ${duration.toFixed(1)}s. Frames are labeled with their ` +
          `timestamp. bestStart/bestEnd must fall within 0 and ${duration.toFixed(1)}.`,
    },
  ];
  for (let i = 0; i < frames.length; i++) {
    if (!photo) content.push({ type: "text", text: `t=${timestamps[i].toFixed(1)}s` });
    content.push(await imageBlock(frames[i]));
  }

  const res = await anthropic().messages.create({
    model: EDIT_MODEL,
    max_tokens: 400,
    system: [
      {
        type: "text",
        text:
          "You are a sharp short-form video editor reviewing raw clips. " +
          `Format: ${recipe.name}. What matters: ${recipe.lookFor}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [RECORD_TOOL],
    tool_choice: { type: "tool", name: "record_clip" },
    messages: [{ role: "user", content }],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  const input = (block?.type === "tool_use" ? block.input : {}) as Partial<ClipTag>;

  const bestStart = photo ? 0 : clampNum(input.bestStart, 0, duration, 0);
  const bestEnd = photo
    ? duration
    : clampNum(input.bestEnd, bestStart, duration, duration);

  return {
    clip,
    duration,
    summary: input.summary ?? "",
    quality: input.quality ?? "ok",
    bestStart,
    bestEnd,
    notes: input.notes ?? "",
  };
}

function clampNum(
  v: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = typeof v === "number" ? v : Number.parseFloat(String(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// Tag every clip in order. Runs sequentially so vision calls hit the cached
// system prompt and we stay gentle on rate limits.
export async function tagClips(
  clipPaths: string[],
  framesDir: string,
  recipe: Recipe,
): Promise<ClipTag[]> {
  const tags: ClipTag[] = [];
  for (let i = 0; i < clipPaths.length; i++) {
    const dir = path.join(framesDir, `clip-${String(i).padStart(3, "0")}`);
    await ensureDir(dir);
    tags.push(await tagOne(i, clipPaths[i], dir, recipe));
  }
  return tags;
}

async function ensureDir(dir: string): Promise<void> {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(dir, { recursive: true });
}
