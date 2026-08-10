import type Anthropic from "@anthropic-ai/sdk";
import type { RenderSegment } from "@/lib/ffmpeg";
import type { Recipe } from "@/lib/recipes";
import { anthropic, EDIT_MODEL } from "./anthropic";
import type { ClipTag } from "./vision";

export interface EditPlan {
  title: string;
  targetSeconds: number;
  segments: RenderSegment[];
}

// Pull an explicit length out of the creator's words ("40 second recap").
// Falls back to the recipe default.
function targetFromInstruction(instruction: string, fallback: number): number {
  const m = instruction.match(/(\d{1,3})\s*(s\b|sec|second)/i);
  if (m) {
    const n = Number.parseInt(m[1], 10);
    if (Number.isFinite(n) && n >= 8 && n <= 180) return n;
  }
  return fallback;
}

const BUILD_TOOL: Anthropic.Tool = {
  name: "build_edit",
  description:
    "Assemble the final edit as an ordered list of clip segments to keep.",
  input_schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "A short working title for the finished short.",
      },
      segments: {
        type: "array",
        description: "Segments to keep, in playback order.",
        items: {
          type: "object",
          properties: {
            clip: { type: "integer", description: "Clip index to cut from." },
            start: { type: "number", description: "Start time in seconds." },
            end: { type: "number", description: "End time in seconds." },
            caption: {
              type: "string",
              description:
                "Optional short on-screen caption (2-6 words) for this segment. " +
                "Leave empty if a caption would add nothing.",
            },
          },
          required: ["clip", "start", "end"],
        },
      },
    },
    required: ["segments"],
  },
};

function describeClips(tags: ClipTag[]): string {
  return tags
    .map(
      (t) =>
        `Clip ${t.clip}: ${t.duration.toFixed(1)}s, quality=${t.quality}. ` +
        `${t.summary} Best moment ~${t.bestStart.toFixed(1)}-${t.bestEnd.toFixed(1)}s.` +
        (t.notes ? ` Notes: ${t.notes}` : ""),
    )
    .join("\n");
}

// Keep only segments that map to a real clip and a valid, in-bounds window,
// enforcing the recipe's pacing bounds. Guarantees the render can't be fed junk.
function sanitize(
  raw: unknown,
  tags: ClipTag[],
  recipe: Recipe,
): RenderSegment[] {
  if (!Array.isArray(raw)) return [];
  const out: RenderSegment[] = [];
  for (const s of raw) {
    const clip = Number((s as RenderSegment)?.clip);
    const tag = tags[clip];
    if (!tag) continue;
    let start = Number((s as RenderSegment)?.start);
    let end = Number((s as RenderSegment)?.end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    start = Math.max(0, Math.min(start, tag.duration));
    end = Math.max(0, Math.min(end, tag.duration));
    if (end - start < 0.3) continue;
    if (end - start > recipe.maxSegment) end = start + recipe.maxSegment;
    const caption =
      typeof (s as RenderSegment)?.caption === "string"
        ? (s as RenderSegment).caption?.trim().slice(0, 80)
        : undefined;
    out.push({ clip, start, end, caption: caption || undefined });
  }
  return out;
}

// Fallback edit when the model returns nothing usable: each non-poor clip's
// best moment, in upload order.
function fallbackPlan(tags: ClipTag[], recipe: Recipe): RenderSegment[] {
  const usable = tags.filter((t) => t.quality !== "poor");
  const source = usable.length ? usable : tags;
  return source.map((t) => {
    let end = t.bestEnd;
    if (end - t.bestStart > recipe.maxSegment) end = t.bestStart + recipe.maxSegment;
    return { clip: t.clip, start: t.bestStart, end };
  });
}

export async function planEdit(
  instruction: string,
  tags: ClipTag[],
  recipe: Recipe,
): Promise<EditPlan> {
  const targetSeconds = targetFromInstruction(instruction, recipe.targetSeconds);

  const res = await anthropic().messages.create({
    model: EDIT_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text:
          "You are an expert short-form video editor cutting a vertical (9:16) short. " +
          `Format: ${recipe.name}. How to cut it: ${recipe.editGuidance}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [BUILD_TOOL],
    tool_choice: { type: "tool", name: "build_edit" },
    messages: [
      {
        role: "user",
        content:
          `Creator's request: "${instruction || "(none given)"}"\n` +
          `Target length: about ${targetSeconds} seconds. ` +
          `Keep each segment between ${recipe.minSegment} and ${recipe.maxSegment} seconds.\n\n` +
          `Here are the clips:\n${describeClips(tags)}\n\n` +
          "Build the edit. Drop poor-quality footage, avoid repeating similar shots " +
          "back to back, and get close to the target length. Add a short punchy " +
          "on-screen caption (2-6 words) to segments where it adds context or energy; " +
          "leave captions off shots that speak for themselves.",
      },
    ],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  const input = (block?.type === "tool_use" ? block.input : {}) as {
    title?: string;
    segments?: unknown;
  };

  let segments = sanitize(input.segments, tags, recipe);
  if (segments.length === 0) segments = fallbackPlan(tags, recipe);

  return {
    title: input.title?.trim() || recipe.name,
    targetSeconds,
    segments,
  };
}
