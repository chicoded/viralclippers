export default function ClipsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="text-xs font-medium tracking-wide text-violet-300">MY CLIPS</div>
      <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Clips dashboard</h1>
      <p className="mt-2 text-sm text-zinc-300">
        Next: render clip cards sorted by viral score, preview/download, caption presets, and “Download All”.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

