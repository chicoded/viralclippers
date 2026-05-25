export type UploadResponse = {
  videoId: string;
  filename: string;
  bytes: number;
};

export type JobStep =
  | "queued"
  | "transcribing"
  | "detecting_moments"
  | "scoring_clips"
  | "cutting_clips"
  | "generating_thumbnails"
  | "ready"
  | "failed";

export type JobStatusResponse = {
  jobId: string;
  state: "waiting" | "active" | "completed" | "failed";
  step: JobStep;
  progress: number;
  message?: string;
  error?: string;
  videoId?: string;
};

export type AnalyzeResponse = {
  jobId: string;
};

export type ApiError = {
  error: string;
  details?: string;
};

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || "";

function apiUrl(path: string) {
  if (!API_BASE) return path;
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  return `${base}${path}`;
}

export async function analyzeVideo(videoId: string): Promise<AnalyzeResponse> {
  const res = await fetch(apiUrl(`/api/analyze/${encodeURIComponent(videoId)}`), { method: "POST" });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as ApiError | null;
    throw new Error(data?.error || "Failed to start analysis");
  }
  return (await res.json()) as AnalyzeResponse;
}

export async function getJob(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(apiUrl(`/api/jobs/${encodeURIComponent(jobId)}`));
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as ApiError | null;
    throw new Error(data?.error || "Failed to fetch job status");
  }
  return (await res.json()) as JobStatusResponse;
}

export function uploadVideo(
  file: File,
  opts: { onProgress?: (pct: number) => void; signal?: AbortSignal }
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", apiUrl("/api/upload"));

    xhr.upload.onprogress = (evt) => {
      if (!evt.lengthComputable) return;
      const pct = Math.round((evt.loaded / evt.total) * 100);
      opts.onProgress?.(pct);
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));

    xhr.onload = () => {
      const ok = xhr.status >= 200 && xhr.status < 300;
      const parsed = (() => {
        try {
          return JSON.parse(xhr.responseText) as unknown;
        } catch {
          return null;
        }
      })();

      if (!ok) {
        const err = parsed as ApiError | null;
        reject(new Error(err?.error || `Upload failed (${xhr.status})`));
        return;
      }

      resolve(parsed as UploadResponse);
    };

    opts.signal?.addEventListener("abort", () => xhr.abort(), { once: true });

    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}
