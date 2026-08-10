import LumenSphere from "@/components/LumenSphere";
import SettingsPanel from "@/components/SettingsPanel";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = {
  title: "Settings — Lumen Create",
};

export default function SettingsPage() {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="/" className="flex items-center gap-2.5">
            <LumenSphere className="h-7 w-7 shrink-0" />
            <span className="font-display text-lg font-semibold tracking-tight">
              Lumen Create
            </span>
          </a>
          <div className="flex items-center gap-3 text-sm">
            <a href="/projects" className="text-muted hover:text-ink">
              Projects
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
          <h1 className="reveal font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Settings
          </h1>
          <p className="reveal reveal-1 mt-3 max-w-xl text-muted">
            Tune the look and manage your profile.
          </p>
          <div className="mt-10">
            <SettingsPanel />
          </div>
        </div>
      </main>
    </>
  );
}
