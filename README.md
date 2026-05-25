# AI Viral Clip Generator (MVP)

Full-stack app that uploads long videos, runs background analysis jobs (Bull + Redis), and (next) generates viral-ready short clips.

## Prerequisites
- Node.js (already configured in this environment)
- Redis (recommended via Docker)
- FFmpeg (required later for real clip cutting/captions)

## Setup
1. Start Redis:

```bash
docker compose up -d
```

2. Install dependencies:

```bash
npm run install:all
```

3. Copy env file:

```bash
copy server\\.env.example server\\.env
```

4. Run the app (client + API + worker):

```bash
npm run dev
```

Client: http://localhost:5173  
API: http://localhost:3001

## Current MVP Status
- Upload flow end-to-end: upload → enqueue analysis → poll job steps
- Analysis job is a safe placeholder pipeline (no OpenAI/FFmpeg yet)

## Deploy (Vercel)
This repo is structured for Vercel frontend hosting. The backend (Express + background jobs + local files) should be hosted separately.

### 1) Deploy the frontend
- Create a new Vercel project from this GitHub repo
- Set **Root Directory** to `client`
- Build Command: `npm run build`
- Output Directory: `dist`

### 2) Point the frontend at your backend
In Vercel Project Settings → Environment Variables:
- `VITE_API_BASE` = `https://YOUR_BACKEND_BASE_URL`

The app will call:
- `${VITE_API_BASE}/api/*` for API
- `${VITE_API_BASE}/uploads/*` and `${VITE_API_BASE}/outputs/*` for static assets (later)

## Folder Structure
- client: React + Tailwind UI
- server: Express API + Bull worker
- uploads: raw uploaded videos (local filesystem)
- outputs: processed outputs (local filesystem)
