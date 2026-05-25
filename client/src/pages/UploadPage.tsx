import { useCallback, useEffect, useRef, useState } from "react";
import { XCircle } from "lucide-react";
import UploadDropzone from "@/components/upload/UploadDropzone";
import AnalysisStepperCard from "@/components/upload/AnalysisStepperCard";
import { analyzeVideo, getJob, uploadVideo, type JobStatusResponse } from "@/utils/api";

type UiStage = "idle" | "uploading" | "analyzing" | "done" | "error";

const MAX_BYTES = 2 * 1024 * 1024 * 1024;

export default function UploadPage() {
  const abortRef = useRef<AbortController | null>(null);

  const [stage, setStage] = useState<UiStage>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((f: File) => {
    const ext = f.name.toLowerCase().split(".").pop();
    if (!ext || (ext !== "mp4" && ext !== "mov")) return "Only MP4 and MOV files are supported.";
    if (f.size > MAX_BYTES) return "File is too large (max 2GB).";
    return null;
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStage("idle");
    setDragOver(false);
    setFile(null);
    setProgress(0);
    setVideoId(null);
    setJobId(null);
    setJob(null);
    setError(null);
  }, []);

  const pickFile = useCallback((f: File) => {
    const err = validateFile(f);
    if (err) {
      setError(err);
      setStage("error");
      return;
    }
    setError(null);
    setFile(f);
    setStage("idle");
  }, [validateFile]);

  const startUpload = useCallback(async () => {
    if (!file) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setStage("uploading");
    setProgress(0);
    setJob(null);
    setError(null);

    try {
      const uploadRes = await uploadVideo(file, {
        onProgress: (pct) => setProgress(pct),
        signal: abortRef.current.signal
      });
      setVideoId(uploadRes.videoId);
      localStorage.setItem("lastVideoId", uploadRes.videoId);

      setStage("analyzing");
      const analyzeRes = await analyzeVideo(uploadRes.videoId);
      setJobId(analyzeRes.jobId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      setStage("error");
    }
  }, [file]);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const status = await getJob(jobId);
        if (cancelled) return;
        setJob(status);
        if (status.step === "ready" && status.state === "completed") {
          setStage("done");
        }
        if (status.step === "failed" || status.state === "failed") {
          setStage("error");
          setError(status.error || "Job failed");
        }
      } catch (e) {
        if (cancelled) return;
        setStage("error");
        setError(e instanceof Error ? e.message : "Failed to poll job status");
      }
    };

    tick();
    const id = window.setInterval(tick, 1100);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [jobId]);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium tracking-wide text-violet-300">UPLOAD</div>
          <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Turn long videos into viral shorts</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-300">
            Upload a long video. The worker will transcribe, detect viral moments, score clips, and prepare caption-ready
            outputs.
          </p>
        </div>

        {(stage === "uploading" || stage === "analyzing") && (
          <button
            type="button"
            onClick={() => reset()}
            className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10 md:inline-flex"
          >
            Cancel
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-5">
        <div className="md:col-span-3">
          <UploadDropzone
            stage={stage}
            dragOver={dragOver}
            file={file}
            progress={progress}
            error={error}
            videoId={videoId}
            onChooseFile={pickFile}
            onDropFile={pickFile}
            onDragOver={() => setDragOver(true)}
            onDragLeave={() => setDragOver(false)}
            onRemoveFile={() => {
              setFile(null);
              setVideoId(null);
              setJobId(null);
              setJob(null);
              setError(null);
              setStage("idle");
            }}
            onStart={startUpload}
            onCancel={reset}
          />
        </div>

        <div className="md:col-span-2">
          <AnalysisStepperCard stage={stage} job={job} error={error} />
        </div>
      </div>
    </div>
  );
}
