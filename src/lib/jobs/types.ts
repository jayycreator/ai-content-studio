export type JobStatus = "queued" | "processing" | "done" | "error";

export interface PlanSegment {
  clip: number; // index into clips[]
  start: number; // seconds
  end: number; // seconds
  caption?: string;
}

export interface JobPlan {
  title: string;
  targetSeconds: number;
  segments: PlanSegment[];
}

export interface JobRecord {
  id: string;
  status: JobStatus;
  clips: string[];
  instruction: string;
  createdAt: string;
  recipeId?: string;
  title?: string;
  // The editable cut. Present once the AI has planned the short.
  plan?: JobPlan;
  // Source clip lengths in seconds, aligned to clips[]. Bounds editor trims.
  clipDurations?: number[];
  error?: string;
}
