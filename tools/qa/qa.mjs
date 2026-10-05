// Headless click-through QA for the Hormone Explainers.
// Serve the repo root first (python3 -m http.server 3041), then: node qa.mjs
// Env: BASE (default http://localhost:3061/), CHROME (Chrome binary), CONFIGS (default "desktop,mobile";
//      also "reduced" and "no-webgl"). Exits 1 if any check fails. See README.md.
import puppeteer from 'puppeteer-core';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BASE = (process.env.BASE || 'http://localhost:3061/').replace(/\/?$/, '/');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CONFIGS = (process.env.CONFIGS || 'desktop,mobile').split(',').map(s => s.trim()).filter(Boolean);
const CHAPTERS = readdirSync(ROOT).filter(f => /^\d\d-.*\.html$/.test(f)).sort();
const BASE_HREF = (readFileSync(join(ROOT, '404.html'), 'utf8').match(/<base href="([^"]+)"/) || [])[1];

const OPTS = {
  desktop: {},
  mobile: { mobile: true },
  reduced: { reduced: true },
  'no-webgl': { noWebgl: true },
};
const issues = [];
const note = (where, msg) => { issues.push(`[${where}] ${msg}`); console.log(`  ✗ [${where}] ${msg}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function session(label, o, fn) {
  const args = ['--hide-scrollbars'];
  if (o.webgl) args.push('--use-angle=swiftshader', '--enable-unsafe-swiftshader');
  if (o.noWebgl) args.push('--disable-webgl', '--disable-3d-apis');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { window.__act = () => [...document.querySelectorAll('.step')].findIndex(s => s.classList.contains('is-active')); });
  await page.setViewport(o.mobile ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: 1440, height: 900 });
  if (o.reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const ctx = { where: '' };
  page.on('pageerror', e => note(`${label} ${ctx.where}`, 'page error: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') note(`${label} ${ctx.where}`, `console.${m.type()}: ${m.text()}`); });
  page.on('requestfailed', r => { if (!/fonts\.g/.test(r.url())) note(`${label} ${ctx.where}`, 'request failed: ' + r.url()); });
  page.on('response', r => { if (r.status() >= 400) note(`${label} ${ctx.where}`, `HTTP ${r.status()} ${r.url()}`); });
  const load = async (path) => {
    ctx.where = path;
    await page.goto(BASE + path, { waitUntil: 'networkidle0' });
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
    await page.evaluate(() => document.fonts.ready);
    await sleep(300);
  };
  try { await fn(page, load, ctx); } catch (e) { note(`${label} ${ctx.where}`, 'script aborted: ' + e.message.split('\n')[0]); }
  await browser.close();
}

async function common(page, where) {
  const r = await page.evaluate(() => {
    const seen = {}, dup = [];
    document.querySelectorAll('[id]').forEach(e => { if (seen[e.id]) dup.push(e.id); seen[e.id] = 1; });
    return {
      dup,
      over: document.documentElement.scrollWidth - window.innerWidth,
      broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.src).map(i => i.src),
    };
  });
  if (r.dup.length) note(where, 'duplicate ids: ' + r.dup.join(', '));
  if (r.over > 0) note(where, `horizontal overflow ${r.over}px`);
  if (r.broken.length) note(where, 'broken images: ' + r.broken.join(', '));
}

async function landing(label, o) {
  await session(label, { ...o, webgl: !o.noWebgl }, async (page, load) => {
    await load('index.html');
    await common(page, `${label} index`);
    const h = await page.evaluate(() => ({
      gl: document.getElementById('dh').classList.contains('gl'),
      darkSection: !!document.querySelector('[data-nav-dark]'),
      dark: document.getElementById('nav').classList.contains('on-dark'),
    }));
    if (!o.noWebgl && !h.gl) note(`${label} index`, 'hero WebGL sky did not start');
    if (o.noWebgl && h.gl) note(`${label} index`, 'expected the CSS fallback without WebGL');
    if (h.darkSection && !h.dark) note(`${label} index`, 'nav is not light-on-dark over the hero');
    if (!o.mobile) {
      const b = await page.$eval('#dhChart', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
      await page.mouse.move(b.x + b.w * 0.5, b.y + b.h * 0.5); await sleep(200);
      const t = await page.$eval('#rTime', e => e.textContent);
      if (t !== '18:00') note(`${label} index`, `scrubbing to the chart's middle shows ${t}, expected 18:00`);
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await sleep(1200);
    if (h.darkSection && await page.evaluate(() => document.getElementById('nav').classList.contains('on-dark'))) note(`${label} index`, 'nav still light-on-dark after scrolling past the hero');
    await common(page, `${label} index (scrolled)`);
  });
}

