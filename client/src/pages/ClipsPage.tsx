import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Download, Play, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getClips, type ClipRecord } from "@/utils/api";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || "";

function assetUrl(path: string) {
  if (!API_BASE) return path;
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  return `${base}${path}`;
}

function scoreColor(score: number) {
  if (score > 70) return "bg-emerald-400/15 text-emerald-200 ring-emerald-400/30";
  if (score >= 40) return "bg-amber-400/15 text-amber-200 ring-amber-400/30";
  return "bg-rose-400/15 text-rose-200 ring-rose-400/30";
}

export default function ClipsPage() {
  const [params] = useSearchParams();
  const initialVideoId = params.get("videoId") || localStorage.getItem("lastVideoId") || "";

  const [videoId, setVideoId] = useState(initialVideoId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clips, setClips] = useState<ClipRecord[]>([]);

  const canLoad = Boolean(videoId);

  const summary = useMemo(() => {
    if (!clips.length) return null;
    const top = clips[0]!;
    return { count: clips.length, topScore: top.viralScore };
  }, [clips]);

  const load = async () => {
    if (!videoId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getClips(videoId);
      setClips(res.clips || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load clips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canLoad) return;
    void load();
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium tracking-wide text-violet-300">MY CLIPS</div>
          <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Generated clips</h1>
          <p className="mt-2 text-sm text-zinc-300">
            {summary ? `${summary.count} clips ready (top score: ${summary.topScore}).` : "Load clips for the last uploaded video."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={!canLoad || loading}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10",
              (!canLoad || loading) && "cursor-not-allowed opacity-60"
            )}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500"
          >
            Upload another
          </Link>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs text-zinc-400">Video ID</div>
          <input
            value={videoId}
            onChange={(e) => setVideoId(e.target.value.trim())}
            placeholder="Paste a videoId…"
            className="w-full max-w-xl rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-60 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clips.map((clip) => {
            const thumb = assetUrl(`/outputs/${clip.paths.thumbnail}`);
            const src = assetUrl(`/outputs/${clip.paths.sourceClip}`);

            return (
              <div key={clip.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <div className="relative aspect-video w-full bg-black/40">
                  <img src={thumb} alt="" className="h-full w-full object-cover opacity-90" />
                  <div className="absolute left-3 top-3">
                    <div className={cn("inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1", scoreColor(clip.viralScore))}>
                      Score {clip.viralScore}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-sm font-medium text-zinc-100">{clip.suggestedTitle || "Untitled"}</div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {clip.durationSec}s • Hook {clip.hookStrength} • {clip.startTimeSec.toFixed(1)}s–{clip.endTimeSec.toFixed(1)}s
                  </div>

                  {clip.transcriptExcerpt ? (
                    <div className="mt-3 max-h-14 overflow-hidden text-xs leading-relaxed text-zinc-300">
                      {clip.transcriptExcerpt}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <a
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 transition hover:bg-white/10"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Preview
                    </a>
                    <a
                      href={src}
                      download
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-medium text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
