# Portfolio

**Live site: [daq-ng.github.io](https://daq-ng.github.io)**

A fast, accessible personal portfolio for software engineering job applications, styled as a **retro pixel RPG**
(dialog-box panels, pixel fonts, a sprite, "quest log" projects).
Built with [Astro](https://astro.build) as a static site. The homepage opens with **DAT.EXE**, an optional pixel-art
mini-RPG (see below); every page also works as a normal portfolio without playing or without JavaScript.

## Quick start

```bash
npm install
npm run dev        # http://localhost:4321, reloads as you edit
npm run build      # checks placeholders + types, outputs static files to dist/
npm run preview    # serves dist/ locally to check the production build
npm test           # unit tests for the game logic
```

Requires Node 18.20+ (tested on Node 22).

---

## DAT.EXE: The Lost Save File (the homepage adventure)

The top of the homepage is an optional 3–5 minute top-down micro-RPG. The visitor boots a corrupted save file,
explores a small digital ruin with the robot guide **BYTE**, and recovers three memory fragments. Each one unlocks a
real project card. Everything in the game is also in the normal sections below it and in the **Portfolio** index,
so nobody has to play.

**Controls**

| Action | Keyboard | Touch / mouse |
|---|---|---|
| Move | Arrow keys or W A S D | On-screen pad, or tap/click where to walk |
| Interact / next line | E, Space or Enter | E button, or tap the object |
| Close dialogue / windows | Esc | ✕ button or tap outside |

Always visible above the game: **Portfolio** (full index), **Controls** (help, settings, *Reset progress*),
**Sound**, **Reduced motion**, and **Skip adventure** (jumps to the normal page).

**The quest**

| Where | What | Unlocks |
|---|---|---|
| Terminal Room (start) | Reconnect 3 circuit nodes | Memory 1: Book Marketplace API |
| Corrupted forest ruins | Find the exit on a procedurally generated dungeon map | Memory 2: Dungeon Crawler |
| Workshop | Tune 3 dials on the notes machine | Memory 3: NoteWave |
| Workshop bench · Archive · Personal room · Signal beacon | Optional | Skills · Education · About & interests · Contact |
| Restore Chamber (unseals after 3 fragments) | Use the core | SAVE RESTORED → portfolio index |

Progress (fragments, discoveries) and settings are saved in `localStorage`. If the browser blocks storage, the game
still works and says progress won't persist.

**Code** (`src/game/`, plain TypeScript, no game library)

| File | Job |
|---|---|
| `main.ts` | Wires the DOM: boot screen, input, dialogue box, puzzles, panels, settings, save/reset |
| `engine.ts` | Canvas at 320×180: rendering, movement + collision, camera clamping, robot, prompts, ambient animation |
| `map.ts` | The 48×30 tile map, rooms, objects, collision boxes, interaction points (seeded, so identical every visit) |
| `quest.ts` · `dialogue.ts` · `puzzles.ts` · `storage.ts` | Pure state logic (unit-tested) |
| `art.ts` · `tiles.ts` | Hand-made 1-bit pixel art as text grids, and generated tiles (black, white, 2 greys) |
| `audio.ts` | Original square-wave sound effects (no audio files) |

The markup and every panel's text are rendered by `src/components/DatExe.astro` from **`src/data/portfolio.ts`**.

**Editing content:** change `src/data/portfolio.ts` only. Missing links stay `null` with a `TODO` comment, and the
UI shows "coming soon" instead of a dead button. Project screenshots are placeholders in
`src/components/DxProjectCard.astro`; swap in an `<img>` when you have images.

**Assets:** the reference sheets are in `design/reference/`, one folder per category
(`01_boot_ui` … `05_concept_reference`). They're *reference only*: the game's sprites and tiles were redrawn by hand
in `art.ts` / `tiles.ts` at 16 px so they're pixel-perfect. `public/game/` holds the few cleaned sprites the normal
page sections use.

**Tests:** `npm test` runs Vitest over quest progression, dialogue/interaction state, storage fallback, the three
puzzles, portfolio link fallback, and a map check that every interactable is reachable (and the core only after
the chamber unseals). Add `?dx-debug` to the URL to expose `window.__dx` for manual checks in the console.

**Deploy:** nothing extra. The game is part of the static build, so the GitHub Pages workflow (or Vercel, see
[Deploy](#3-deploy)) ships it with the rest of the site.

---

## 1. Make it yours (before you deploy)

Everything in `[square brackets]` is a placeholder. Nothing about you has been made up — you fill in the real details.

| What | Where |
|---|---|
| Name, headline, intro, about, education, skills, email, GitHub, LinkedIn | `src/data/portfolio.ts` |
| Projects (one Markdown file each) | `src/content/projects/*.md` |
| Resume | replace `public/resume.pdf` (keep the file name, or change `resume` in `portfolio.ts`) |
| Colours, fonts, spacing | the variables at the top of `src/styles/global.css` |
| The pixel sprite | the text grid and `palette` in `src/components/PixelSprite.astro` (one letter = one pixel) |
| "Open to entry-level roles" badge | `availability` in `portfolio.ts` (`''` hides it) |
| Favicon | `public/favicon.svg` |

`npm run build` prints which files still contain placeholders. For the full list:

```bash
npm run check:content -- --verbose
```

### Adding a project

1. Copy `src/content/projects/_template.md` to e.g. `src/content/projects/task-api.md`.
   The file name becomes the URL: `/projects/task-api/`.
2. Fill in the frontmatter (the block between `---` lines) and the sections below it.
3. `featured: true` puts it on the homepage; `order` controls position (lower first);
   `draft: true` hides it without deleting it.

Delete `project-1.md`–`project-3.md` once you have real projects. If more projects exist than are featured,
a "See all projects" button links to `/projects/` automatically.

The frontmatter is **validated at build time** (`src/content.config.ts`). A typo like `featurd: true`,
a missing `title`, or a malformed URL stops the build with a message naming the file and field.

**Writing tips for recruiters:** lead with the problem and what works today; describe *your* part on team
projects; include an architecture section and one real challenge you solved — interviewers ask about these.
Only list what is actually implemented.

### Adding images to a project page

Put the image in `public/images/` and reference it in the Markdown:
`![Architecture diagram of the API](/images/task-api-architecture.png)`. Always write meaningful alt text.
(If you deploy under a base path, prefix it: `/portfolio/images/...`.)

---

## 2. Architecture

```
src/
├── data/portfolio.ts         ← your profile content (single source of truth; site.ts re-exports it)
├── content/projects/*.md     ← one file per project
├── content.config.ts         ← schema that validates project frontmatter
├── lib/
│   ├── projects.ts           ← load / filter / sort projects
│   └── url.ts                ← builds links that respect the base path
├── layouts/BaseLayout.astro  ← <head>, SEO tags, skip link, header, footer
├── components/               ← Header, Hero, About, Skills, ProjectCard, Contact, Footer, Icon, PixelSprite
├── pages/                    ← every file here becomes a URL
│   ├── index.astro           →  /
│   ├── projects/index.astro  →  /projects/
│   ├── projects/[slug].astro →  /projects/<file-name>/  (one per Markdown file)
│   └── 404.astro             →  not-found page
└── styles/global.css         ← design tokens + shared styles
public/                       ← copied as-is: resume.pdf, favicon.svg, robots.txt
scripts/check-placeholders.mjs
```

### How a page gets built

```
portfolio.ts ────────┐
                     ├─► components ─► pages ─► astro build ─► dist/*.html (static)
projects/*.md ─► content.config.ts (validate) ─► lib/projects.ts ─┘
```

1. **Content is separate from presentation.** Components never contain your personal text; they read it
   from `portfolio.ts` or the project Markdown. Updating your bio never means touching layout code.
2. **Astro components** (`.astro` files) have a frontmatter script between `---` fences that runs **at build
   time only**, followed by HTML-like markup. Styles in a component's `<style>` block are automatically
   scoped to that component, so they cannot leak into others.
3. **Dynamic routes:** `pages/projects/[slug].astro` exports `getStaticPaths()`, which returns one entry per
   project. Astro calls it during the build and generates a page for each — no server needed at runtime.
4. **Output** is a folder of plain HTML/CSS (`dist/`) that any static host can serve.

### Key decisions and why

| Decision | Why | Trade-off |
|---|---|---|
| **Astro, static output** | Pages built from Markdown with type-checked content; ships no JS by default; deploys free anywhere. | Needs Node and a build step (vs. hand-written HTML). Worth it once you have 3+ project pages — no copy-pasted headers. |
| **No UI framework (React/Vue)** | Nothing on the site needs client-side state. Less to learn, update and break. | Adding interactivity later means adding an Astro island (easy, see below). |
| **Plain CSS with custom properties** | One file of tokens controls the whole look; no Tailwind/CSS-in-JS to learn. | You write CSS yourself. |
| **1-bit look, one readable pixel font** | Ink-on-paper panels on a dark backdrop, with pixel-art scenery drawn as text grids in `src/data/sprites.ts` (rendered by `PixelArt.astro`). Pixelify Sans is used for the UI and short text; long project write-ups use the system font. Fonts are self-hosted via `@fontsource` (latin subset), no Google Fonts request. | Pixel art is decorative and hidden from screen readers; large scenery is hidden on small screens. |
| **Pixel frames with `box-shadow`** | `.pixel-box` draws the notched RPG window border with offset shadows — no images, scales cleanly, recolours with the theme. | Shadows don't take layout space, so boxes have a small margin. |
| **Motion: CSS first, tiny JS for scroll** | Hero load-in and page cross-fades (`@view-transition`) are pure CSS. Scroll reveal uses `IntersectionObserver` (~0.5 KB, inlined). `steps()` timing makes motion deliberately choppy, like sprites. | Cross-fade only in Chrome/Edge/Safari 18.2+; others just navigate normally. |
| **mailto contact instead of a form** | No backend, no spam, no third-party data handling. | Visitors need an email client. See "Adding a contact form" below. |
| **Light/dark via `prefers-color-scheme`** | Follows the visitor's OS setting with zero JS. | No manual toggle. |
| **Placeholder check script** | Prevents deploying "[Your Name]". | Warns only; add `--strict` in CI once your content is final. |

### Accessibility built in

- Skip-to-content link, semantic landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page, ordered headings.
- Visible `:focus-visible` outlines; all interactive targets ≥ 44px tall.
- Colour contrast meets WCAG AA in both themes.
- Icon-only links have `aria-label`s; links opening a new tab announce it to screen readers.
- `prefers-reduced-motion` turns off **all** animation: load-in, scroll reveal, blinking, sprite bob, page transitions.
- Scroll-reveal content is hidden only after the script has opted in (`html.js-reveal`), so nothing can get stuck
  invisible if JavaScript is off or fails.
- Decorative pixel art and ▶/◆ symbols are hidden from screen readers.
- Project cards: the whole card is clickable, but only the title is a link (one tab stop, clear name).

---

## 3. Deploy

The build output is static, so any of these work. All are free for a personal site.

### Option A — Netlify / Vercel / Cloudflare Pages (simplest)

1. Push this folder to a GitHub repository.
2. Import the repo in the host's dashboard. Astro is auto-detected
   (build command `npm run build`, output directory `dist`).
3. Set the environment variable `SITE_URL` to your final URL (e.g. `https://yourname.netlify.app`)
   so canonical/social links are correct.

### Option B — GitHub Pages

1. Push to GitHub, then in the repo: **Settings → Pages → Source: GitHub Actions**.
2. Edit `.github/workflows/deploy.yml`:
   - `SITE_URL: https://<your-username>.github.io`
   - `BASE_PATH: /` if the repo is named `<your-username>.github.io`, otherwise `/<repo-name>`.
3. Push to `main`; the workflow builds and publishes. All internal links go through `url()` in
   `src/lib/url.ts`, so a sub-path like `/portfolio/` works without code changes.

### Custom domain

Buy a domain, then follow your host's "custom domain" guide and update `SITE_URL`.

---

## 4. Maintaining and extending

| Task | How |
|---|---|
| Update bio / skills / links | Edit `src/data/portfolio.ts` |
| Add / hide / reorder a project | Add a Markdown file; `draft: true`; change `order` |
| Change colours | Edit tokens at the top of `src/styles/global.css` (both light and dark blocks) |
| Add a homepage section (e.g. Experience) | Create `src/components/Experience.astro` following `Skills.astro`, add its data to `portfolio.ts`, include it in `src/pages/index.astro`, add a nav link in `Header.astro` |
| Add a new page (e.g. `/blog/`) | Create `src/pages/blog.astro` using `BaseLayout` |
| Update dependencies | `npm outdated`, then `npm update`; run `npm run build` and check the site |

**Adding a contact form (optional).** Use a form service such as Formspree or Netlify Forms: replace the
buttons in `Contact.astro` with a `<form action="<service URL>" method="POST">` with labelled inputs.
Keep the mailto link as a fallback.

**Animating something new.** Add `class="reveal"` to any element to fade it in on scroll
(add `style="--i: 1"` etc. to stagger), or `class="animate-in"` to a container to fade its children in on page load.

**Adding interactivity (optional).** Add a `<script>` tag inside a component — Astro bundles it — or install
an integration (`npx astro add react`) and render a component with `client:visible` so it only loads JS
when needed.

### Note on `overrides` in package.json

`@rollup/pluginutils` is pinned to `5.3.0`. Version 5.5.x (Oct 2026) broke `astro build` with
`Named export 'walk' not found ... 'estree-walker'`. Remove the override after an Astro update and run
`npm install && npm run build`; if the build passes, the pin is no longer needed.

### Before each deploy

```bash
npm run build                      # 0 errors, no placeholder warnings
npm run preview                    # click through every page, test the resume download
```

Also worth running Lighthouse (Chrome DevTools → Lighthouse) on the deployed URL.
