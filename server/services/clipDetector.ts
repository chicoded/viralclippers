import { getOpenAIClient, hasOpenAIKey } from "./openai.js";
import { ollamaGenerate } from "./ollama.js";
import type { TranscriptSegment } from "./types.js";

export type DetectedClip = {
  start_time: number;
  end_time: number;
  viral_score: number;
  hook_strength: number;
  reason: string;
  suggested_title: string;
  hashtags: string[];
};

function extractJsonArray(raw: string) {
  const trimmed = raw.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const startIdx = withoutFence.indexOf("[");
  const endIdx = withoutFence.lastIndexOf("]");
  if (startIdx === -1 || endIdx === -1) throw new Error("Model did not return a JSON array");
  return withoutFence.slice(startIdx, endIdx + 1);
}

export async function detectViralMoments(opts: { segments: TranscriptSegment[]; maxClips?: number }) {
  const maxClips = opts.maxClips ?? 8;

  const transcript = opts.segments
    .map((s) => `[${s.start.toFixed(2)}-${s.end.toFixed(2)}] ${s.text}`)
    .join("\n");

  const system =
    'You are a viral content expert. Given a video transcript with timestamps, identify the 5-10 most viral-worthy moments. For each clip return: start_time, end_time, viral_score (0-100), hook_strength (0-100), reason, suggested_title, hashtags (array of 5). Prioritize: strong hooks in first 3 seconds, emotional peaks, surprising moments, quotable lines, high energy segments. Return as JSON array.';

  const prompt = `System:\n${system}\n\nTranscript:\n${transcript}\n\nReturn JSON array only. Limit to at most ${maxClips} clips.`;

  const content = await (async () => {
    if (hasOpenAIKey()) {
      const openai = getOpenAIClient();
      const resp = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `Transcript:\n${transcript}\n\nReturn JSON array only. Limit to at most ${maxClips} clips.`
          }
        ]
      });
      return resp.choices[0]?.message?.content || "";
    }

    const res = await ollamaGenerate(prompt);
    return res.response || "";
  })();

  if (!content) throw new Error("No model output");

  const json = extractJsonArray(content);
  const parsed = JSON.parse(json) as DetectedClip[];

  return parsed
    .filter((c) => Number.isFinite(c.start_time) && Number.isFinite(c.end_time))
    .slice(0, maxClips);
}
