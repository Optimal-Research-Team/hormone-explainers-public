# DEV_TODO: public version

Open items at the October 4, 2026 handoff. Read `ENGINEERING_HANDOFF.md` first. The internal version's list is in `hormone-explainers/DEV_TODO.md`.

## State at handoff

- Live at https://optimal-research-team.github.io/hormone-explainers-public/. Pages is enabled (source: GitHub Actions). The last deploy, `1714053` on September 29, succeeded.
- **Review findings** (`work/explainers-review-issues.json`, 38 items from a medical review and a QA review): each one was re-checked against the code at handoff. **35 are fixed, 2 are partly fixed, and 1 is a record of passed checks.** The open parts are items 2 and 3 below.
- **Medical content** was checked against published sources (`CHANGES-MEDICAL.md`) but **has not been signed off by a clinician.**
- The work notes in `work/` (`CLOUD-HANDOFF.md` and the two JSON files) are historical; this file supersedes them.
- Handoff QA (`tools/qa`, desktop + phone): see "QA at handoff" below.

## Open items

Ordered by priority.

1. **Clinician sign-off (owner: Peter).** Get a clinician to review `CHANGES-MEDICAL.md` and the chapters before the site is promoted. Then add `reviewedBy` and `lastReviewed` to the JSON-LD in `tools/seo-head.py` and re-run it.
2. **Recapture `assets/og/home.jpg`** (review finding 34). It still shows the old top bar with the Protocol, Chapters and Book buttons. Capture `index.html?og&still&h=6.67` at 1600×840 with a device scale of 0.75 (see "Social cards" in the handoff doc). The rest of finding 34 (title lengths, OG alt text, `datePublished`) is done.
3. **`preserveDrawingBuffer`** (review finding 33). `sky.js` still creates the WebGL context with it always on; only social-card capture needs it. Use `preserveDrawingBuffer: document.documentElement.classList.contains('og')`. The `treeline.webp` half of the finding is done. `assets/img/treeline.png` is now unused and can be removed.
4. **Mobile pass at small sizes.** About 80% of Optimal's visitors are on phones. One mobile commit landed (`1714053`, raising the landing diagram labels), and the handoff QA covers 390 px. A full pass at 375, 360 and 320 px with touch at DPR 3 hasn't been recorded. Check the scroll stories, the WebGL hero, the chapter menu, glossary popovers, the top bar and the footer. Known leftover from finding 32: on chapter 07 at 320×640, step 3's text starts near the bottom of the screen.
5. **Custom domain.** On a GitHub Pages *project* site, crawlers only read `robots.txt` at the domain root, so this repo's `robots.txt` is ignored. Move to a subdomain such as `learn.beoptimal.ca`, or submit `sitemap.xml` in Google Search Console. A domain move means updating `BASE` in `tools/seo-head.py` (then re-run it), `SITE_URL` in `site.js`, and the `<base href>` in `404.html`.
6. **Consolidate the two code bases.** This repo's `site.js` is the superset (`CONFIG.presentMode` and `CONFIG.examRoom`), so it's the natural single code base for both sites. See item 2 in the internal `DEV_TODO.md`. Until then, port engine fixes (`site.js`, `site.css`, `sky.js`) to both repos.
7. **Optional, from the review:**
   - UTM parameters on `CONFIG.bookUrl` to attribute bookings (finding 30).
   - A Google site-verification meta slot (34).
   - The chapter 06 ring still draws one-way arrowheads; a caveat in the text covers it (12).
   - The CBD chip could mention liver-enzyme and drug-interaction risk; this is a medical call (11).
8. **Clean up assets.** `assets/img/canopy-*` are unused except `canopy-wide` as a CSS fallback in `.next-card::before`.
9. **Self-host the fonts** and **run `tools/qa` in CI**, as in the internal list. Optional.

## QA at handoff

October 4, 2026: `node qa.mjs` (desktop 1440×900 and phone 390×844) against a local server, on the commit that added this file. **All checks passed** (174 s). The Present-mode checks are skipped automatically because `CONFIG.presentMode` is off.

Not run at handoff: the `reduced` and `no-webgl` configs, and a run against the live site (`BASE=https://optimal-research-team.github.io/hormone-explainers-public/`).
