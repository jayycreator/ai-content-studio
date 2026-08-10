import LumenSphere from "@/components/LumenSphere";
import Onboarding from "@/components/Onboarding";
import ThemeToggle from "@/components/ThemeToggle";
import Uploader from "@/components/Uploader";
import { listRecipes } from "@/lib/recipes";

export const metadata = {
  title: "New project — Lumen Create",
};

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { job } = await searchParams;
  const reopening = Boolean(job);
  const recipes = listRecipes().map(({ id, name, blurb }) => ({
    id,
    name,
    blurb,
  }));

  return (
    <>
      {!reopening && <Onboarding />}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8">
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
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {reopening ? "Your project" : "New project"}
          </h1>
          <p className="mt-3 max-w-xl text-muted">
            {reopening
              ? "Picking up where you left off. Preview or download your short below."
              : "Drop in a day\u2019s worth of clips and tell it what you want back. The AI picks the good moments, trims the dead air, and cuts it into a 9:16 short."}
          </p>

          <div className="mt-10">
            <Uploader initialJobId={job} recipes={recipes} />
          </div>
        </div>
      </main>
    </>
  );
}
