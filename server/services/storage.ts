import fs from "fs/promises";
import path from "path";
import { outputsDir, uploadsDir } from "./paths.js";
import type { ClipRecord, TranscriptSegment } from "./types.js";

export type VideoRecord = {
  id: string;
  originalFilename: string;
  uploadPath: string;
  createdAt: string;
  status: "uploaded" | "processing" | "ready" | "failed";
  jobId?: string;
};

export type VideoMetadata = {
  video: VideoRecord;
  clips: ClipRecord[];
  transcript?: {
    text: string;
    segments: TranscriptSegment[];
  };
};

export async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

export function getVideoUploadDir(videoId: string) {
  return path.join(uploadsDir, videoId);
}

export function getVideoOutputsDir(videoId: string) {
  return path.join(outputsDir, videoId);
}

export function getVideoMetadataPath(videoId: string) {
  return path.join(getVideoOutputsDir(videoId), "metadata.json");
}

export async function writeVideoMetadata(videoId: string, metadata: VideoMetadata) {
  await ensureDir(getVideoOutputsDir(videoId));
  await fs.writeFile(getVideoMetadataPath(videoId), JSON.stringify(metadata, null, 2), "utf-8");
}

export async function readVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
  try {
    const raw = await fs.readFile(getVideoMetadataPath(videoId), "utf-8");
    return JSON.parse(raw) as VideoMetadata;
  } catch {
    return null;
  }
}
