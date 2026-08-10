import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error("ffmpeg binary not found"));
      return;
    }
    execFile(
      ffmpegPath,
      args,
      { maxBuffer: 1024 * 1024 * 16 },
      (err, _stdout, stderr) => {
        if (err) {
          reject(new Error(stderr?.slice(-2000) || err.message));
          return;
        }
        resolve();
      },
    );
  });
}

function runFfprobe(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      ffprobeStatic.path,
      args,
      { maxBuffer: 1024 * 1024 * 4 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr?.slice(-2000) || err.message));
          return;
        }
        resolve(stdout.trim());
      },
    );
  });
}

const TARGET = "1080:1920";

// The scale+pad chain that fits any source into a black 9:16 frame.
const FIT_9x16 =
  `scale=${TARGET}:force_original_aspect_ratio=decrease,` +
  `pad=${TARGET}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=30`;

// Default on-screen time for a photo when the plan doesn't specify one.
export const STILL_SECONDS = 2.5;

const PHOTO_EXTS = new Set([
  ".heic",
  ".heif",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".tif",
  ".tiff",
  ".dng",
  ".gif",
  ".bmp",
]);

// A clip is a photo (rendered as a still) rather than a video, decided by
// its file extension. Used to branch the render and vision paths.
export function isPhoto(file: string): boolean {
  const i = file.lastIndexOf(".");
  return i >= 0 && PHOTO_EXTS.has(file.slice(i).toLowerCase());
}

// The seconds a segment actually occupies in the final cut: photos are held
// for a minimum so the zoom reads; videos play their trimmed window.
function renderedDuration(src: string, seg: RenderSegment): number {
  const raw = Math.max(0, seg.end - seg.start);
  return isPhoto(src) ? Math.max(0.8, raw) : raw;
}

