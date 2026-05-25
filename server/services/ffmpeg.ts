import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import fs from "fs/promises";
import path from "path";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
if (ffprobeStatic.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path);
}

export async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function getVideoDurationSec(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err: unknown, data: any) => {
      if (err) return reject(err);
      const duration = data.format.duration;
      resolve(typeof duration === "number" ? duration : 0);
    });
  });
}

export async function extractAudioToMp3(inputVideoPath: string, outputAudioPath: string) {
  await ensureDir(path.dirname(outputAudioPath));
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputVideoPath)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioBitrate("64k")
      .outputOptions(["-ac 1", "-ar 16000"])
      .save(outputAudioPath)
      .on("end", () => resolve())
      .on("error", (err: unknown) => reject(err));
  });
}

export async function extractAudioToWav(inputVideoPath: string, outputAudioPath: string) {
  await ensureDir(path.dirname(outputAudioPath));
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputVideoPath)
      .noVideo()
      .outputOptions(["-ac 1", "-ar 16000", "-c:a pcm_s16le"])
      .save(outputAudioPath)
      .on("end", () => resolve())
      .on("error", (err: unknown) => reject(err));
  });
}

export async function cutClipToMp4(opts: {
  inputVideoPath: string;
  outputClipPath: string;
  startTimeSec: number;
  endTimeSec: number;
}) {
  const duration = Math.max(0.1, opts.endTimeSec - opts.startTimeSec);
  await ensureDir(path.dirname(opts.outputClipPath));
  return new Promise<void>((resolve, reject) => {
    ffmpeg(opts.inputVideoPath)
      .setStartTime(opts.startTimeSec)
      .setDuration(duration)
      .outputOptions([
        "-movflags +faststart",
        "-preset veryfast",
        "-crf 22",
        "-pix_fmt yuv420p"
      ])
      .videoCodec("libx264")
      .audioCodec("aac")
      .save(opts.outputClipPath)
      .on("end", () => resolve())
      .on("error", (err: unknown) => reject(err));
  });
}

export async function generateThumbnailJpg(opts: {
  inputVideoPath: string;
  outputImagePath: string;
  atTimeSec: number;
}) {
  await ensureDir(path.dirname(opts.outputImagePath));
  return new Promise<void>((resolve, reject) => {
    ffmpeg(opts.inputVideoPath)
      .seekInput(opts.atTimeSec)
      .frames(1)
      .outputOptions(["-q:v 2"])
      .save(opts.outputImagePath)
      .on("end", () => resolve())
      .on("error", (err: unknown) => reject(err));
  });
}
