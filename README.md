# Hormone Explainers: public version

Free, interactive education from **Optimal Health Clinic**: eight short scroll-story chapters on cortisol, stress, sleep and the hormone web, adapted from the notes our clinicians teach from and checked against published evidence.

**This is the public version.** The internal patient version, used with patients in clinic, lives in the sibling folder `../hormone-explainers` (live at https://optimal-research-team.github.io/hormone-explainers/). Keep the two in step deliberately: medical edits made here should be considered for the internal version, and vice versa.

**Live:** https://optimal-research-team.github.io/hormone-explainers-public/

## What's different from the internal version

1. **Medical accuracy.** Every claim, list and glossary definition was checked. The main changes are below; [CHANGES-MEDICAL.md](CHANGES-MEDICAL.md) lists every edit with its reason and source.
2. **Public framing.** Present mode and the landing page's "For the exam room" section are switched off with config flags (the code is kept). Wording aimed at patients in the room ("the order we usually walk through them with you") is now general.
3. **Clinic chrome.** A slim top bar carries the Optimal wordmark, a link to **The Optimal Menopause Protocol** (https://www.beoptimal.ca/menopause) and a **Book an intro** pill (https://book.beoptimal.ca/?service=hormone, new tab). The landing page and every chapter footer carry "This is general education, not medical advice", followed by the clinic's address, phone and email, plus 911 and the 9-8-8 crisis line.
4. **SEO.** A unique title and meta description on every page, plus Open Graph and Twitter cards, canonical URLs, JSON-LD (`MedicalWebPage`, audience: Patient, published by the `MedicalClinic`), `sitemap.xml` and `robots.txt`.
5. **Regenerated social cards.** The `assets/og/*.jpg` images are rebuilt from the updated pages, so they no longer show the old chapter-02 staging or labels.

### Medical changes at a glance

- **Ch 02** reframed from "How HPA dysfunction evolves" (Normal → Acute → Chronic → Exhaustion) to **"How chronic stress can change the cortisol curve"**: four *patterns seen in research* (Typical, Short-term, Longer-term, Flattened), grounded in the Adam et al. 2017 meta-analysis on flatter diurnal slopes. "Exhaustion" is removed as a clinical stage. Added: "Adrenal fatigue isn't a recognized medical diagnosis (Endocrine Society)." The AVP claim is softened to what animal research supports.
- **Ch 03**: the awakening response, slope and AUC are labelled as research measures. A new step explains that salivary curves vary with sleep, timing and collection, aren't validated to diagnose stress-related conditions, and are used by a clinician (if at all) alongside history and other tests. "Concerning" verdicts become neutral descriptions ("blunted", "flatter", "higher or lower").
- **Ch 06**: alprazolam and benzodiazepines are removed, DHEA is removed as a cortisol tool, and brand names are removed. Options are grouped as Foundations, *Prescription: discuss with a clinician* and *Limited evidence*. Ashwagandha, rhodiola, glycine and tryptophan are marked limited evidence, with the liver-injury warning signs and cautions for ashwagandha, and tryptophan and progesterone for sleep are marked prescription. Metformin and GLP-1 medicines are named with their approved uses. CBT-I and talk therapy are added as first-line. The estrogen stop now names menopausal hormone therapy, with lining protection (usually a progestogen) for systemic estrogen if you have a uterus, and the 9-8-8 crisis line is added at the mood stop.
- **Ch 08**: "oxytocin repairs the HPA axis" becomes "mindfulness and social connection can reduce perceived stress and support better sleep". The pyramid is presented as a framework, not a ranking of impact. The bedroom advice drops the 16–19 °C target for "comfortably cool" (about 18–20 °C for many people) and the WHO noise guideline of about 30 dB. Layer 2 adds the Canadian activity target and Health Canada's vitamin D (over 50) and folic acid advice; layer 3 adds who shouldn't fast.
- **Ch 05** is framed explicitly as a metaphor. Thyroid care is referred to a clinician (TSH test), and the chapter no longer implies that menopause symptoms must wait for "the roots".
- **Ch 02 and 03**: longer-term stress is drawn as a lower morning and higher evening curve with a higher total (Miller 2007), and the flatter curve's total is described as higher or lower.
- **Ch 01, 04, 07 and the glossary**: the adrenal insufficiency and Cushing's syndrome extremes are named (with a warning never to stop steroid medicines suddenly), hyperkalemia is tied to aldosterone deficiency, and oxytocin, the see-saw, the "potentially therapeutic" list and the twelve web connections are hedged to the evidence. GLP-1 and metformin definitions are corrected, and new terms are added.

## The chapters

| # | Chapter | Story |
|---|---------|-------|
| 01 | Cortisol has a dose-dependent effect | A draggable marker on a luminous dose–response curve visits too little (adrenal insufficiency), just right and too much (Cushing's syndrome). |
| 02 | How chronic stress can change the cortisol curve | Introduces the two stress systems (SNS and HPA). The daily curve then morphs through four patterns seen in research, which end overlaid, with sources. |
| 03 | Three ways to measure cortisol | The awakening response, diurnal slope and area under the curve light up in turn. The curve then flattens, and a final step explains why these are research measures, not a diagnosis. |
| 04 | Cortisol's partners | A stress-axis diagram marks where each group of partners acts. A second scene shows the melatonin–cortisol see-saw. |
| 05 | Foundational vs. top-line hormones | A metaphor: canopy, trunk and roots in turn. The roots are stressed and the canopy wilts, then the story returns to looking after the roots alongside other care. |
| 06 | The hormone cycle and its stop points | A particle circulates the loop. Each step halts it at one stop and shows the options there, grouped by strength of evidence. |
| 07 | Sleep, cortisol and the hormone web | Twelve connections grouped into five steps, ending on sleep's reach. |
| 08 | The pyramid of interventions | The pyramid builds one layer per step, from sleep at the base to supplements at the top. |

The **landing page** opens on a scrubbable, illustrative 24-hour rhythm set in a real-time WebGL sky over a boreal treeline. Below the hero are a bento grid of chapter previews, an "About this series" section (education, not advice; evidence labelled; menopause care) and a closing call to action.

## Reader aids

- **Glossary.** The first use of each medical term in a step is underlined. Hover over it, tap it or focus it to see a plain-language definition. All definitions live in `assets/js/glossary.js`.
- **Chapter menu.** "Chapters" lists every chapter with viewed and completed state, plus links to The Optimal Menopause Protocol and Book an intro. On phones, those links live in this menu.
- **Continue where you left off.** Progress is kept in `localStorage` on this device only, with no personal data.
- **Share.** "Share this chapter" opens the share sheet on phones and copies the link on desktop.

## Architecture

Static HTML, CSS and JS, with no framework and no build step. It deploys to GitHub Pages.

```
index.html                    Landing: day hero, series bento, About (public notice), closing band; exam-room section kept behind a flag
404.html                      Branded not-found page (base href /hormone-explainers-public/)
01-…html … 08-…html           One chapter each: hero + .story (sticky .stage + .steps) + page script
assets/css/site.css           Design system: tokens, top bar, story/stage layout, evidence groups, footer, Present mode
assets/js/site.js             Shared engine: CONFIG flags, top bar, chapter menu, footer, story engine, glossary, helpers
assets/js/glossary.js         Plain-language definitions
assets/js/sky.js              Landing hero sky (WebGL)
assets/og/                    1200×630 social cards (regenerated for the public copy)
assets/img/                   Optimal wordmarks, symbol, chapter covers, treeline texture, canopy photography
tools/seo-head.py             Writes each page's SEO block, sitemap.xml and robots.txt
tools/treeline-from-image.py  Rebuilds assets/img/treeline.png from a three-tone silhouette
sitemap.xml, robots.txt       Generated by tools/seo-head.py
CHANGES-MEDICAL.md            Every medical edit, with its reason and source
.github/workflows/deploy.yml  GitHub Pages deployment
```

### Config flags (`assets/js/site.js`)

```js
var CONFIG = {
  presentMode: false,  // clinician Present mode (buttons, ?present links, keyboard/clicker)
  examRoom: false,     // the landing page's "For the exam room" section ([data-exam-room])
  bookUrl: 'https://book.beoptimal.ca/?service=hormone',
  protocolUrl: 'https://www.beoptimal.ca/menopause',
  ...
};
```

Flag-gated markup ships inside `<template data-flag="present">` (the chapter heads' "Present in the exam room" button) and `<template data-flag="exam">` (the landing page's exam-room section), so on the public site it never renders or gets indexed; turning a flag on makes `site.js` stamp it back into the page. CSS also hides any remaining controls (`html:not(.hx-present) [data-present]`, `html:not(.hx-exam) [data-exam-room]`). With `presentMode` off, `site.js` ignores `?present` and the arrow-key chapter shortcuts. Social-card capture (`?og`) still renders through Present mode.

### SEO

`python3 tools/seo-head.py` rewrites the block between `<!-- seo:start -->` and `<!-- seo:end -->` in every page from the `PAGES` table: title, description, canonical, Open Graph, Twitter and JSON-LD. It also writes `sitemap.xml` and `robots.txt` (allow all). Edit the table, then re-run it.

On a GitHub Pages *project* site, crawlers read `robots.txt` only at the domain root, so the file here won't be read until the site moves to its own domain. Submit `sitemap.xml` in Search Console instead.

### Social cards

The cards were captured at 1200×630 with Puppeteer:

- Chapters: `NN-….html?og&present&still&step=N`, with N = 3, 6, 3, 3, 5, 4, 2, 7 for chapters 01–08
- Landing: `index.html?og&still&h=6.67`, captured at 1600×840 with a device scale of 0.75

## Development

```bash
python3 -m http.server 3061
```

Then open http://localhost:3061. Useful flags: `?step=N` opens a chapter at step N, `?still` turns off motion, and `?h=HH` pins the hero's hour.

## Deployment

Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml` (repo `Optimal-Research-Team/hormone-explainers-public`, Pages source: GitHub Actions). The workflow stages only the site (`*.html`, `robots.txt`, `sitemap.xml`, `.nojekyll`, `assets/`) into `_site`, so this README, `CHANGES-MEDICAL.md`, `IMAGE_PROMPTS.md` and `tools/` stay in the repo and are not served.

## Disclaimer

General education, not medical advice. Medication names are for discussion with a provider, not recommendations. The landing-page rhythm is illustrative, not patient data. Medical content was checked against published sources (see CHANGES-MEDICAL.md). Get a clinician sign-off before promoting the site.
