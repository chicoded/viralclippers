import { useRef } from "react";
import { ArrowRight, CloudUpload, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type UiStage = "idle" | "uploading" | "analyzing" | "done" | "error";

function formatBytes(bytes: number) {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export default function UploadDropzone(props: {
  stage: UiStage;
  dragOver: boolean;
  file: File | null;
  progress: number;
  error: string | null;
  videoId: string | null;
  onChooseFile: (file: File) => void;
  onRemoveFile: () => void;
  onStart: () => void;
  onCancel: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDropFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        props.onDragOver();
      }}
      onDragLeave={props.onDragLeave}
      onDrop={(evt) => {
        evt.preventDefault();
        const f = evt.dataTransfer.files?.[0];
        if (f) props.onDropFile(f);
      }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_60px_-25px_rgba(124,58,237,0.35)]",
        props.dragOver && "border-violet-400/40 bg-violet-500/10"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 ring-1 ring-white/10">
          <CloudUpload className="h-5 w-5 text-violet-200" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-zinc-100">Drag & drop your video</div>
          <div className="mt-1 text-xs text-zinc-400">MP4 or MOV, up to 2GB</div>

          {props.file ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm text-zinc-200">{props.file.name}</div>
                  <div className="mt-1 text-xs text-zinc-400">{formatBytes(props.file.size)}</div>
                </div>
                <button
                  type="button"
                  onClick={props.onRemoveFile}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 transition hover:bg-white/10"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500"
              >
                Choose file
              </button>
              <div className="text-xs text-zinc-400">or drop it here</div>
              <input
                ref={inputRef}
                type="file"
                accept=".mp4,.mov,video/mp4,video/quicktime"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) props.onChooseFile(f);
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!props.file || props.stage === "uploading" || props.stage === "analyzing"}
          onClick={props.onStart}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
            !props.file || props.stage === "uploading" || props.stage === "analyzing"
              ? "cursor-not-allowed border border-white/10 bg-white/5 text-zinc-400"
              : "bg-violet-600 text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500"
          )}
        >
          {props.stage === "uploading" || props.stage === "analyzing" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {props.stage === "uploading" ? "Uploading…" : props.stage === "analyzing" ? "Analyzing…" : "Upload & Analyze"}
          <ArrowRight className="h-4 w-4" />
        </button>

        {props.stage === "done" && props.videoId ? (
          <Link
            to="/clips"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
          >
            Go to My Clips
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}

        {(props.stage === "uploading" || props.stage === "analyzing") && (
          <button
            type="button"
            onClick={props.onCancel}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
          >
            Cancel
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>

      {props.stage === "uploading" ? (
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Uploading</span>
            <span>{props.progress}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all"
              style={{ width: `${props.progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {props.stage === "error" && props.error ? (
        <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <div className="font-medium">Something went wrong</div>
          <div className="mt-1 text-xs text-rose-200/90">{props.error}</div>
        </div>
      ) : null}
    </div>
  );
}

