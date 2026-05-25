import { Check, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobStep, JobStatusResponse } from "@/utils/api";

function StepDot({ state }: { state: "todo" | "active" | "done" }) {
  if (state === "done") {
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30">
        <Check className="h-3.5 w-3.5 text-emerald-300" />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full bg-violet-500/15 ring-1 ring-violet-400/30">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-violet-300" />
      </span>
    );
  }
  return <span className="h-6 w-6 rounded-full border border-white/10 bg-white/5" />;
}

const stepOrder: JobStep[] = [
  "transcribing",
  "detecting_moments",
  "scoring_clips",
  "cutting_clips",
  "generating_thumbnails",
  "ready"
];

const stepLabels: Record<JobStep, string> = {
  queued: "Queued",
  transcribing: "Transcribing audio",
  detecting_moments: "Detecting viral moments",
  scoring_clips: "Scoring clips",
  cutting_clips: "Cutting clips",
  generating_thumbnails: "Generating thumbnails",
  ready: "Generating captions",
  failed: "Failed"
};

export default function AnalysisStepperCard(props: {
  stage: "idle" | "uploading" | "analyzing" | "done" | "error";
  job: JobStatusResponse | null;
  error: string | null;
}) {
  const current = props.job?.step || (props.stage === "analyzing" ? "transcribing" : "queued");
  const activeIdx = stepOrder.indexOf(current);
  const steps = stepOrder.map((step, idx) => {
    const state: "todo" | "active" | "done" =
      current === "ready" ? "done" : idx < activeIdx ? "done" : idx === activeIdx ? "active" : "todo";
    return { step, label: stepLabels[step], state };
  });

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-100">Analyzing video…</div>
        <div className="text-xs text-zinc-400">{props.job ? `${Math.round(props.job.progress)}%` : "—"}</div>
      </div>

      <div className="mt-4 space-y-3">
        {steps.map((s) => (
          <div key={s.step} className="flex items-center gap-3">
            <StepDot state={s.state} />
            <div className="min-w-0">
              <div className="text-sm text-zinc-200">{s.label}</div>
              {s.state === "active" ? (
                <div className="mt-0.5 text-xs text-zinc-400">{props.job?.message || "Working…"}</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            props.stage === "done" ? "bg-emerald-400" : "bg-gradient-to-r from-violet-500 to-fuchsia-400"
          )}
          style={{ width: `${props.job?.progress ?? 0}%` }}
        />
      </div>

      {props.stage === "idle" ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-zinc-400">
          Upload a file to start. The stepper will animate as the background job progresses.
        </div>
      ) : null}

      {props.stage === "done" ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          <Check className="h-4 w-4" />
          Analysis complete. Clips will appear in “My Clips”.
        </div>
      ) : null}

      {props.stage === "error" ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <XCircle className="h-4 w-4" />
          {props.error || "Job failed"}
        </div>
      ) : null}

      {props.stage === "uploading" || props.stage === "analyzing" ? (
        <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Background processing runs via Bull + Redis.
        </div>
      ) : null}
    </div>
  );
}

