import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { JobRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data", "jobs");

export function jobDir(id: string) {
  return path.join(DATA_DIR, id);
}

export function outputPath(id: string) {
  return path.join(jobDir(id), "output.mp4");
}

function statusPath(id: string) {
  return path.join(jobDir(id), "status.json");
}

export async function readJob(id: string): Promise<JobRecord | null> {
  try {
    const raw = await fs.readFile(statusPath(id), "utf8");
    return JSON.parse(raw) as JobRecord;
  } catch {
    return null;
  }
}

export async function writeJob(job: JobRecord): Promise<void> {
  await fs.writeFile(statusPath(job.id), JSON.stringify(job, null, 2));
}

// Every saved project, newest first. Missing/partial dirs are skipped.
export async function listJobs(): Promise<JobRecord[]> {
  let ids: string[];
  try {
    ids = await fs.readdir(DATA_DIR);
  } catch {
    return [];
  }
  const jobs = await Promise.all(ids.map((id) => readJob(id)));
  return jobs
    .filter((job): job is JobRecord => job !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createJob(
  files: File[],
  instruction: string,
  recipeId?: string,
): Promise<JobRecord> {
  const id = randomUUID();
  const dir = jobDir(id);
  await fs.mkdir(dir, { recursive: true });

  const clips: string[] = [];
  for (const [index, file] of files.entries()) {
    const ext = path.extname(file.name).toLowerCase() || ".mp4";
    const name = `clip-${String(index).padStart(3, "0")}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(dir, name), buffer);
    clips.push(name);
  }

  const job: JobRecord = {
    id,
    status: "queued",
    clips,
    instruction,
    recipeId,
    createdAt: new Date().toISOString(),
  };
  await writeJob(job);
  return job;
}