// Ken Burns still: upscale hard (smooths the zoom), then a slow center zoom
// into a 9:16 frame over `seconds`. Emitted as its own labeled filter chain.
function kenBurns(inputIndex: number, seconds: number): string {
  const frames = Math.max(1, Math.round(seconds * 30));
  const inc = (0.12 / frames).toFixed(6); // reach ~1.12x by the final frame
  return (
    `[${inputIndex}:v]scale=2160:3840:force_original_aspect_ratio=increase,` +
    `crop=2160:3840,` +
    `zoompan=z='min(zoom+${inc},1.12)':` +
    `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
    `d=${frames}:s=1080x1920:fps=30,setsar=1`
  );
}

// Duration of a clip in seconds (0 if it can't be read).
export async function probeDuration(input: string): Promise<number> {
  const out = await runFfprobe([
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=nw=1:nk=1",
    input,
  ]);
  const seconds = Number.parseFloat(out);
  return Number.isFinite(seconds) ? seconds : 0;
}

// Grab one small JPEG per timestamp. Frames are downscaled hard (width 512)
// to keep vision-token cost low. Returns the written file paths in order.
export async function extractFrames(
  input: string,
  timestamps: number[],
  outDir: string,
): Promise<string[]> {
  const written: string[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const out = path.join(outDir, `frame-${String(i).padStart(3, "0")}.jpg`);
    await runFfmpeg([
      "-ss",
      timestamps[i].toFixed(3),
      "-i",
      input,
      "-frames:v",
      "1",
      "-vf",
      "scale=512:-2",
      "-q:v",
      "6",
      "-y",
      out,
    ]);
    written.push(out);
  }
  return written;
}

export interface RenderSegment {
  clip: number; // index into clipPaths
  start: number; // seconds
  end: number; // seconds
  caption?: string; // burned-in lower-third text
}

// ASS time is H:MM:SS.cc (centiseconds).
function assTime(seconds: number): string {
  const cs = Math.max(0, Math.round(seconds * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  const c = cs % 100;
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${h}:${p2(m)}:${p2(s)}.${p2(c)}`;
}

// ASS text can't contain braces (override blocks) or raw newlines.
function assText(text: string): string {
  return text
    .replace(/[{}]/g, "")
    .replace(/\s*\n\s*/g, " ")
    .trim()
    .slice(0, 80);
}

// Build a styled subtitle track timed to each segment's slot in the final cut:
// bold white text, thick black outline, sitting in the lower third.
function buildAss(segments: RenderSegment[], durations: number[]): string {
  const head = [
    "[Script Info]",
    "ScriptType: v4.00+",
    "PlayResX: 1080",
    "PlayResY: 1920",
    "WrapStyle: 2",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    "Style: Cap,Arial,66,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,5,2,2,90,90,320,1",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];

  const lines: string[] = [];
  let cursor = 0;
  segments.forEach((seg, i) => {
    const dur = durations[i];
    const caption = seg.caption ? assText(seg.caption) : "";
    if (caption) {
      lines.push(
        `Dialogue: 0,${assTime(cursor)},${assTime(cursor + dur)},Cap,,0,0,0,,${caption}`,
      );
    }
    cursor += dur;
  });
  return `${head.join("\n")}\n${lines.join("\n")}\n`;
}

// Escape a filesystem path for use inside a filtergraph argument.
function escapeFilterPath(p: string): string {
  return p.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

// Render an edit decision list: trim each segment from its source clip,
// normalize to 9:16, concatenate in order, and burn in any captions. Each
// segment gets its own input so a clip can be reused across segments safely.
export async function renderPlan(
  clipPaths: string[],
  segments: RenderSegment[],
  out: string,
): Promise<void> {
  const args: string[] = [];
  for (const seg of segments) {
    args.push("-i", clipPaths[seg.clip]);
  }

  const durations = segments.map((seg) =>
    renderedDuration(clipPaths[seg.clip], seg),
  );

  let filter = "";
  segments.forEach((seg, i) => {
    const src = clipPaths[seg.clip];
    if (isPhoto(src)) {
      filter += `${kenBurns(i, durations[i])}[v${i}];`;
    } else {
      filter +=
        `[${i}:v]trim=start=${seg.start.toFixed(3)}:end=${seg.end.toFixed(3)},` +
        `setpts=PTS-STARTPTS,${FIT_9x16}[v${i}];`;
    }
  });
  segments.forEach((_, i) => {
    filter += `[v${i}]`;
  });
  filter += `concat=n=${segments.length}:v=1:a=0[cat]`;

  const hasCaptions = segments.some((s) => s.caption && assText(s.caption));
  if (hasCaptions) {
    const assPath = path.join(path.dirname(out), "captions.ass");
    await writeFile(assPath, buildAss(segments, durations));
    filter += `;[cat]ass=${escapeFilterPath(assPath)}[outv]`;
  } else {
    filter += `;[cat]copy[outv]`;
  }

  args.push(
    "-filter_complex",
    filter,
    "-map",
    "[outv]",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-preset",
    "veryfast",
    "-movflags",
    "+faststart",
    "-y",
    out,
  );

  await runFfmpeg(args);
}

// Normalize every input to a 9:16 frame and concatenate them (video only).
// Phase 1 placeholder edit — Phase 2 replaces this with an AI-planned render.
export async function normalizeAndConcat(
  inputs: string[],
  out: string,
): Promise<void> {
  const args: string[] = [];
  for (const input of inputs) {
    args.push("-i", input);
  }

  let filter = "";
  inputs.forEach((input, i) => {
    if (isPhoto(input)) {
      filter += `${kenBurns(i, STILL_SECONDS)}[v${i}];`;
    } else {
      filter +=
        `[${i}:v]scale=${TARGET}:force_original_aspect_ratio=decrease,` +
        `pad=${TARGET}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=30[v${i}];`;
    }
  });
  inputs.forEach((_, i) => {
    filter += `[v${i}]`;
  });
  filter += `concat=n=${inputs.length}:v=1:a=0[outv]`;

  args.push(
    "-filter_complex",
    filter,
    "-map",
    "[outv]",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-preset",
    "veryfast",
    "-movflags",
    "+faststart",
    "-y",
    out,
  );

  await runFfmpeg(args);
}
