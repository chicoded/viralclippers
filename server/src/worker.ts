import "dotenv/config";
import { getAnalyzeVideoQueue } from "../jobs/queues.js";
import { registerAnalyzeVideoProcessor } from "../jobs/analyzeVideo.processor.js";

const queue = getAnalyzeVideoQueue();

if (!queue) {
  console.log("REDIS_URL not set. Worker is disabled (using in-memory jobs via API process).");
} else {
  registerAnalyzeVideoProcessor();

  queue.on("error", (err: unknown) => {
    console.error("Queue error:", err);
  });

  console.log("Worker running and waiting for jobs…");
}
