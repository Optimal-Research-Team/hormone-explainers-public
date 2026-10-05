// Viewport screenshots of pages at given steps.
// usage: node snap.mjs <out-prefix> <width> <height> <spec> [<spec> ...]
// spec: "page.html|N" (N = step index from 0; -1 = top of page), "page.html|end" (end card),
//       "page.html|menu" (chapter menu open) or "page.html|y1200" (scroll to y). Width < 700 = phone (DPR 2, touch).
// Env: BASE (default http://localhost:3061/), CHROME, WAIT (ms after scrolling, default 1600). Output: ./shots/
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const [,, prefix, W, H, ...specs] = process.argv;
if (!prefix || !specs.length) { console.log('usage: node snap.mjs <out-prefix> <width> <height> "page.html|N" ...'); process.exit(1); }
const BASE = (process.env.BASE || 'http://localhost:3061/').replace(/\/?$/, '/');
const OUT = new URL('./shots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
});
const page = await browser.newPage();
const mobile = +W < 700;
await page.setViewport({ width: +W, height: +H, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
page.on('pageerror', e => console.log('PAGE ERROR', e.message));

let i = 0;
for (const spec of specs) {
  const [file, step] = spec.split('|');
  await page.goto(BASE + file, { waitUntil: 'networkidle0' });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.evaluate(() => document.fonts.ready);
  if (step === 'end') {
    await page.evaluate(() => { const e = document.getElementById('end'); e && e.scrollIntoView({ block: 'center', behavior: 'instant' }); });
  } else if (step === 'menu') {
    await page.evaluate(() => { window.scrollTo({ top: 300, behavior: 'instant' }); document.querySelector('[data-menu]').click(); });
  } else if (step && step.startsWith('y')) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), +step.slice(1));
  } else if (step !== undefined && +step >= 0) {
    await page.evaluate((n) => {
      const s = document.querySelectorAll('.step')[n];
      if (s) { const r = s.getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top - innerHeight / 2 + r.height / 2, behavior: 'instant' }); }
    }, +step);
  }
  await new Promise(r => setTimeout(r, +(process.env.WAIT || 1600)));
  const name = `${prefix}-${String(i++).padStart(2, '0')}.png`;
  await page.screenshot({ path: OUT + name });
  console.log(OUT + name);
}
await browser.close();
