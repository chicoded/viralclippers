import type { Job } from "bull";
import { getAnalyzeVideoQueue, type AnalyzeVideoJobData, type JobMeta } from "./queues.js";
import { readVideoMetadata, writeVideoMetadata } from "../services/storage.js";
import { runAnalyzeVideoPipeline } from "./analyzeVideo.pipeline.js";

async function update(job: Job<AnalyzeVideoJobData>, meta: JobMeta) {
  await job.update({ ...job.data, meta });
  await job.progress(meta.progress);
}

export function registerAnalyzeVideoProcessor() {
  const queue = getAnalyzeVideoQueue();
  if (!queue) throw new Error("REDIS_URL not set");

  queue.process(async (job: Job<AnalyzeVideoJobData>) => {
    try {
      await runAnalyzeVideoPipeline({
        videoId: job.data.videoId,
        onUpdate: async (meta) => update(job, meta)
      });

      const existing = await readVideoMetadata(job.data.videoId);
      if (existing) {
        await writeVideoMetadata(job.data.videoId, {
          ...existing,
          video: { ...existing.video, status: "ready", jobId: String(job.id) }
        });
      }
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
