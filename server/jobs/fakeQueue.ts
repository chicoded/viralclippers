import { randomUUID } from "crypto";
import type { JobMeta } from "./queues.js";
import { runAnalyzeVideoPipeline } from "./analyzeVideo.pipeline.js";

type FakeJobState = "waiting" | "active" | "completed" | "failed";

type FakeJob = {
  id: string;
  videoId: string;
  state: FakeJobState;
  meta: JobMeta;
};

const jobs = new Map<string, FakeJob>();

let chain = Promise.resolve();

async function runPipeline(job: FakeJob) {
  const update = (meta: JobMeta, state?: FakeJobState) => {
    const next: FakeJob = { ...job, state: state || job.state, meta };
    jobs.set(job.id, next);
    job = next;
  };

  try {
    await runAnalyzeVideoPipeline({
      videoId: job.videoId,
      onUpdate: async (meta, state) => update(meta, state)
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    update({ step: "failed", progress: 100, message: "Failed", error: msg, videoId: job.videoId }, "failed");
  }
}

export async function enqueueFakeAnalyzeVideo(videoId: string) {
  const id = randomUUID();
  const job: FakeJob = {
    id,
    videoId,
    state: "waiting",
    meta: { step: "queued", progress: 0, message: "Queued", videoId }
  };
  jobs.set(id, job);
  chain = chain.finally(() => runPipeline(job));
  return id;
}

export async function getFakeJobStatus(jobId: string) {
  return jobs.get(jobId) || null;
}
