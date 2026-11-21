# HANDOFF — Portfolio Site

## Project goal
A static personal portfolio for entry-level Software Engineer / Backend Developer applications:
hero intro, About, Skills, Featured Projects, project detail pages, resume download, GitHub/LinkedIn, Contact.
The homepage opens with **DAT.EXE: The Lost Save File**, an optional 3–5 minute pixel-art micro-RPG that
reveals the same content (spec: Downloads/CLAUDE_BUILD_PROMPT.md).

## Current status (2026-11-22)
- **Works:** DAT.EXE end to end (boot → 3 puzzles → 3 project cards → chamber unseals → SAVE RESTORED →
  portfolio index), 4 optional discoveries (skills, education, about+interests, contact), save/continue,
  reset, mute, reduced motion, keyboard + touch pad + tap-to-move, 375 px and desktop. Normal sections,
  project pages, 404 and resume download unchanged below the game.
- **Content:** all text and links in `src/data/portfolio.ts` (`site.ts` re-exports it). Skills = resume list
  plus Docker and Linux (Dat chose "merge both"). Intro/About still a draft to rewrite in Dat's voice.
- **Live:** https://daq-ng.github.io (GitHub Pages, repo DaQ-Ng/DaQ-Ng.github.io). Every push to `main`
  rebuilds and redeploys via `.github/workflows/deploy.yml`. DAT.EXE is not committed/deployed yet.
- **Link issues:** `https://github.com/DaQ-Ng/notewave` returns 404 publicly (private or renamed). Set to `null`
  in `portfolio.ts` so the game shows "coming soon"; `src/content/projects/notewave.md` still links it.
  Dungeon Crawler has no repo, demo or case-study page yet (all `null` + TODO).
- **Repo issues found earlier:** notewave merge-conflict markers (fix on branch `fix/main-merge-markers`,
  commit 44c414b, not merged); Bookapi README only documents books; resume says "12 tests", repo has 20.

## Architecture and tools
Astro 5 (static output), 1-bit theme in CSS tokens, Pixelify Sans via @fontsource. See README.
DAT.EXE: `src/components/DatExe.astro` (markup, dialogs, styles) + `src/game/` (TypeScript, Canvas 320×180,
no game library). Pure logic in `quest.ts`, `dialogue.ts`, `puzzles.ts`, `storage.ts` (Vitest in `tests/`).
Art redrawn by hand as pixel grids (`art.ts`, `tiles.ts`); reference sheets in `design/reference/` (not deployed).
`public/game/` keeps 8 cleaned sprites used by the normal sections (header avatar, About, Contact, decorations).
Commands: `npm run dev`, `npm run build`, `npm run preview`, `npm test`, `npm run check:content -- --verbose`.

## Verification (actually run, 2026-11-22)
- `npm run build`: astro check 0 errors / 0 warnings. `npm test`: 37 passed (6 files).
- Browser preview (desktop 1280 and 375 px): full quest played via keyboard events and clicks; every dialog
  opens/closes; save persists across reload (Continue); reset clears it; no horizontal overflow at 375 px.
- Local routes 200: `/`, `/projects/`, `/projects/bookapi/`, `/projects/notewave/`, `/resume.pdf`.
  External: github.com/DaQ-Ng and /Bookapi 200; /notewave 404 (see above). LinkedIn not checked (blocks bots).
- Not yet checked: real phone hardware, screen reader pass, Lighthouse.

## Decisions and pitfalls
- `@rollup/pluginutils` pinned to 5.3.0 via `overrides` — 5.5.x broke `astro build` (estree-walker named export).
- rAF timestamps can be earlier than `performance.now()` on the first frame: the engine clamps dt at 0.
- Keys are captured only while the game screen has focus, so arrows/space still scroll the page otherwise.
- Contact is mailto (no backend) on purpose. `?dx-debug` exposes `window.__dx` for manual testing.

## Next action
1. Dat: play it, then commit and push to deploy.
2. NoteWave repo: make it public (or give the right URL), then set `repo` in `portfolio.ts`.
3. Add Dungeon Crawler links and a `src/content/projects/dungeon.md` case study (`page: 'dungeon'`).
4. Rewrite intro + About in Dat's own voice; add real project screenshots to `DxProjectCard.astro`.
