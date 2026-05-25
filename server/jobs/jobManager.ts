import type { Job } from "bull";
import { enqueueFakeAnalyzeVideo, getFakeJobStatus } from "./fakeQueue.js";
import { getAnalyzeVideoQueue, type AnalyzeVideoJobData, type JobMeta } from "./queues.js";

// Queue abstraction:
// - If REDIS_URL is set, we use Bull (production-like behavior).
// - If REDIS_URL is NOT set, we fall back to an in-memory job runner so the MVP still runs without Redis.
export type UnifiedJobStatus = {
  jobId: string;
  state: "waiting" | "active" | "completed" | "failed";
  meta: JobMeta;
  videoId: string;
};

export async function enqueueAnalyzeVideo(videoId: string): Promise<string> {
  const queue = getAnalyzeVideoQueue();
  if (!queue) return enqueueFakeAnalyzeVideo(videoId);

  const job = await queue.add({
    videoId,
    meta: { step: "queued", progress: 0, message: "Queued", videoId }
  });
  return String(job.id);
}

export async function getAnalyzeJobStatus(jobId: string): Promise<UnifiedJobStatus | null> {
  const queue = getAnalyzeVideoQueue();
  if (!queue) {
    const fake = await getFakeJobStatus(jobId);
    if (!fake) return null;
    return { jobId: fake.id, state: fake.state, meta: fake.meta, videoId: fake.videoId };
  }

  const job = (await queue.getJob(jobId)) as Job<AnalyzeVideoJobData> | null;
  if (!job) return null;

  const state = (await job.getState()) as UnifiedJobStatus["state"];
  const progress = typeof job.progress() === "number" ? (job.progress() as number) : 0;
  const meta = (job.data.meta || { step: "queued", progress }) satisfies JobMeta;

  return {
    jobId: String(job.id),
    state,
    meta: { ...meta, progress: meta.progress ?? progress },
    videoId: job.data.videoId
  };
}
