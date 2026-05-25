import { useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Clapperboard, Settings, Upload, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

function SidebarLink({ to, label, icon, onNavigate }: NavItem & { onNavigate?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
          "text-zinc-300 hover:bg-white/5 hover:text-white",
          isActive && "bg-white/8 text-white ring-1 ring-white/10"
        )
      }
    >
      <span className="text-zinc-400 transition group-hover:text-white">{icon}</span>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const nav = useMemo<NavItem[]>(
    () => [
      { to: "/upload", label: "Upload", icon: <Upload className="h-4 w-4" /> },
      { to: "/clips", label: "My Clips", icon: <Clapperboard className="h-4 w-4" /> },
      { to: "/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> }
    ],
    []
  );

  return (
    <aside
      className={cn(
        "h-full w-72 shrink-0",
        "border-r border-white/5 bg-zinc-950/30 backdrop-blur-xl",
        "px-4 py-5"
      )}
    >
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500/90 to-fuchsia-400/70 ring-1 ring-white/15">
          <Clapperboard className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">Viral Clippers</div>
          <div className="text-[11px] text-zinc-400">AI clip generator</div>
        </div>
      </div>

      <nav className="mt-6 space-y-1 px-1">
        {nav.map((item) => (
          <SidebarLink key={item.to} {...item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="text-xs font-medium text-zinc-200">MVP mode</div>
        <div className="mt-1 text-[11px] leading-snug text-zinc-400">
          Files are stored locally. Redis is required for background jobs.
        </div>
      </div>
    </aside>
  );
}

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-zinc-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -right-24 top-36 h-[520px] w-[520px] rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[380px] w-[720px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1400px]">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/5 bg-zinc-950/40 backdrop-blur-xl">
            <div className="flex h-14 items-center gap-3 px-4 md:px-6">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10 md:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="text-sm font-medium text-zinc-200">AI Viral Clip Generator</div>
              <div className="ml-auto text-xs text-zinc-400">Accent: #7C3AED</div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 md:px-6">
            <Outlet />
          </main>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu overlay"
          />
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-xs">
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-zinc-100 backdrop-blur-xl"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
