---
title: "NoteWave"
summary: "A team-built web app that turns MP3 recordings into notes. I work on the FastAPI backend: validated uploads, background jobs with RQ, and Redis caching."
tech: ["Python", "FastAPI", "Redis", "RQ", "React", "Vite"]
featured: true
order: 20
status: "In progress"
context: "Team project · ACM Create, UT Arlington"
date: "Sep 2026 – present"
repo: "https://github.com/DaQ-Ng/notewave"
---

## Overview

NoteWave is an audio-to-note transcription web app built by a student team in ACM Create at UT Arlington.
A user uploads an MP3 from the React/Vite frontend, and the backend analyzes it and returns the detected notes.

The project is still in development. Inside the upload job pipeline, note detection is still a placeholder;
a teammate has added a separate transcription endpoint using basic-pitch. The upload, job, and caching
pipeline I built is in place around it.

## My role

I'm a student software developer on the backend. My work:

- **Upload endpoint (FastAPI):** `POST /upload` accepts MP3 files and rejects anything else before processing.
  It checks the file extension, content type, and a 25 MB size limit, then reads the first bytes to confirm a real MP3
  signature (an `ID3` tag or an MP3 frame header), so a renamed file is rejected with `400`.
- **Background jobs (RQ):** analysis is slow, so the endpoint doesn't wait for it. It saves the upload to a temporary
  file, puts a job on an RQ queue, and returns a job ID right away. Clients poll `GET /jobs/{job_id}` for
  `processing`, `done` (with the notes), or `failed`. The temp file is deleted whether the job succeeds or fails.
- **Result caching (Redis):** each upload is hashed with SHA-256. If the same file was analyzed before, the cached
  result is returned immediately instead of being reprocessed. Results and job records are stored in Redis with
  expiry times, so they survive API restarts without growing forever.
- **CORS:** configured so the team's React/Vite frontend, running on a different port, can call the API.

## Architecture

```
React/Vite frontend
      │  POST /upload (MP3)
      ▼
FastAPI ──► validate ──► SHA-256 hash ──► Redis cache hit? ──► return result
      │                                         │ miss
      │                                         ▼
      │                               enqueue job (RQ) ──► worker: analyze ──► save to Redis
      ▼
GET /jobs/{id} ◄── client polls for status
```
