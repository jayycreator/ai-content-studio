import { NextResponse } from "next/server";
import { rerenderJob } from "@/lib/jobs";
import type { PlanSegment } from "@/lib/jobs/types";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    segments?: PlanSegment[];
    title?: string;
  };

  if (!Array.isArray(body.segments) || body.segments.length === 0) {
    return NextResponse.json({ error: "Add at least one segment." }, {
      status: 400,
    });
  }

  const ok = await rerenderJob(id, body.segments, body.title);
  if (!ok) {
    return NextResponse.json(
      { error: "Nothing usable to render." },
      { status: 400 },
    );
  }

  return NextResponse.json({ id, status: "processing" });
}
