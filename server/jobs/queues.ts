import Bull from "bull";

export type AnalyzeVideoJobData = {
  videoId: string;
  meta?: JobMeta;
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

export type JobMeta = {
  step: JobStep;
  message?: string;
  progress: number;
  videoId?: string;
  error?: string;
};

let analyzeVideoQueue: Bull.Queue<AnalyzeVideoJobData> | null = null;

export function getAnalyzeVideoQueue() {
  if (analyzeVideoQueue) return analyzeVideoQueue;
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;
  analyzeVideoQueue = new Bull<AnalyzeVideoJobData>("analyzeVideo", redisUrl);
  return analyzeVideoQueue;
}
