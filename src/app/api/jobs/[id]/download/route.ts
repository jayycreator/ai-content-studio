import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { Readable } from "node:stream";
import { readJob, outputPath } from "@/lib/jobs";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const job = await readJob(id);
  if (!job || job.status !== "done") {
    return new Response("Not ready.", { status: 404 });
  }

  const file = outputPath(id);
  const info = await stat(file);
  const total = info.size;
  const asDownload = new URL(request.url).searchParams.get("dl") === "1";
  const range = request.headers.get("range");

  const baseHeaders: Record<string, string> = {
    "Content-Type": "video/mp4",
    "Accept-Ranges": "bytes",
  };
  if (asDownload) {
    baseHeaders["Content-Disposition"] =
      `attachment; filename="lumen-create-${id}.mp4"`;
  }

  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match && match[1] ? Number(match[1]) : 0;
    const end = match && match[2] ? Number(match[2]) : total - 1;
    const stream = Readable.toWeb(
      createReadStream(file, { start, end }),
    ) as unknown as NodeReadableStream;
    return new Response(stream as unknown as BodyInit, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }

  const stream = Readable.toWeb(
    createReadStream(file),
  ) as unknown as NodeReadableStream;
  return new Response(stream as unknown as BodyInit, {
    headers: { ...baseHeaders, "Content-Length": String(total) },
  });
}
