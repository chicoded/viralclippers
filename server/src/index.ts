import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "path";
import multer from "multer";
import { randomUUID } from "crypto";
import fs from "fs";
import { enqueueAnalyzeVideo, getAnalyzeJobStatus } from "../jobs/jobManager.js";
import { outputsDir, uploadsDir } from "../services/paths.js";
import { ensureDir, getVideoUploadDir, writeVideoMetadata } from "../services/storage.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Upload strategy (MVP):
// - Generate a videoId per request
// - Store the file at uploads/{videoId}/original.{ext}
const upload = multer({
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const videoId = String(req.headers["x-video-id"] || "");
      if (!videoId) return cb(new Error("Missing upload session id"), "");
      const dir = getVideoUploadDir(videoId);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".mp4";
      cb(null, `original${ext}`);
    }
  }),
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ext === ".mp4" || ext === ".mov";
    if (!allowed) return cb(new Error("Only MP4 and MOV files are supported"));
    cb(null, true);
  }
});

app.post("/api/upload", async (req, res) => {
  const videoId = randomUUID();
  req.headers["x-video-id"] = videoId;

  upload.single("file")(req, res, async (err) => {
    if (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      return res.status(400).json({ error: message });
    }

    const file = (req as unknown as { file?: Express.Multer.File }).file;
    if (!file) return res.status(400).json({ error: "No file provided" });

    await ensureDir(outputsDir);
    await ensureDir(uploadsDir);

    await writeVideoMetadata(videoId, {
      video: {
        id: videoId,
        originalFilename: file.originalname,
        uploadPath: file.path,
        createdAt: new Date().toISOString(),
        status: "uploaded"
      },
      clips: []
    });

    res.json({
      videoId,
      filename: file.originalname,
      bytes: file.size
    });
  });
});

// Enqueues the analysis pipeline (Bull if Redis is configured, otherwise in-memory fallback).
app.post("/api/analyze/:id", async (req, res) => {
  const videoId = req.params.id;
  const jobId = await enqueueAnalyzeVideo(videoId);
  res.json({ jobId });
});

app.get("/api/jobs/:id", async (req, res) => {
  const jobId = req.params.id;
  const status = await getAnalyzeJobStatus(jobId);
  if (!status) return res.status(404).json({ error: "Job not found" });

  res.json({
    jobId: status.jobId,
    state: status.state,
    step: status.meta.step,
    progress: status.meta.progress,
    message: status.meta.message,
    error: status.meta.error,
    videoId: status.videoId
  });
});

app.use("/uploads", express.static(uploadsDir));
app.use("/outputs", express.static(outputsDir));

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