async function chapter(label, o, file) {
  await session(label, o, async (page, load) => {
    const where = `${label} ${file}`;
    await load(file);
    await common(page, where);
    const s0 = await page.evaluate(() => ({
      n: document.querySelectorAll('.step').length,
      head: document.querySelector('.story').classList.contains('at-head'),
      toc: document.querySelectorAll('.toc a').length,
      act: __act(),
    }));
    if (!s0.head) note(where, 'story is not in its at-head state on load');
    if (s0.toc && s0.toc !== s0.n) note(where, `contents list has ${s0.toc} items for ${s0.n} steps`);
    if (s0.act !== 0) note(where, 'step 1 is not active on load');

    // scroll through every step; the reading line is mid-screen on desktop, just under the pinned stage on phones
    for (let i = 0; i < s0.n; i++) {
      await page.evaluate((i) => {
        const s = document.querySelectorAll('.step')[i], r = s.getBoundingClientRect();
        const mob = window.matchMedia('(max-width: 1000px)').matches;
        let line = innerHeight / 2, off = r.height / 2;
        if (mob) { const c = document.querySelector('.stage-col'); line = parseFloat(getComputedStyle(c).top) + c.offsetHeight + 60; off = 60; }
        window.scrollTo({ top: scrollY + r.top - line + off, behavior: 'instant' });
      }, i);
      await page.waitForFunction((i) => __act() === i, { timeout: 3000, polling: 100 }, i).catch(() => {});
      await sleep(150);
      const st = await page.evaluate(() => ({
        act: __act(),
        head: document.querySelector('.story').classList.contains('at-head'),
        cnt: (document.querySelector('.scount b') || {}).textContent,
        stageIn: document.querySelector('.stage').classList.contains('in'),
        coverShown: (() => { const c = document.querySelector('.panel-cover'); return !!c && getComputedStyle(c).display !== 'none' && document.querySelector('.story').classList.contains('at-head'); })(),
      }));
      const n2 = String(i + 1).padStart(2, '0');
      if (st.act !== i) note(where, `reading step ${i + 1}, but step ${st.act + 1} is active`);
      if (st.cnt !== n2) note(where, `counter shows ${st.cnt} at step ${i + 1}`);
      if (st.coverShown) note(where, `cover plate still covers the diagram at step ${i + 1}`);
      if (!st.stageIn) note(where, `diagram never revealed (step ${i + 1})`);
    }

    // glossary: open the first term, kept clear of the pinned stage
    if (await page.$('.term')) {
      await page.evaluate(() => { const t = document.querySelector('.term'), r = t.getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top - innerHeight * 0.82, behavior: 'instant' }); });
      await sleep(500);
      await page.click('.term'); await sleep(300);
      if (!await page.evaluate(() => document.querySelector('.gtip') && document.querySelector('.gtip').classList.contains('on'))) note(where, 'glossary definition did not open on click');
      await page.keyboard.press('Escape'); await sleep(200);
    }

    // contents jump and stage arrows (desktop): no intermediate step may take over during the scroll
    if (!o.mobile && s0.toc) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await sleep(500);
      const from = await page.evaluate(() => __act());
      const target = (from + 2) % s0.n;
      await page.evaluate(() => {
        window.__seq = [];
        new MutationObserver(() => { const a = __act(); if (window.__seq[window.__seq.length - 1] !== a) window.__seq.push(a); })
          .observe(document.querySelector('.steps'), { attributes: true, subtree: true, attributeFilter: ['class'] });
      });
      await page.click(`.toc a[data-go="${target}"]`); await sleep(2200);
      const seq = await page.evaluate(() => window.__seq);
      if (seq.join() !== String(target)) note(where, `contents link to step ${target + 1} passed through steps ${seq.map(x => x + 1).join(' → ') || '(none)'}`);
      if (target + 2 < s0.n) {
        await page.click('[data-step-next]'); await sleep(250); await page.click('[data-step-next]'); await sleep(2200);
        const b = await page.evaluate(() => __act());
        if (b !== target + 2) note(where, `two quick "next" clicks from step ${target + 1} landed on step ${b + 1}`);
      }
    }

    // chapter menu
    await page.click('[data-menu]'); await sleep(350);
    if (await page.evaluate(() => document.getElementById('cmenu').hidden)) note(where, 'chapter menu did not open');
    await page.keyboard.press('Escape'); await sleep(300);
    if (!await page.evaluate(() => document.getElementById('cmenu').hidden)) note(where, 'chapter menu did not close on Escape');

    // Present mode, when this build has it (the public build switches it off with CONFIG.presentMode)
    const canPresent = await page.evaluate(() => [...document.querySelectorAll('[data-present]')].some(b => b.offsetParent !== null));
    if (canPresent) {
      await page.evaluate(() => [...document.querySelectorAll('[data-present]')].find(b => b.offsetParent !== null).click()); await sleep(450);
      if (!await page.evaluate(() => document.body.classList.contains('present'))) note(where, 'Present mode did not start');
      await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
      await page.keyboard.press('Home'); await sleep(150);
      for (let k = 0; k < s0.n - 1; k++) { await page.keyboard.press('ArrowRight'); await sleep(130); }
      const p = await page.evaluate(() => ({
        act: __act(),
        vis: [...document.querySelectorAll('.step')].filter(s => getComputedStyle(s).display !== 'none').length,
      }));
      if (p.act !== s0.n - 1) note(where, `Present: after ${s0.n - 1} × → the active step is ${p.act + 1}`);
      if (p.vis !== 1) note(where, `Present: ${p.vis} steps visible at once`);
      await page.keyboard.press('Escape'); await sleep(500);
      if (await page.evaluate(() => document.body.classList.contains('present'))) note(where, 'Escape did not leave Present mode');
    }
  });
}

