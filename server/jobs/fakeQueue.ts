import { randomUUID } from "crypto";
import type { JobMeta } from "./queues.js";

type FakeJobState = "waiting" | "active" | "completed" | "failed";

type FakeJob = {
  id: string;
  videoId: string;
  state: FakeJobState;
  meta: JobMeta;
};

const jobs = new Map<string, FakeJob>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPipeline(job: FakeJob) {
  const update = (meta: JobMeta, state?: FakeJobState) => {
    const next: FakeJob = { ...job, state: state || job.state, meta };
    jobs.set(job.id, next);
    job = next;
  };

  try {
    update({ step: "transcribing", progress: 10, message: "Transcribing audio…", videoId: job.videoId }, "active");
    await sleep(600);
    update({ step: "detecting_moments", progress: 35, message: "Detecting viral moments…", videoId: job.videoId });
    await sleep(600);
    update({ step: "scoring_clips", progress: 55, message: "Scoring clips…", videoId: job.videoId });
    await sleep(500);
    update({ step: "cutting_clips", progress: 80, message: "Cutting clips…", videoId: job.videoId });
    await sleep(700);
    update({ step: "generating_thumbnails", progress: 95, message: "Generating thumbnails…", videoId: job.videoId });
    await sleep(500);
    update({ step: "ready", progress: 100, message: "Ready", videoId: job.videoId }, "completed");
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
  void runPipeline(job);
  return id;
}

export async function getFakeJobStatus(jobId: string) {
  return jobs.get(jobId) || null;
}
