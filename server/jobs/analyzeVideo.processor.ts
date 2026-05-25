import type { Job } from "bull";
import { getAnalyzeVideoQueue, type AnalyzeVideoJobData, type JobMeta } from "./queues.js";
import { readVideoMetadata, writeVideoMetadata } from "../services/storage.js";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function update(job: Job<AnalyzeVideoJobData>, meta: JobMeta) {
  await job.update({ ...job.data, meta });
  await job.progress(meta.progress);
}

export function registerAnalyzeVideoProcessor() {
  const queue = getAnalyzeVideoQueue();
  if (!queue) throw new Error("REDIS_URL not set");

  queue.process(async (job: Job<AnalyzeVideoJobData>) => {
    try {
      await update(job, { step: "transcribing", progress: 10, message: "Transcribing audio…", videoId: job.data.videoId });
      await sleep(900);

      await update(job, { step: "detecting_moments", progress: 35, message: "Detecting viral moments…", videoId: job.data.videoId });
      await sleep(900);

      await update(job, { step: "scoring_clips", progress: 55, message: "Scoring clips…", videoId: job.data.videoId });
      await sleep(700);

      await update(job, { step: "cutting_clips", progress: 80, message: "Cutting clips…", videoId: job.data.videoId });
      await sleep(900);

      await update(job, { step: "generating_thumbnails", progress: 95, message: "Generating thumbnails…", videoId: job.data.videoId });
      await sleep(600);

      const existing = await readVideoMetadata(job.data.videoId);
      if (existing) {
        await writeVideoMetadata(job.data.videoId, {
          ...existing,
          video: { ...existing.video, status: "ready", jobId: String(job.id) }
        });
      }

      await update(job, { step: "ready", progress: 100, message: "Ready", videoId: job.data.videoId });
      return { ok: true, videoId: job.data.videoId };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await update(job, { step: "failed", progress: 100, message: "Failed", error: message, videoId: job.data.videoId });

      const existing = await readVideoMetadata(job.data.videoId);
      if (existing) {
        await writeVideoMetadata(job.data.videoId, {
          ...existing,
          video: { ...existing.video, status: "failed", jobId: String(job.id) }
        });
      }

      throw err;
    }
  });
}
