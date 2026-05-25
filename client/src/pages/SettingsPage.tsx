import { useTheme } from "@/hooks/useTheme";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="text-xs font-medium tracking-wide text-violet-300">SETTINGS</div>
      <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Preferences</h1>
      <p className="mt-2 text-sm text-zinc-300">Quick toggles for MVP. Storage is local filesystem by default.</p>

      <div className="mt-6 space-y-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-zinc-100">Theme</div>
              <div className="mt-1 text-xs text-zinc-400">Default is dark to match the app aesthetic.</div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
            >
              Toggle (current: {theme})
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <div className="text-sm font-medium text-zinc-100">Environment</div>
          <div className="mt-2 grid gap-2 text-xs text-zinc-300">
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-400">API base</span>
              <span className="font-mono text-zinc-200">/api</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-400">Uploads</span>
              <span className="font-mono text-zinc-200">/uploads</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-400">Outputs</span>
              <span className="font-mono text-zinc-200">/outputs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

