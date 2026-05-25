export type ClipRecord = {
  id: string;
  videoId: string;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  viralScore: number;
  hookStrength: number;
  reason: string;
  suggestedTitle: string;
  hashtags: string[];
  transcriptExcerpt?: string;
  paths: {
    sourceClip: string;
    thumbnail: string;
  };
};

export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

