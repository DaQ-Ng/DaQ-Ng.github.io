# HANDOFF — Portfolio Site

## Project goal
A static personal portfolio for entry-level Software Engineer / Backend Developer applications:
hero intro, About, Skills, Featured Projects, project detail pages, resume download, GitHub/LinkedIn, Contact.

## Current status (2026-11-06)
- **Works:** all sections and pages render; responsive at 375px and desktop; light + dark themes;
  project pages generated from Markdown; 404 page; resume download; GitHub Pages workflow written.
- **Content (updated 2026-11-06):** `site.ts` filled from Dat_Nguyen_General.pdf; real resume in `public/`.
  Projects: `bookapi.md`, `notewave.md`, written from the repos' code and the resume (checked `@Version`,
  409 handler, upload/RQ/Redis/CORS code). Phone number and citizenship line left off the site on purpose.
  Intro/About are a draft to rewrite in Dat's own voice. No placeholders remain.
- **Not done:** not deployed; not a git repo yet.
- **Repo issues found (fix before recruiters look):** notewave `backend/app/main.py` and
  `backend/requirements.txt` contain unresolved merge-conflict markers; Bookapi README only documents
  books (not auth/orders/reviews). Resume says "12 tests" for Bookapi; the repo has 20 `@Test` methods (not run).

## Architecture and tools
Astro 5 (static output), retro pixel RPG theme in plain CSS tokens, pixel fonts via @fontsource, ~0.5 KB inline JS for scroll reveal. See README §2.
Commands: `npm run dev`, `npm run build`, `npm run preview`, `npm run check:content -- --verbose`.

## Verification (actually run)
- `npm run build`: astro check 0 errors / 0 warnings; 6 pages built.
- Browser preview: `/`, `/projects/`, `/projects/project-2/` → 200; `/nope` → 404;
  `/resume.pdf` → application/pdf; no horizontal overflow at 375px; 1 `h1` per page; 1 tiny inline script (scroll reveal).
- Not yet checked: Lighthouse score on a deployed URL; screen-reader pass; GitHub Actions workflow run.

## Decisions and pitfalls
- `@rollup/pluginutils` pinned to 5.3.0 via `overrides` — 5.5.x broke `astro build` (estree-walker named export).
- `@types/node` added so `astro check` accepts `process.env` in `astro.config.mjs`.
- Contact is mailto (no backend) on purpose.

## Next action
1. Dat reviews/rewrites intro + About in `src/data/site.ts`.
2. NoteWave: fix already exists on DaQ-Ng/notewave branch `fix/main-merge-markers` (commit 44c414b:
   markers removed, duplicate CORS removed, basic-pitch import optional; main.py compiles). Needs merging
   into `main` (and a PR to the team's upstream repo).
3. `git init`, push to GitHub, deploy (README §3).
4. Optional: add Dungeon Crawler and Arlington Organic Market project pages (from resume).
