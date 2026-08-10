import LumenSphere from "@/components/LumenSphere";
import ThemeToggle from "@/components/ThemeToggle";
import { listJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your projects — Lumen Create",
};

const statusLabel: Record<string, string> = {
  queued: "Editing\u2026",
  processing: "Editing\u2026",
  done: "Ready",
  error: "Failed",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ProjectsPage() {
  const jobs = await listJobs();

  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="/" className="flex shrink-0 items-center gap-2.5">
            <LumenSphere className="h-7 w-7 shrink-0" />
            <span className="font-display text-lg font-semibold tracking-tight whitespace-nowrap">
              Lumen Create
            </span>
          </a>
          <div className="flex items-center gap-3 text-sm">
            <a
              href="/settings"
              className="hidden text-muted hover:text-ink sm:inline"
            >
              Settings
            </a>
            <ThemeToggle />
            <a
              href="/create"
              className="btn-primary rounded-lg px-4 py-2 font-medium text-white"
            >
              <span className="sm:hidden">New</span>
              <span className="hidden sm:inline">New project</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Your projects
          </h1>
          <p className="mt-3 max-w-xl text-muted">
            Every short you start is saved here as a draft. Open one anytime to
            preview or download it.
          </p>

          {jobs.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-line bg-paper-2 px-6 py-14 text-center">
              <p className="font-display text-lg font-semibold tracking-tight">
                No projects yet
              </p>
              <p className="mt-1 text-sm text-muted">
                Start your first short and it&rsquo;ll show up here.
              </p>
              <a
                href="/create"
                className="btn-primary mt-6 inline-block rounded-lg px-5 py-3 font-medium text-white"
              >
                New project
              </a>
            </div>
          ) : (
            <ul className="mt-10 space-y-3">
              {jobs.map((job) => (
                <li key={job.id}>
                  <a
                    href={`/create?job=${job.id}`}
                    className="lift flex items-center justify-between gap-4 rounded-xl border border-line bg-paper-2 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-display font-semibold tracking-tight">
                        {job.title || job.instruction || "Untitled project"}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted">
                        {job.instruction || "No brief given"} &middot;{" "}
                        {formatDate(job.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        job.status === "done"
                          ? "bg-accent-soft text-accent-ink"
                          : job.status === "error"
                            ? "bg-ink/10 text-ink"
                            : "border border-line text-muted"
                      }`}
                    >
                      {statusLabel[job.status] ?? job.status}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
