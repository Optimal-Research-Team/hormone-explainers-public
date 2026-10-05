# Hormone Explainers: engineering handoff

Handed over on October 4, 2026. This file is identical in both repos. Open work is in each repo's `DEV_TODO.md`.

## In short

- **What it is:** eight short, interactive "scroll stories" on cortisol, sleep and the hormone system, from Optimal Health Clinic, plus a landing page with a real-time WebGL sky.
- **How it's built:** static HTML, CSS and vanilla JS. There's no framework, no build step, no backend, no database, no secrets, no cookies, no analytics, and no patient data. Progress is kept in the reader's own `localStorage`.
- **Where it runs:** GitHub Pages, deployed by GitHub Actions on every push to `main`.
- **Who decides what:** engineering owns the code. Peter (and a clinician) own every medical claim, chapter's wording and glossary definition. Don't change medical content without a sign-off; see "Content changes" below.

## Two versions, two repos

| | Internal (patient) version | Public version |
|---|---|---|
| Audience | Existing patients, mostly in the exam room | Anyone on the web |
| Repo | [Optimal-Research-Team/hormone-explainers](https://github.com/Optimal-Research-Team/hormone-explainers) | [Optimal-Research-Team/hormone-explainers-public](https://github.com/Optimal-Research-Team/hormone-explainers-public) |
| Live | https://optimal-research-team.github.io/hormone-explainers/ | https://optimal-research-team.github.io/hormone-explainers-public/ |
| Present mode (full-screen, clicker-driven, for the exam room) | On | Off (`CONFIG.presentMode = false`; code kept) |
| "For the exam room" landing section | Shown | Off (`CONFIG.examRoom = false`) |
| Medical content | The clinician's original material, with the first round of fixes | Rewritten for accuracy against published sources; every edit is logged in `CHANGES-MEDICAL.md` |
| Clinic chrome | Optimal wordmark only | Menopause Protocol link, "Book an intro" pill, clinic address and phone, crisis lines |
| SEO | Basic meta, OG cards | Full SEO block, JSON-LD, `sitemap.xml`, `robots.txt` (`tools/seo-head.py`) |
| Deploy | Publishes the whole repo root | Stages only the site into `_site` (docs and tools aren't served) |
| Local port (convention) | 3041 | 3061 |
| Both repos are | Public on GitHub | Public on GitHub |

The public repo was forked from the internal one on September 28, 2026. Since then the shared engine files have **drifted**. As of today:

| File | Lines that differ |
|---|---|
| `assets/js/sky.js` | 0 (identical) |
| `assets/js/site.js` | 132 (the public version adds the `CONFIG` flags, clinic chrome, and several accessibility fixes) |
| `assets/css/site.css` | 121 |
| `assets/js/glossary.js` | 37 (medical wording) |
| `index.html`, chapter pages | Content differs on purpose |

The public `site.js` is a superset: with `CONFIG.presentMode` and `CONFIG.examRoom` switched on, it behaves like the internal version. The recommended next step is to make the public repo the single code base, with the two sites differing only by config and content. See `DEV_TODO.md`. Until then, port any engine fix to both repos.

## Run it locally

```bash
python3 -m http.server 3041      # internal repo; use 3061 in the public repo
```

Then open http://localhost:3041. Any static server works, because every path is relative.

Useful URL flags:

| Flag | Pages | Effect |
|---|---|---|
| `?step=N` | Chapters | Open at step N (1-based) |
| `?present` / `?present=last` | Chapters | Open in Present mode at step 1 / the last step (internal, or public with the flag on) |
| `?still` | All | Turn off all motion. Also stops progress from being saved; use for screenshots |
| `?og` | Chapters (with `?present`), landing | Social-card capture layout |
| `?h=HH` | Landing | Pin the hero's hour (0–24), for example `?still&h=18` for sunset |

## Deploy

Push to `main`. `.github/workflows/deploy.yml` uploads the site to GitHub Pages (repo Settings → Pages → Source: GitHub Actions; already set up for both repos). A deploy takes about a minute.

- The internal workflow uploads the repo root (`path: .`), so `README.md`, `tools/` and this file are also served. The public workflow copies only `*.html`, `robots.txt`, `sitemap.xml`, `.nojekyll` and `assets/` into `_site`. Porting the public workflow to the internal repo is in `DEV_TODO.md`.
- `404.html` hard-codes `<base href="/hormone-explainers/">` (public: `/hormone-explainers-public/`). Change it if a repo is renamed or moved to a custom domain.
- `SITE_URL` in `assets/js/site.js` (used by the share button), plus the canonical and OG URLs in each page's `<head>`, contain the full site URL. Change them if the domain changes; in the public repo, re-run `python3 tools/seo-head.py` after editing its `BASE`.

## Architecture

### File map

```
index.html                    Landing: WebGL sky hero + 24-hour chart, series bento, (exam-room section), closing band
01-…html … 08-…html           One chapter each (see "Chapter page anatomy")
404.html                      Not-found page (GitHub Pages serves it for any missing path)
assets/js/site.js             Shared engine: nav, chapter menu, end card, footer, glossary, linked highlighting,
                              animation helpers, story engine, Present mode (public: CONFIG flags)
assets/js/sky.js              Landing-page WebGL sky (window.HXSky)
assets/js/glossary.js         Plain-language definitions: window.HX_GLOSSARY = [[term, definition], …]
assets/css/site.css           Design system and layout (v4: split-screen chapters)
assets/img/chapters/0N.*      Chapter cover photographs (WebP served, JPEG fallback)
assets/img/treeline.png       Hero treeline texture (R near, G mid, B far; 4096×512, tileable)
assets/img/canopy-*           Old canopy photographs; only a CSS fallback still references canopy-wide
assets/og/*.jpg               1200×630 social cards
tools/treeline-from-image.py  Rebuilds treeline.png from a three-tone silhouette (needs numpy + Pillow)
tools/treeline-source.webp    The silhouette the current treeline was built from
tools/qa/                     Headless QA click-through + screenshot tool (Node + local Chrome)
IMAGE_PROMPTS.md              The prompts used to generate the cover photographs
(public) tools/seo-head.py    Writes each page's SEO block, sitemap.xml and robots.txt
(public) CHANGES-MEDICAL.md   Every medical edit, with reason and source
```

Every page loads Google Fonts (Castoro for display, Public Sans for UI), `site.css`, then `site.js` at the end of `<body>`. Chapters also load `glossary.js` first. The landing page also loads `sky.js`. Each page then runs its own inline script.

### Chapter page anatomy

```html
<body data-chapter="3">                        <!-- 1–8; 0 = landing -->
<div id="nav" class="nav-wrap"></div>          <!-- site.js renders the nav here -->
<section class="story at-head" id="story" data-links>
  <header class="chapter-head">                <!-- kicker, h1, lede, Begin / Present, mobile cover, contents list -->
  <div class="stage-col">                      <!-- sticky right-hand panel -->
    <figure class="panel-cover">               <!-- cover plate, shown while .story has .at-head (desktop) -->
    <div class="stage" id="stage">             <!-- the dark diagram panel -->
      <div class="stage-head">  <div class="stage-canvas"><svg>…</svg></div>  <div class="stage-foot">
  <div class="steps">
    <div class="present-top">…</div>           <!-- only visible in Present mode -->
    <article class="step"><div class="step-inner"><span class="step-n"></span>…</div></article> × N
</section>
<div id="end"></div><div id="foot"></div>      <!-- site.js renders the up-next card and footer -->
<script> … HX.story({ onStep: function (i, el, from) { /* drive the diagram */ } }); </script>
```

Each chapter's inline script owns its diagram: it reacts to `onStep(i)` by morphing paths, moving markers and setting the linked-highlight keys. Everything else is shared.

### `site.js`

All of it is one IIFE that exposes `window.HX`:

- **`CHAPTERS` and `COVERS`** at the top: titles, tags, blurbs and file names for all eight chapters. The nav, chapter menu, up-next card and progress badges are built from these.
- **Nav.** A slim bar. On chapters it shows the chapter title once the `<h1>` has scrolled away, plus Present, Chapters and a reading-progress hairline (`--p` on `#nav`). Over any `[data-nav-dark]` section (the landing hero) it switches to `.on-dark`.
- **Chapter menu** (`#cmenu`). It shows viewed and completed state from `localStorage`.
- **Glossary.** For each step, the first use of each term in `HX_GLOSSARY` (in `p`, `li`, `dd`) is wrapped in a `<button class="term">` that opens a popover (`#gtip`). Terms written in capitals match case-sensitively.
- **Linked highlighting.** Inside a `[data-links]` scope, elements with `data-t="key"` are triggers and elements whose `data-k` list contains an active key get `.is-on`; the rest dim. The active keys are, in priority order, hover, then click-pin, then the step's base keys (`scope._links.setBase([...])`).
- **Helpers:** `HX.tween(ms, fn)`, `HX.morph(pathEl, d, ms)` (path tweening; same number of coordinates in both paths), `HX.sampler(path)` (y at a given x along a path), `HX.onReveal(el, cb)`, `HX.whileVisible(el, cb)`.
- **Story engine:** `HX.story({ onStep })`; details below.

### Story engine

- **Activation.** An IntersectionObserver marks the step that crosses a trigger line as active: mid-screen on desktop, and just below the pinned stage on phones (≤ 1000 px). `go(i)` updates the step, the stage counter, the contents list, saved progress, then calls `onStep`.
- **Cover plate.** While the header's foot is below 62% of the viewport, `.story` has `.at-head` and the cover photograph covers the stage. Once it rises past that, the cover dissolves and the stage gets `.in`, which starts its entrance animations (CSS `.draw`, `.fx-fade`, `.fx-pop`, `.fx-rise`). On phones the cover sits in the header instead (`.head-cover-m`).
- **Requested scrolls.** The contents list, the stage arrows, `?step=` and leaving Present mode call `request(i)`. That locks step tracking until the scroll ends (`scrollend`, or 1.8 s), then re-syncs, so passing steps don't flicker the diagram.
- **Present mode.** `body.present` turns the page into a fixed full-screen layout with one step at a time. →, Space, PageDown and Enter go forward; ←, PageUp and Backspace go back; F toggles full screen; Esc exits. Going past the last step loads the next chapter in Present mode (`?present`), and going before the first loads the previous chapter's last step (`?present=last`). Presentation clickers send PageUp and PageDown, so they work as is.
- **Keyboard (scroll mode).** ← and → move between chapters, except when focus is in a form control, a `[role="slider"]` or a `[data-keys]` group.

### Landing hero sky (`sky.js`)

- `HXSky(canvas, opts)` returns `{ set(hour), body(hour), resize() }`, or `null` without WebGL; the page then keeps its CSS gradient fallback. The landing script calls `set(h)` on every render of the 24-hour chart, and hangs the chart's cursor from `body(h).y`, the sun or moon.
- It's one full-screen fragment shader:
  - **Sky colours:** keyframed by clock hour (`KEYS`, hex) and interpolated in OKLab.
  - **Sun:** its colour comes from air mass, so it reddens near the horizon.
  - **Stars:** procedural; they rotate slowly with the hour.
  - **Clouds:** fbm noise.
  - **Treeline:** three registered layers sampled from `treeline.png`, with haze on the far ridge, dawn mist and rim light near the sun.
- **Performance:**
  - Rendering pauses off-screen (IntersectionObserver) and in hidden tabs.
  - Resolution is capped at 1.5× device pixels and drops to 1× or 0.75× if frames get slow.
  - `?still` or reduced motion renders a single frame.
  - `preserveDrawingBuffer` is on so screenshots and re-composites keep the frame.
- **Layout options:** `horizon` (where the far ridge sits, as a fraction of the strip, 0.82) and `mist` (the band the mist occupies) are passed from `index.html`. The strip height follows the chart, so the far ridge sits just under the sun's lane.

### Styling (`site.css`)

- **Tokens** live at the top: colours (cream `#FFFCF7`, forest `#2C4E25`, plus the luminous diagram palette `--l-sage`, `--l-amber`, `--l-peri`, `--l-coral`), fonts, radii, easing, `--gutter` and `--nav-h`.
- **Chapter layout:** one CSS grid. Areas `"head stage" / "steps stage"` on desktop, and `"head" / "stage" / "steps"` at ≤ 1000 px with the stage sticky under the nav.
- **Motion:** respects `prefers-reduced-motion`; `html.still` kills all animation.
- **Mobile matters most:** about 80% of Optimal's web traffic is on phones. Check every change at 390, 375, 360 and 320 px.

### Storage

| Key | Where | Holds |
|---|---|---|
| `hx:seen` | localStorage | Chapter numbers opened on this device |
| `hx:done` | localStorage | Chapter numbers read to the last step |
| `hx:last` | localStorage | `{ n, step, total }`, for "Continue where you left off" on the landing page |
| `hx:ptoast` | sessionStorage | Whether the Present-mode keyboard hint has been shown |

## Common tasks

- **Edit a step's text.** Edit the `<article class="step">` in the chapter file. Keep `<span class="step-n"></span>` empty, because the engine numbers it. An optional `<span class="kicker">` adds a label after the number. If you add, remove or reorder steps, update the chapter's `onStep` logic and arrays (they're indexed by step), and the step count in the contents header.
- **Glossary term.** Add `['term', 'definition']` to `assets/js/glossary.js`. Longer terms win over shorter ones. The term is underlined the first time it appears in each step. Medical sign-off needed.
- **Cover photograph.** Replace `assets/img/chapters/0N.jpg` and `.webp` (3:2, about 1536×1024). On desktop the panel crops to its height; set the focal point per chapter with `style="--op:70%"` on that chapter's `.panel-cover`.
- **Treeline.** Generate a black, mid-grey and light-grey silhouette on white (prompt in `IMAGE_PROMPTS.md` and the commit history), then run `python3 tools/treeline-from-image.py source.webp assets/img/treeline.png`. If the far ridge sits at a different height, adjust `horizon` and `mist` in `index.html`.
- **Sky colours.** Edit `KEYS` in `sky.js`: `[hour, zenith, horizon]`. Keep text contrast in mind, because the hero copy sits on the sky.
- **Add a chapter.**
  1. Copy the closest chapter file.
  2. Add an entry to `CHAPTERS` and `COVERS` in `site.js`.
  3. Add a cover image.
  4. Add a bento card on `index.html`.
  5. Add an OG image.
  6. In the public repo, add a row in `tools/seo-head.py` and re-run it.
- **Social cards.** Capture at 1200×630 with Puppeteer: chapters at `NN-….html?og&present&still&step=N`, the landing page at `index.html?og&still&h=6.67` (1600×840, device scale 0.75), into `assets/og/`. `tools/qa/snap.mjs` is a starting point.
- **Public flags.** `CONFIG` at the top of the public `site.js`. Flag-gated markup ships in `<template data-flag="present|exam">` and is stamped in only when the flag is on.

## Content changes (medical)

- The internal version's open clinical questions are listed in its `DEV_TODO.md`, under "Clinical sign-off". Many are already resolved in the public version's `CHANGES-MEDICAL.md`.
- The public version's medical edits were checked against published sources but **have not been signed off by a clinician**. Get that sign-off before promoting the public site, then add `reviewedBy` and `lastReviewed` to the JSON-LD (`tools/seo-head.py`).

## QA

`tools/qa/` is a Puppeteer click-through that drives a local Chrome (no browser download).

```bash
cd tools/qa && npm install
node qa.mjs                                  # desktop + phone; exits 1 if anything fails
CONFIGS=desktop,mobile,reduced,no-webgl node qa.mjs
node snap.mjs shot 1440 900 "03-measuring-cortisol.html|1" "index.html|-1"
```

On every page it checks:
- JS errors, console errors and warnings, failed requests and HTTP errors;
- duplicate IDs, broken images and sideways overflow;
- the landing page's WebGL sky (or its fallback), the nav state over the hero, and the 24-hour chart scrub.

On every chapter it checks:
- every step activates in order, with the counter, cover plate and diagram reveal correct at each one;
- glossary popovers;
- the contents list and stage arrows, with no flicker through intermediate steps;
- the chapter menu;
- Present mode end to end, and chaining into the next chapter;
- `?step=` deep links.

It also checks the 404 page under its GitHub Pages base path. Set `BASE` to point at another server, and `CHROME` to use another Chrome binary.

**Known flakiness:** in very long headless sessions, Chrome sometimes stops delivering IntersectionObserver callbacks for a page. Every check on that page then fails at once. The script opens a fresh browser per page to avoid this. If a whole page fails, re-run before you trust it.

The results from the handoff run are in each repo's `DEV_TODO.md`.
