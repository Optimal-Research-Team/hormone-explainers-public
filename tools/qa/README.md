# tools/qa

Headless checks and screenshots for the Hormone Explainers. They drive your local Chrome through `puppeteer-core`, so there's no browser download.

## Setup

```bash
cd tools/qa
npm install
```

Node 18 or newer. Serve the repo root in another terminal: `python3 -m http.server 3061` (the internal repo uses 3041; each copy of these scripts defaults to its own repo's port).

## `qa.mjs`: click-through

```bash
node qa.mjs                                        # desktop (1440×900) + phone (390×844, DPR 2, touch)
CONFIGS=desktop,mobile,reduced,no-webgl node qa.mjs
BASE=https://optimal-research-team.github.io/hormone-explainers-public/ node qa.mjs   # against the live site
```

It prints each failure as it happens, then a summary, and exits with code 1 if anything failed.

On every page it checks:
- JS errors, console errors and warnings, failed requests and HTTP 4xx/5xx;
- duplicate IDs, broken images and sideways overflow.

On the landing page:
- the WebGL sky starts (or the CSS fallback, under `no-webgl`);
- the nav is light-on-dark over the hero and back to normal below it;
- scrubbing the chart's midpoint reads 18:00.

On each chapter:
- every step activates in order as you scroll, with the right stage counter, the cover plate gone and the diagram revealed;
- a glossary popover opens;
- a contents-list jump and two quick stage-arrow clicks land on the right step, with no flicker through steps in between;
- the chapter menu opens and closes on Esc;
- Present mode runs end to end and exits on Esc, and chains into the next chapter. This is skipped when the build has Present mode switched off.

It also checks:
- `?step=6` and `?present=last` deep links;
- `404.html` under its GitHub Pages base path, mapped onto the local server.

| Env | Default | |
|---|---|---|
| `BASE` | `http://localhost:3061/` (internal: 3041) | Site to test |
| `CHROME` | macOS Chrome path | Chrome binary |
| `CONFIGS` | `desktop,mobile` | Any of `desktop`, `mobile`, `reduced` (prefers-reduced-motion), `no-webgl` |

**Known flakiness:** headless Chrome can deliver IntersectionObserver callbacks late, and under software GL very late. The script runs chapters without software GL, uses a fresh browser per page, and polls for each step instead of sleeping. If one page fails every step check at once, re-run before trusting it.

## `snap.mjs`: screenshots

```bash
node snap.mjs v4 1440 900 "01-dose-response.html|-1" "01-dose-response.html|1" "index.html|-1"
node snap.mjs phone 390 844 "07-sleep-hormone-web.html|3"
```

Each spec is `page.html|N` (step index from 0; `-1` is the top of the page), `page.html|end` (the up-next card), `page.html|menu` (chapter menu open) or `page.html|y1200` (scroll position). A width under 700 is treated as a phone. Screenshots go to `tools/qa/shots/`, which git ignores. Set `WAIT` (ms, default 1600) for slower animations.