async function deepLinks(label, o) {
  const [c4, c5, c1] = [CHAPTERS[3], CHAPTERS[4], CHAPTERS[0]];
  await session(label, o, async (page, load) => {
    await load(`${c4}?step=6`); await sleep(1000);
    const d = await page.evaluate(() => ({ act: __act(), head: document.querySelector('.story').classList.contains('at-head') }));
    if (d.act !== 5 || d.head) note(`${label} ${c4}?step=6`, `active step ${d.act + 1}, at-head ${d.head}`);
    const presentOn = await page.evaluate(() => [...document.querySelectorAll('[data-present]')].some(b => b.offsetParent !== null));
    if (!presentOn) return;
    await load(`${c5}?present=last`); await sleep(500);
    const p = await page.evaluate(() => ({ on: document.body.classList.contains('present'), act: __act(), n: document.querySelectorAll('.step').length }));
    if (!p.on || p.act !== p.n - 1) note(`${label} ${c5}?present=last`, JSON.stringify(p));
    await load(`${c1}?present`); await sleep(300);
    const n = await page.evaluate(() => document.querySelectorAll('.step').length);
    for (let k = 0; k < n; k++) { await page.keyboard.press('ArrowRight'); await sleep(160); }
    await sleep(1500);
    if (!page.url().includes(CHAPTERS[1] + '?present')) note(`${label} present chaining`, `after the last step of ${c1} the URL is ${page.url()}`);
  });
}

async function notFound() {
  if (!BASE_HREF) return;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  // 404.html sets <base href="/repo-name/"> for GitHub Pages; map that prefix back onto the local server
  page.on('request', r => { const u = r.url(); if (u.includes(BASE_HREF)) r.continue({ url: u.replace(BASE_HREF, '/') }); else r.continue(); });
  page.on('pageerror', e => note('404', 'page error: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) note('404', `HTTP ${r.status()} ${r.url()}`); });
  await page.goto(new URL(BASE_HREF + '404.html', BASE).href, { waitUntil: 'networkidle0' });
  const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  if (!/Public Sans/.test(font)) note('404', 'styles did not load: ' + font);
  await browser.close();
}

const t0 = Date.now();
for (const label of CONFIGS) {
  const o = OPTS[label];
  if (!o) { console.log(`unknown config ${label}`); continue; }
  console.log(`\n${label}`);
  await landing(label, o);
  for (const f of CHAPTERS) { console.log(`  ${f}`); await chapter(label, o, f); }
  await deepLinks(label, o);
}
await notFound();
console.log(`\n${issues.length ? issues.length + ' issue(s)' : 'All checks passed'} in ${Math.round((Date.now() - t0) / 1000)}s (${CONFIGS.join(', ')})`);
process.exit(issues.length ? 1 : 0);
