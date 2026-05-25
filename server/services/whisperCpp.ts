import { spawn } from "child_process";
import fs from "fs/promises";

import type { TranscriptSegment } from "./types.js";

export type WhisperCppResult = {
  text: string;
  segments: TranscriptSegment[];
};

function run(bin: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => {
      stderr += String(d);
    });
    child.on("error", (err) => reject(err));
    child.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(stderr || `whisper.cpp exited with code ${code}`));
    });
  });
}

export async function transcribeWithWhisperCpp(wavPath: string): Promise<WhisperCppResult> {
  const bin = process.env.WHISPER_CPP_BIN || "whisper-cli";
  const modelPath = process.env.WHISPER_CPP_MODEL;
  if (!modelPath) {
    throw new Error("WHISPER_CPP_MODEL is not set (path to ggml model file)");
  }

  const args = ["-m", modelPath, "-f", wavPath, "--output-json-full"];
  const threads = process.env.WHISPER_CPP_THREADS;
  if (threads) args.push("-t", threads);

  await run(bin, args);

  const jsonPath = `${wavPath}.json`;
  const raw = await fs.readFile(jsonPath, "utf-8");
  const parsed = JSON.parse(raw) as any;
  const transcription = Array.isArray(parsed.transcription) ? parsed.transcription : [];

  const segments: TranscriptSegment[] = transcription
    .map((t: any) => {
      const fromMs = t?.offsets?.from;
      const toMs = t?.offsets?.to;
      const text = typeof t?.text === "string" ? t.text.trim() : "";
      if (typeof fromMs !== "number" || typeof toMs !== "number" || !text) return null;
      return { start: fromMs / 1000, end: toMs / 1000, text };
    })
    .filter(Boolean);

  const text = segments
    .map((s) => s.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return { text, segments };
}

