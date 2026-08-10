// Single source of truth for the Free / Pro tiers.
// Display data drives the pricing screen; the limits drive gating
// (accepted file types, monthly export cap, storage) on the server.

export type PlanId = "free" | "pro";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  tagline: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

// NOTE: price and caps are placeholders pending creator validation.
export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    tagline: "The full AI editor, forever.",
    features: [
      "Full-quality AI edits — never watermarked",
      "5 exports per month",
      "The day-in-the-life format",
      "2 GB of project storage",
      "Phone media: MOV, MP4, HEIC, JPG, PNG",
      "1080p downloads",
    ],
    cta: "Start creating — Free",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12/mo",
    tagline: "Unlimited edits, every format, any file.",
    features: [
      "Everything in Free, plus:",
      "Unlimited exports",
      "Every format — vlog recap, GRWM, hype montage & more",
      "Save prompt presets — reuse a style that worked in one click",
      "Unlimited project storage",
      "All file types — ProRes, MKV, RAW, TIFF and more",
      "4K downloads and multiple AI cuts per upload",
    ],
    cta: "Go Pro",
    highlight: true,
  },
];

export type PlanLimits = {
  exportsPerMonth: number | null; // null = unlimited
  storageBytes: number | null; // null = unlimited
  formatIds: string[] | null; // null = all formats
  videoTypes: string[]; // accepted video MIME types
  photoTypes: string[]; // accepted photo MIME types
  allFileTypes: boolean; // Pro: accept anything ffmpeg can read
  maxHeight: number; // export resolution cap (px)
};

const GB = 1024 ** 3;

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    exportsPerMonth: 5,
    storageBytes: 2 * GB,
    formatIds: ["dayInTheLife"],
    videoTypes: ["video/mp4", "video/quicktime"],
    photoTypes: ["image/heic", "image/heif", "image/jpeg", "image/png"],
    allFileTypes: false,
    maxHeight: 1920,
  },
  pro: {
    exportsPerMonth: null,
    storageBytes: null,
    formatIds: null,
    videoTypes: [
      "video/mp4",
      "video/quicktime",
      "video/x-matroska",
      "video/webm",
      "video/avi",
      "video/mp2t",
    ],
    photoTypes: [
      "image/heic",
      "image/heif",
      "image/jpeg",
      "image/png",
      "image/tiff",
      "image/x-adobe-dng",
    ],
    allFileTypes: true,
    maxHeight: 2160,
  },
};

// Accepts a File's MIME type for a given plan. Pro takes anything image/* or
// video/*; Free is restricted to the phone-native allow-list above.
export function isAcceptedType(planId: PlanId, mimeType: string): boolean {
  const limits = PLAN_LIMITS[planId];
  if (limits.allFileTypes) {
    return mimeType.startsWith("video/") || mimeType.startsWith("image/");
  }
  return (
    limits.videoTypes.includes(mimeType) || limits.photoTypes.includes(mimeType)
  );
}

// Phone-native media the Free plan accepts. Extension-based because browsers
// often report an empty MIME type for HEIC and other phone formats.
const FREE_EXTS = new Set([
  ".mp4",
  ".mov",
  ".m4v",
  ".heic",
  ".heif",
  ".jpg",
  ".jpeg",
  ".png",
]);

// Extra formats Pro unlocks on top of the Free set.
const PRO_ONLY_EXTS = new Set([
  ".mkv",
  ".webm",
  ".avi",
  ".mts",
  ".m2ts",
  ".ts",
  ".mpg",
  ".mpeg",
  ".wmv",
  ".flv",
  ".tiff",
  ".tif",
  ".dng",
  ".webp",
  ".gif",
  ".bmp",
]);

export function fileExt(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i).toLowerCase() : "";
}

// Whether a plan accepts a file, judged by extension (reliable across the
// phone formats where the browser MIME type is missing).
export function isAcceptedFile(planId: PlanId, filename: string): boolean {
  const ext = fileExt(filename);
  if (FREE_EXTS.has(ext)) return true;
  return planId === "pro" && PRO_ONLY_EXTS.has(ext);
}

// Human-readable summary of the Free plan's accepted formats, for UI copy.
export const FREE_FORMATS_LABEL = "MP4, MOV, HEIC, JPG, PNG";
