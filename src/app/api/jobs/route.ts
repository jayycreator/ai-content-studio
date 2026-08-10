import { NextResponse } from "next/server";
import { createJob, listJobs, processJob } from "@/lib/jobs";
import { FREE_FORMATS_LABEL, isAcceptedFile } from "@/lib/plans";
import { getRecipe } from "@/lib/recipes";

export const runtime = "nodejs";

export async function GET() {
  const jobs = await listJobs();
  const summary = jobs.map(({ id, status, instruction, createdAt, title }) => ({
    id,
    status,
    instruction,
    createdAt,
    title,
  }));
  return NextResponse.json({ jobs: summary });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const instruction = String(form.get("instruction") ?? "");
  const files = form
    .getAll("clips")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return NextResponse.json(
      { error: "Add at least one clip or photo." },
      { status: 400 },
    );
  }

  const rejected = files.find((f) => !isAcceptedFile("free", f.name));
  if (rejected) {
    return NextResponse.json(
      {
        error: `${rejected.name} isn't a supported format. Free supports ${FREE_FORMATS_LABEL}.`,
      },
      { status: 400 },
    );
  }

  const recipeId = getRecipe(String(form.get("recipeId") ?? "")).id;
  const job = await createJob(files, instruction, recipeId);

  // Fire-and-forget: processing continues after the response returns.
  void processJob(job.id);

  return NextResponse.json({ id: job.id, status: job.status }, { status: 201 });
}
