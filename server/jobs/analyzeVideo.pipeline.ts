import path from "path";
import { randomUUID } from "crypto";
import {
  ensureDir,
  extractAudioToMp3,
  generateThumbnailJpg,
  getVideoDurationSec,
  cutClipToMp4
} from "../services/ffmpeg.js";
import { detectViralMoments } from "../services/clipDetector.js";
import { transcribeAudioWhisper } from "../services/transcription.js";
import {
  getVideoOutputsDir,
  readVideoMetadata,
  writeVideoMetadata,
  type VideoMetadata
} from "../services/storage.js";
import type { ClipRecord } from "../services/types.js";
import type { JobMeta, JobStep } from "./queues.js";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeNumber(n: unknown, fallback: number) {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function pickTranscriptExcerpt(segments: { start: number; end: number; text: string }[], start: number, end: number) {
  const parts = segments
    .filter((s) => s.end >= start && s.start <= end)
    .map((s) => s.text.trim())
    .filter(Boolean);
  return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, 420);
}

export async function runAnalyzeVideoPipeline(opts: {
  videoId: string;
  onUpdate: (meta: JobMeta, state?: "waiting" | "active" | "completed" | "failed") => void | Promise<void>;
}) {
  const update = async (step: JobStep, progress: number, message: string) => {
    await opts.onUpdate({ step, progress, message, videoId: opts.videoId });
  };

  const existing = await readVideoMetadata(opts.videoId);
  if (!existing) throw new Error("Video metadata not found. Upload the video first.");

  const baseOutDir = getVideoOutputsDir(opts.videoId);
  const clipsDir = path.join(baseOutDir, "clips");
  const thumbsDir = path.join(baseOutDir, "thumbs");
  const tmpDir = path.join(baseOutDir, "tmp");
  await ensureDir(clipsDir);
  await ensureDir(thumbsDir);
  await ensureDir(tmpDir);

  const nextMeta: VideoMetadata = {
    ...existing,
    video: { ...existing.video, status: "processing" }
  };
  await writeVideoMetadata(opts.videoId, nextMeta);

  await opts.onUpdate({ step: "transcribing", progress: 5, message: "Extracting audio…", videoId: opts.videoId }, "active");

  const audioPath = path.join(tmpDir, "audio.mp3");
  await extractAudioToMp3(existing.video.uploadPath, audioPath);

  await update("transcribing", 20, "Transcribing audio (Whisper)…");
  const transcript = await transcribeAudioWhisper(audioPath);

  await writeVideoMetadata(opts.videoId, {
    ...nextMeta,
    transcript
  });

  await update("detecting_moments", 40, "Detecting viral moments (GPT)…");
  const detected = await detectViralMoments({ segments: transcript.segments, maxClips: 8 });

  await update("scoring_clips", 52, "Scoring clips…");

  await update("cutting_clips", 60, "Cutting clips (FFmpeg)…");
  const durationSec = await getVideoDurationSec(existing.video.uploadPath);

  const clips: ClipRecord[] = [];
  for (let i = 0; i < detected.length; i++) {
    const d = detected[i]!;
    const start = clamp(safeNumber(d.start_time, 0), 0, Math.max(0, durationSec - 0.1));
    const end = clamp(safeNumber(d.end_time, start + 1), start + 0.1, durationSec);
    const clipId = randomUUID();
    const clipPathRel = `clips/${clipId}.mp4`;
    const thumbPathRel = `thumbs/${clipId}.jpg`;
    const clipPathAbs = path.join(baseOutDir, clipPathRel);
    const thumbPathAbs = path.join(baseOutDir, thumbPathRel);

    await cutClipToMp4({
      inputVideoPath: existing.video.uploadPath,
      outputClipPath: clipPathAbs,
      startTimeSec: start,
      endTimeSec: end
    });

    const mid = start + (end - start) * 0.5;
    await generateThumbnailJpg({
      inputVideoPath: clipPathAbs,
      outputImagePath: thumbPathAbs,
      atTimeSec: Math.max(0, mid - start)
    });

    clips.push({
      id: clipId,
      videoId: opts.videoId,
      startTimeSec: start,
      endTimeSec: end,
      durationSec: Number((end - start).toFixed(2)),
      viralScore: clamp(safeNumber(d.viral_score, 50), 0, 100),
      hookStrength: clamp(safeNumber(d.hook_strength, 50), 0, 100),
      reason: String(d.reason || ""),
      suggestedTitle: String(d.suggested_title || ""),
      hashtags: Array.isArray(d.hashtags) ? d.hashtags.map(String).slice(0, 8) : [],
      transcriptExcerpt: pickTranscriptExcerpt(transcript.segments, start, end),
      paths: {
        sourceClip: `${opts.videoId}/${clipPathRel}`.replace(/\\/g, "/"),
        thumbnail: `${opts.videoId}/${thumbPathRel}`.replace(/\\/g, "/")
      }
    });

    const pct = 60 + Math.round(((i + 1) / Math.max(1, detected.length)) * 30);
    await update("cutting_clips", pct, `Cutting clips… (${i + 1}/${detected.length})`);
  }

  clips.sort((a, b) => b.viralScore - a.viralScore);

  await update("generating_thumbnails", 95, "Finalizing metadata…");
  const latest = (await readVideoMetadata(opts.videoId)) || nextMeta;
  await writeVideoMetadata(opts.videoId, {
    ...latest,
    video: { ...latest.video, status: "ready" },
    clips,
    transcript
  });

  await opts.onUpdate({ step: "ready", progress: 100, message: "Ready", videoId: opts.videoId }, "completed");

  return { clips };
}
