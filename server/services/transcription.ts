import fs from "fs";
import { getOpenAIClient } from "./openai.js";
import type { TranscriptSegment } from "./types.js";

export type TranscriptionResult = {
  text: string;
  segments: TranscriptSegment[];
};

export async function transcribeAudioWhisper(audioPath: string): Promise<TranscriptionResult> {
  const openai = getOpenAIClient();

  const fileStream = fs.createReadStream(audioPath);

  const resp = await openai.audio.transcriptions.create({
    file: fileStream as unknown as any,
    model: "whisper-1",
    response_format: "verbose_json"
  } as any);

  const text = (resp as any).text as string | undefined;
  const segmentsRaw = ((resp as any).segments || []) as Array<{ start: number; end: number; text: string }>;
  const segments: TranscriptSegment[] = segmentsRaw
    .filter((s) => typeof s.start === "number" && typeof s.end === "number" && typeof s.text === "string")
    .map((s) => ({ start: s.start, end: s.end, text: s.text.trim() }))
    .filter((s) => s.text.length > 0);

  if (!text) {
    const joined = segments.map((s) => s.text).join(" ").trim();
    return { text: joined, segments };
  }

  return { text, segments };
}

