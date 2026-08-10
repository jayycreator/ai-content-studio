import LumenSphere from "@/components/LumenSphere";
import ThemeToggle from "@/components/ThemeToggle";

const steps = [
  {
    n: "01",
    title: "Drop the day's clips",
    body: "Walks between buildings, a pan over the quad, the coffee run, a quick chat. Raw and unsorted is fine.",
  },
  {
    n: "02",
    title: "Say what you want",
    body: "\u201CTight 40-second morning recap, upbeat.\u201D It picks the good moments, trims the dead air, and cuts to the beat.",
  },
  {
    n: "03",
    title: "Download and post",
    body: "A polished 9:16 short with music \u2014 or a casual voiceover written from what's actually in your clips. You post it.",
  },
];

export default function Home() {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="/" className="flex items-center gap-2.5">
            <LumenSphere className="h-7 w-7 shrink-0" />
            <span className="font-display text-lg font-semibold tracking-tight">
              Lumen Create
            </span>
          </a>
          <div className="flex items-center gap-4 text-sm">
            <a href="/projects" className="text-muted hover:text-ink">
              Projects
            </a>
            <a href="/settings" className="text-muted hover:text-ink">
              Settings
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-5 pt-16 pb-20 sm:px-8 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div>
              <h1 className="reveal font-display text-[2.75rem] leading-[1.02] font-semibold tracking-tight text-balance sm:text-6xl">
                You film the day.
                <br />
                It hands back the <span className="mark">edit.</span>
              </h1>
              <p className="reveal reveal-2 mt-6 max-w-xl text-lg text-muted">
                For creators who love shooting and dread the timeline. Drop in
                the raw clips, tell it the vibe, and get a paced, ready-to-post
                vertical short back &mdash; with music or an AI voiceover in a
                casual, first-person voice.
              </p>
              <div className="reveal reveal-3 mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="/create"
                  className="btn-primary rounded-lg px-5 py-3 font-medium text-white"
                >
                  Start a project
                </a>
                <span className="text-sm text-muted">
                  AI-edited 9:16 short from your raw clips.
                </span>
              </div>
            </div>

            <div aria-hidden className="relative">
              <div className="rounded-2xl border border-line bg-paper-2 p-6">
                <div className="space-y-2.5">
                  {["8:12 — walk to class", "9:40 — coffee run", "1:15 — quad pan"].map(
                    (clip) => (
                      <div
                        key={clip}
                        className="flex items-center gap-3 rounded-lg border border-line bg-paper px-3 py-2.5"
                      >
                        <span className="h-8 w-12 shrink-0 rounded bg-ink/10" />
                        <span className="truncate text-sm text-muted">
                          {clip}
                        </span>
                      </div>
                    ),
                  )}
                </div>
                <div className="my-5 flex items-center justify-center gap-2 text-xs font-medium tracking-wide text-accent-ink uppercase">
                  <span className="h-px w-8 bg-line" />
                  edits to
                  <span className="h-px w-8 bg-line" />
                </div>
                <div className="mx-auto aspect-[9/16] w-32 rounded-xl border border-accent/30 bg-accent-soft p-2">
                  <div className="flex h-full flex-col justify-end rounded-lg bg-accent/10 p-2">
                    <div className="h-1.5 w-3/4 rounded-full bg-accent/60" />
                    <div className="mt-1 h-1.5 w-1/2 rounded-full bg-accent/40" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-paper-2">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              How a shoot becomes a short
            </h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
              {steps.map((step) => (
                <li
                  key={step.n}
                  className="lift rounded-xl border border-line bg-paper p-5"
                >
                  <span className="font-display text-sm font-semibold text-accent">
                    {step.n}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-8 sm:px-8">
          <span className="font-display text-sm font-semibold tracking-tight">
            Lumen Create
          </span>
          <span className="text-sm text-muted">
            Working name &mdash; early build.
          </span>
        </div>
      </footer>
    </>
  );
}
