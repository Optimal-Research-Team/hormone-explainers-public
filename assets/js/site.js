/* Hormone Explainers — shared chrome, story engine and interaction helpers.
   Pages set <body data-chapter="N"> (0 = landing) and provide #nav, #end, #foot mounts.
   Chapter pages call HX.story({ onStep }) to wire their .story section. */
(function () {
  'use strict';

  var SITE_URL = 'https://optimal-research-team.github.io/hormone-explainers-public/';

  /* Public-site switches. The internal patient version runs with presentMode and examRoom on;
     the code for both stays here, and flipping a flag brings it back. */
  var CONFIG = {
    presentMode: false,   /* clinician Present mode: nav button, chapter-head button, ?present links, keys */
    examRoom: false,      /* the landing page's "For the exam room" section ([data-exam-room]) */
    bookUrl: 'https://book.beoptimal.ca/?service=hormone',
    protocolUrl: 'https://www.beoptimal.ca/menopause',
    protocolLabel: 'The Optimal Menopause Protocol',
    clinic: {
      name: 'Optimal Health Clinic',
      street: '630 Huronia Road, Unit 5', city: 'Barrie, ON L4N 0W5',
      phone: '(437) 370-0291', tel: '+14373700291', email: 'care@beoptimal.ca', site: 'https://www.beoptimal.ca'
    }
  };
  var root = document.documentElement;
  /* ?og (social-card capture) renders through Present mode, so it keeps working with the flag off */
  var PRESENT = CONFIG.presentMode || root.classList.contains('og');
  if (PRESENT) root.classList.add('hx-present');
  if (CONFIG.examRoom) root.classList.add('hx-exam');
  /* Flag-gated markup ships inside <template data-flag="present|exam">, so on the public site it
     never renders or gets indexed. Turning a flag on stamps it back into the page. */
  [].forEach.call(document.querySelectorAll('template[data-flag]'), function (t) {
    var f = t.getAttribute('data-flag');
    if ((f === 'present' && PRESENT) || (f === 'exam' && CONFIG.examRoom)) t.parentNode.replaceChild(t.content.cloneNode(true), t);
  });

  var CHAPTERS = [
    { n: 1, file: '01-dose-response.html', title: 'Cortisol has a dose-dependent effect', tag: 'The basics',
      blurb: 'Too little and too much both cause harm. The body needs a middle band.' },
    { n: 2, file: '02-hpa-dysfunction.html', title: 'How chronic stress can change the cortisol curve', tag: 'Stress and rhythm',
      blurb: 'Research links long-term stress to flatter daily cortisol curves. Four patterns, side by side.' },
    { n: 3, file: '03-measuring-cortisol.html', title: 'Three ways to measure cortisol', tag: 'Measurement',
      blurb: 'Awakening response, diurnal slope and total output: research measures read from one daily curve.' },
    { n: 4, file: '04-cortisol-partners.html', title: "Cortisol's partners", tag: 'Regulation',
      blurb: 'What turns cortisol production down, what buffers its effects, and its see-saw with melatonin.' },
    { n: 5, file: '05-hormone-tree.html', title: 'Foundational vs. top-line hormones', tag: 'Priorities',
      blurb: 'A way to think about it: sex hormones as the canopy, cortisol and thyroid as the roots.' },
    { n: 6, file: '06-cycle-stop-points.html', title: 'The hormone cycle and its stop points', tag: 'Interventions',
      blurb: 'Hormones feed each other in a loop, with six places to interrupt it and the evidence for each option.' },
    { n: 7, file: '07-sleep-hormone-web.html', title: 'Sleep, cortisol and the hormone web', tag: 'Connections',
      blurb: 'Twelve links between sleep, melatonin, cortisol, insulin and the sex hormones.' },
    { n: 8, file: '08-pyramid-of-interventions.html', title: 'The pyramid of interventions', tag: 'Where to start',
      blurb: 'Build from the base: sleep and circadian rhythm come before supplements.' }
  ];

  /* Chapter cover photographs (see IMAGE_PROMPTS.md). Chapter pages carry theirs in markup
     (.panel-cover, .head-cover-m); this map feeds the "Up next" card that leads to each chapter. */
  var COVERS = {
    1: 'assets/img/chapters/01.jpg',
    2: 'assets/img/chapters/02.jpg',
    3: 'assets/img/chapters/03.jpg',
    4: 'assets/img/chapters/04.jpg',
    5: 'assets/img/chapters/05.jpg',
    6: 'assets/img/chapters/06.jpg',
    7: 'assets/img/chapters/07.jpg',
    8: 'assets/img/chapters/08.jpg'
  };
  var webp = function (src) { return src.replace(/\.jpe?g$/i, '.webp'); };

  var params = new URLSearchParams(window.location.search);
  var still = params.has('still');
  var reduce = still || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(hover: none)').matches;
  var body = document.body;
  var cur = parseInt(body.getAttribute('data-chapter') || '0', 10);
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var abs = function (p) { return new URL(p, window.location.href).href; };

  var I = {
    prev: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 5 8l5 5"/></svg>',
    next: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 3 5 5-5 5"/></svg>',
    arrow: '<svg class="go" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 8h11M9 3.5 13.5 8 9 12.5"/></svg>',
    back: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 8h-11M7 3.5 2.5 8 7 12.5"/></svg>',
    grid: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="5" height="5" rx="1.4"/><rect x="9" y="2" width="5" height="5" rx="1.4"/><rect x="2" y="9" width="5" height="5" rx="1.4"/><rect x="9" y="9" width="5" height="5" rx="1.4"/></svg>',
    present: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.8" y="2.5" width="12.4" height="8.5" rx="1.6"/><path d="M8 11v2.5M5.5 13.5h5"/><path d="M6.8 5.2v3.1L9.3 6.75z" fill="currentColor"/></svg>',
    close: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
    check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 8.5 3 3 6-7"/></svg>',
    share: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 10V2.5M5 5.5l3-3 3 3"/><path d="M3.5 8.5v4a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-4"/></svg>',
    ext: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 3.5h7v7M12.5 3.5 3.5 12.5"/></svg>',
    info: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="6.2"/><path d="M8 7.2v4M8 4.9v.1"/></svg>',
    resume: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8A5 5 0 1 1 8 3h2.5M9 1.5 10.5 3 9 4.5"/></svg>'
  };

  /* ---------- local progress (this device only; no personal data) ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('hx:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { if (still) return; try { localStorage.setItem('hx:' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var seen = store.get('seen', []), done = store.get('done', []);
  if (cur && seen.indexOf(cur) < 0) { seen.push(cur); store.set('seen', seen); }
  function status(n) { return done.indexOf(n) > -1 ? 'done' : seen.indexOf(n) > -1 ? 'seen' : ''; }

  /* ---------- skip link ---------- */
  if (document.querySelector('.story')) {
    var skip = document.createElement('a');
    skip.className = 'skip'; skip.href = '#story'; skip.textContent = 'Skip to the story';
    body.insertBefore(skip, body.firstChild);
  }

  /* ---------- nav ----------
     The public top bar: wordmark and series title (swapped for the current chapter once its header
     has scrolled away), The Optimal Menopause Protocol, Chapters, a "Book an intro" pill and a
     reading-progress hairline. Over [data-nav-dark] sections it turns light-on-dark. */
  var navMount = document.getElementById('nav');
  var hasStory = !!document.querySelector('.story');
  if (hasStory) body.classList.add('has-story');
  var blank = ' target="_blank" rel="noopener"';
  var newTab = '<span class="sr-only"> (opens in a new tab)</span>';
  if (navMount) {
    var here = cur ? CHAPTERS[cur - 1] : null;
    var menuBtn = '<button class="nav-btn nav-menu" type="button" data-menu aria-label="Chapters" aria-expanded="false" aria-controls="cmenu">' + I.grid + '<span>Chapters</span></button>';
    var actions =
      (cur && hasStory && PRESENT ? '<button class="nav-btn" type="button" data-present>' + I.present + '<span>Present</span></button>' : '') +
      '<a class="nav-btn nav-proto" href="' + CONFIG.protocolUrl + '">' + CONFIG.protocolLabel + '</a>' +
      menuBtn +
      '<a class="nav-book" href="' + CONFIG.bookUrl + '"' + blank + '><span>Book an intro</span>' + I.ext + newTab + '</a>';
    navMount.innerHTML =
      '<nav class="nav" aria-label="Hormone explainers">' +
        '<a class="nav-brand" href="index.html" aria-label="Optimal hormone explainers, home">' +
          '<img class="wm wm-dark" src="assets/img/optimal-wordmark-green.png" alt="Optimal" width="86" height="20">' +
          '<img class="wm wm-light" src="assets/img/optimal-wordmark-white.png" alt="" width="86" height="20">' +
        '</a>' +
        '<div class="nav-slot">' +
          '<a class="nav-title" href="index.html" tabindex="-1">Hormone explainers</a>' +
          (here ? '<div class="nav-here" aria-hidden="true"><span class="num">' + pad(cur) + '</span><span class="nh-t">' + here.title + '</span></div>' : '') +
        '</div>' +
        '<div class="nav-actions">' + actions + '</div>' +
        '<span class="nav-prog" aria-hidden="true"></span>' +
      '</nav>';
    var onScroll = function () { navMount.classList.toggle('scrolled', window.scrollY > 4); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    var darks = document.querySelectorAll('[data-nav-dark]');
    if (darks.length && 'IntersectionObserver' in window) {
      var hits = new Set();
      var dio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) hits.add(e.target); else hits.delete(e.target); });
        navMount.classList.toggle('on-dark', hits.size > 0);
      }, { rootMargin: '0px 0px -95% 0px' });
      darks.forEach(function (d) { dio.observe(d); });
      navMount.classList.add('on-dark');
    }
    var headEl = document.querySelector('.chapter-head');
    if (headEl && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { navMount.classList.toggle('show-here', !es[0].isIntersecting); }, { rootMargin: '-64px 0px 0px 0px' }).observe(headEl.querySelector('h1') || headEl);
    }
  }

  /* ---------- chapter menu ---------- */
  var menu = document.createElement('nav');
  menu.className = 'cmenu'; menu.id = 'cmenu'; menu.hidden = true;
  menu.setAttribute('aria-label', 'Chapters');
  var viewed = CHAPTERS.filter(function (c) { return status(c.n); }).length;
  menu.innerHTML =
    '<div class="cmenu-head"><span class="label">Hormone explainers · 8 chapters</span><a href="index.html">Overview</a></div>' +
    '<ol class="cmenu-list">' + CHAPTERS.map(function (c) {
      var st = c.n === cur ? 'current' : status(c.n);
      var badge = st === 'current' ? '<span class="cm-s now">Reading</span>'
        : st === 'done' ? '<span class="cm-s ok" title="Completed">' + I.check + '</span>'
        : st === 'seen' ? '<span class="cm-s seen" title="Viewed"></span>' : '';
      return '<li><a class="cm' + (c.n === cur ? ' is-current' : '') + '" href="' + c.file + '"' + (c.n === cur ? ' aria-current="page"' : '') + '>' +
        '<span class="cm-n">' + pad(c.n) + '</span><span class="cm-t"><b>' + c.title + '</b><small>' + c.tag + '</small></span>' + badge + '</a></li>';
    }).join('') + '</ol>' +
    '<div class="cmenu-foot"><span>' + (viewed ? viewed + ' of 8 viewed on this device' : 'Start with chapter 01') + '</span>' +
    (hasStory && PRESENT ? '<button type="button" class="cmenu-present" data-present>' + I.present + 'Present this chapter</button>' : '') + '</div>' +
    '<div class="cmenu-ext">' +
      '<a href="' + CONFIG.protocolUrl + '"><span><b>' + CONFIG.protocolLabel + '</b><small>Evidence-based menopause care at Optimal</small></span>' + I.arrow + '</a>' +
      '<a href="' + CONFIG.bookUrl + '"' + blank + '><span><b>Book an intro</b><small>Talk with our team about your hormones</small></span>' + I.ext + newTab + '</a>' +
    '</div>';
  /* in the DOM right after the top bar, so Tab order runs button → menu → page */
  if (navMount) navMount.insertAdjacentElement('afterend', menu); else body.appendChild(menu);
  var menuBtns = [].slice.call(document.querySelectorAll('[data-menu]'));
  function setMenu(open) {
    menu.hidden = !open;
    if (open) { void menu.offsetWidth; menu.classList.add('open'); } else menu.classList.remove('open');
    menuBtns.forEach(function (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    if (open) { var a = menu.querySelector('.is-current') || menu.querySelector('.cm'); if (a) a.focus({ preventScroll: true }); }
  }
  menuBtns.forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); setMenu(menu.hidden); }); });
  document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { e.preventDefault(); setMenu(false); if (menuBtns[0]) menuBtns[0].focus(); } });
  menu.querySelectorAll('[data-present]').forEach(function (b) { b.addEventListener('click', function () { setMenu(false); }); });
  /* tabbing out of the open menu closes it, so it never sits over the page with focus elsewhere */
  menu.addEventListener('focusout', function (e) {
    var to = e.relatedTarget;
    if (!menu.hidden && to && !menu.contains(to) && menuBtns.indexOf(to) < 0) setMenu(false);
  });

  /* ---------- chapter end + footer ---------- */
  var endMount = document.getElementById('end');
  if (endMount && cur) {
    var nx = CHAPTERS[cur], pv = CHAPTERS[cur - 2];
    var cover = nx && COVERS[nx.n] ? ' style="--cover:url(\'' + abs(webp(COVERS[nx.n])) + '\')"' : '';
    var card = nx
      ? '<a class="next-card" href="' + nx.file + '"' + cover + '>' +
          '<div class="next-copy"><span class="next-k"><span class="num">Up next · ' + pad(nx.n) + '</span>' + nx.tag + '</span>' +
          '<span class="next-title">' + nx.title + '</span><span class="next-blurb">' + nx.blurb + '</span></div>' +
          '<span class="next-go" aria-hidden="true">' + I.arrow + '</span></a>'
      : '<a class="next-card" href="index.html" style="--cover:url(\'' + abs(webp(COVERS[1])) + '\')">' +
          '<div class="next-copy"><span class="next-k"><span class="num">08 of 08</span>End of the series</span>' +
          '<span class="next-title">Back to all eight chapters</span><span class="next-blurb">Revisit any chapter, or start again from how cortisol works.</span></div>' +
          '<span class="next-go" aria-hidden="true">' + I.arrow + '</span></a>';
    endMount.innerHTML = '<section class="end">' + card +
      '<div class="end-row">' +
        (pv ? '<a class="end-link" href="' + pv.file + '">' + I.back + '<span><small>Previous</small>' + pv.title + '</span></a>'
            : '<a class="end-link" href="index.html">' + I.back + '<span><small>Overview</small>All chapters</span></a>') +
        '<button class="end-share" type="button" data-share>' + I.share + '<span>Share this chapter</span></button>' +
      '</div></section>';
  }
  var footMount = document.getElementById('foot');
  if (footMount) {
    var note = body.getAttribute('data-note') || 'Adapted from clinician teaching notes and checked against published evidence.';
    var C = CONFIG.clinic;
    footMount.innerHTML = '<footer class="foot"><div class="foot-inner">' +
      '<div class="foot-notice" role="note">' + I.info +
        '<p><b>This is general education, not medical advice.</b> It can’t account for your health history, medicines or test results. ' +
        'Talk with a qualified clinician before you start, stop or change any treatment. In an emergency, call 911. For a mental health crisis, call or text 9-8-8.</p></div>' +
      '<div class="foot-grid">' +
        '<div class="foot-brand"><img src="assets/img/optimal-wordmark-green.png" alt="Optimal" width="86" height="20"><span>' + C.name + '</span></div>' +
        '<address class="foot-col"><span class="label">Visit</span>' + C.street + '<br>' + C.city + '</address>' +
        '<div class="foot-col"><span class="label">Contact</span><a href="tel:' + C.tel + '">' + C.phone + '</a><a href="mailto:' + C.email + '">' + C.email + '</a></div>' +
        '<div class="foot-col"><span class="label">Explore</span><a href="' + CONFIG.protocolUrl + '">' + CONFIG.protocolLabel + '</a>' +
          '<a href="' + CONFIG.bookUrl + '"' + blank + '>Book an intro' + newTab + '</a><a href="' + C.site + '">beoptimal.ca</a></div>' +
      '</div>' +
      '<div class="foot-base"><span>' + note + '</span><span>© ' + new Date().getFullYear() + ' ' + C.name + '</span></div>' +
      '</div></footer>';
  }

  /* ---------- share ---------- */
  document.querySelectorAll('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      var file = cur ? CHAPTERS[cur - 1].file : '';
      var url = SITE_URL + file, label = b.querySelector('span');
      if (navigator.share && touch) { navigator.share({ title: document.title, url: url }).catch(function () {}); return; }
      var done = function () { label.textContent = 'Link copied'; b.classList.add('copied'); setTimeout(function () { label.textContent = 'Share this chapter'; b.classList.remove('copied'); }, 2200); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copy this link', url); });
      else window.prompt('Copy this link', url);
    });
  });

  /* ---------- landing: resume + progress badges ---------- */
  if (!cur) {
    var last = store.get('last', null), resumeMount = document.getElementById('resume');
    if (resumeMount && last && last.n && !(last.n === 1 && last.step === 0)) {
      var lc = CHAPTERS[last.n - 1];
      resumeMount.innerHTML = '<a class="resume" href="' + lc.file + '?step=' + (last.step + 1) + '">' + I.resume +
        '<span>Continue where you left off <b>Chapter ' + pad(lc.n) + ' · step ' + (last.step + 1) + ' of ' + last.total + '</b></span></a>';
      resumeMount.hidden = false;
    }
    document.querySelectorAll('.bcard').forEach(function (card) {
      var c = CHAPTERS.filter(function (x) { return card.getAttribute('href') === x.file; })[0];
      var st = c && status(c.n);
      if (!st) return;
      var chip = document.createElement('span');
      chip.className = 'bstate ' + st;
      chip.innerHTML = st === 'done' ? I.check + 'Completed' : 'Viewed';
      var meta = card.querySelector('.bmeta');
      if (meta) meta.insertBefore(chip, meta.lastElementChild);
    });
  }

  /* ---------- keyboard: chapters (scroll mode) ---------- */
  /* arrow keys jump between chapters: a clicker shortcut, so it only runs with Present mode on */
  window.addEventListener('keydown', function (e) {
    if (!PRESENT) return;
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    if (body.classList.contains('present') || !menu.hidden) return;
    var t = e.target;
    if (t && t.closest && t.closest('input, textarea, select, [role="slider"], [data-keys]')) return;
    var to = null;
    if (e.key === 'ArrowRight') to = cur < CHAPTERS.length ? CHAPTERS[cur].file : 'index.html';
    if (e.key === 'ArrowLeft' && cur) to = cur > 1 ? CHAPTERS[cur - 2].file : 'index.html';
    if (to) window.location.href = to;
  });

  /* ---------- touch wording ---------- */
  if (touch) {
    document.querySelectorAll('.stage-hint, .step .note, .dh-hint, [data-touch-text]').forEach(function (el) {
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      var node;
      while ((node = w.nextNode())) {
        node.nodeValue = node.nodeValue.replace(/\bHover\b/g, 'Tap').replace(/\bhover\b/g, 'tap').replace(/\bMove across\b/g, 'Drag across');
      }
    });
  }

  /* ---------- reveal on scroll ---------- */
  function markIn(el) {
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    el.dispatchEvent(new CustomEvent('reveal'));
  }
  var coverGate = !!document.querySelector('.panel-cover') && window.matchMedia('(min-width: 1001px)').matches;
  var revealables = [].slice.call(document.querySelectorAll('.reveal, .fig, .stage, [data-reveal]')).filter(function (el) { return !(coverGate && el.classList.contains('stage')); });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { markIn(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(markIn);
  }

  /* ---------- glossary: define jargon inline ---------- */
  var tip = null, tipFor = null;
  function glossary() {
    var G = window.HX_GLOSSARY;
    if (!G || !document.querySelector('.step')) return;
    var entries = G.slice().sort(function (a, b) { return b[0].length - a[0].length; }).map(function (g, i) {
      var esc = g[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var caps = /[A-Z].*[A-Z]/.test(g[0]);
      return { term: g[0], def: g[1], id: 'g' + i, re: new RegExp('(^|[^\\p{L}\\p{N}-])(' + esc + ')(?![\\p{L}\\p{N}])', caps ? 'u' : 'iu') };
    });
    document.querySelectorAll('.step').forEach(function (step) {
      var used = {};
      step.querySelectorAll('p, li, dd').forEach(function (block) {
        entries.forEach(function (en) {
          if (used[en.term]) return;
          var w = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { return n.parentNode.closest('.term, button, a, dt, .chip') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
          var node;
          while ((node = w.nextNode())) {
            var m = en.re.exec(node.nodeValue);
            if (!m) continue;
            var start = m.index + m[1].length, word = m[2];
            var after = node.splitText(start); after.nodeValue = after.nodeValue.slice(word.length);
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'term'; b.textContent = word;
            b.setAttribute('data-def', en.def); b.setAttribute('data-term', en.term);
            b.setAttribute('aria-expanded', 'false');
            node.parentNode.insertBefore(b, after);
            used[en.term] = true;
            break;
          }
        });
      });
    });
    tip = document.createElement('div');
    tip.className = 'gtip'; tip.id = 'gtip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
    body.appendChild(tip);
    var terms = [].slice.call(document.querySelectorAll('.term'));
    terms.forEach(function (t) {
      t.addEventListener('mouseenter', function () { if (!touch) showTip(t); });
      t.addEventListener('mouseleave', function () { if (!touch && tipFor === t && !t.classList.contains('pinned')) hideTip(); });
      t.addEventListener('focus', function () { if (t.matches(':focus-visible')) showTip(t); });
      t.addEventListener('blur', function () { if (tipFor === t) hideTip(); });
      t.addEventListener('click', function (e) {
        e.stopPropagation();
        if (tipFor === t && t.classList.contains('pinned')) { hideTip(); return; }
        showTip(t); t.classList.add('pinned');
      });
    });
    document.addEventListener('click', function (e) { if (tipFor && !tip.contains(e.target)) hideTip(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && tipFor) { e.preventDefault(); hideTip(); } });
    window.addEventListener('scroll', function () { if (tipFor) place(tipFor); }, { passive: true });
    window.addEventListener('resize', function () { if (tipFor) place(tipFor); });
  }
  function showTip(t) {
    if (tipFor && tipFor !== t) hideTip();
    tipFor = t;
    tip.innerHTML = '<b>' + t.getAttribute('data-term') + '</b><span>' + t.getAttribute('data-def') + '</span>';
    tip.hidden = false;
    t.setAttribute('aria-expanded', 'true'); t.setAttribute('aria-describedby', 'gtip');
    place(t);
    void tip.offsetWidth; tip.classList.add('on');
  }
  function hideTip() {
    if (!tipFor) return;
    tipFor.classList.remove('pinned'); tipFor.setAttribute('aria-expanded', 'false'); tipFor.removeAttribute('aria-describedby');
    tipFor = null; tip.classList.remove('on'); tip.hidden = true;
  }
  function place(t) {
    var r = t.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    var x = Math.max(12, Math.min(window.innerWidth - tw - 12, r.left + r.width / 2 - tw / 2));
    var below = r.bottom + 10 + th < window.innerHeight - 8;
    var y = below ? r.bottom + 10 : r.top - th - 10;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
    tip.style.setProperty('--ax', (r.left + r.width / 2 - x) + 'px');
    tip.classList.toggle('above', !below);
  }
  glossary();

  /* ---------- linked highlighting ----------
     Inside a [data-links] scope, data-t="key" elements are triggers and every element whose
     data-k list contains an active key gets .is-on. Active keys = hover || pinned || base,
     where base is set programmatically (for example by the current story step). */
  function links(scope) {
    var targets = [].slice.call(scope.querySelectorAll('[data-k]'));
    var triggers = [].slice.call(scope.querySelectorAll('[data-t]'));
    var base = null, pinned = null, hover = null, sig = null;
    function norm(k) { return k == null ? null : Array.isArray(k) ? (k.length ? k : null) : [k]; }
    function render() {
      var ks = norm(hover || pinned || base), s = ks ? ks.join('|') : '';
      if (s === sig) return;
      sig = s;
      scope.classList.toggle('has-focus', !!ks);
      targets.forEach(function (el) {
        var list = ' ' + el.getAttribute('data-k') + ' ';
        el.classList.toggle('is-on', !!ks && ks.some(function (k) { return list.indexOf(' ' + k + ' ') > -1; }));
      });
      scope.dispatchEvent(new CustomEvent('focuskey', { detail: { keys: ks, source: hover ? 'hover' : pinned ? 'pin' : ks ? 'base' : null } }));
    }
    function setPinned(k) {
      pinned = k;
      triggers.forEach(function (t) { t.classList.toggle('is-pinned', t.getAttribute('data-t') === k); });
      render();
    }
    triggers.forEach(function (t) {
      var k = t.getAttribute('data-t');
      if (!t.matches('a, button, input')) { t.tabIndex = 0; t.setAttribute('role', 'button'); }
      t.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hover = k; render(); } });
      t.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hover = null; render(); } });
      t.addEventListener('focus', function () { if (t.matches(':focus-visible')) { hover = k; render(); } });
      t.addEventListener('blur', function () { hover = null; render(); });
      t.addEventListener('click', function (e) { e.stopPropagation(); setPinned(pinned === k ? null : k); });
      t.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !t.matches('a, button')) { e.preventDefault(); t.click(); } });
    });
    document.addEventListener('click', function (e) { if (pinned && !scope.contains(e.target)) setPinned(null); });
    return {
      setBase: function (k) { base = norm(k); hover = null; setPinned(null); },
      pin: setPinned,
      refresh: function () { sig = null; render(); }
    };
  }
  document.querySelectorAll('[data-links]').forEach(function (s) { s._links = links(s); });

  /* ---------- animation helpers ---------- */
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function tween(dur, fn, ease) {
    ease = ease || easeInOut;
    return new Promise(function (resolve) {
      if (reduce || dur <= 0) { fn(1); resolve(); return; }
      var t0 = performance.now();
      (function tick(now) {
        var t = Math.min(1, (now - t0) / dur);
        if (fn(ease(t)) === false) { resolve(); return; }
        if (t < 1) requestAnimationFrame(tick); else resolve();
      })(t0);
    });
  }
  var NUM = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
  function morph(el, toD, dur) {
    var from = (el.getAttribute('d') || '').match(NUM) || [], to = toD.match(NUM) || [];
    if (from.length !== to.length) { el.setAttribute('d', toD); return Promise.resolve(); }
    var parts = toD.split(/-?\d*\.?\d+(?:e[-+]?\d+)?/i), a = from.map(Number), b = to.map(Number);
    var id = (el._morph = (el._morph || 0) + 1);
    return tween(dur == null ? 900 : dur, function (e) {
      if (el._morph !== id) return false;
      var s = parts[0];
      for (var i = 0; i < b.length; i++) s += (a[i] + (b[i] - a[i]) * e).toFixed(2) + parts[i + 1];
      el.setAttribute('d', s);
    });
  }
  function sampler(path, n) {
    n = n || 400;
    var L = path.getTotalLength(), pts = [];
    for (var i = 0; i <= n; i++) { var p = path.getPointAtLength(L * i / n); pts.push([p.x, p.y]); }
    return function (x) {
      var lo = 0, hi = pts.length - 1;
      while (hi - lo > 1) { var m = (lo + hi) >> 1; if (pts[m][0] < x) lo = m; else hi = m; }
      var p0 = pts[lo], p1 = pts[hi], t = p1[0] === p0[0] ? 0 : (x - p0[0]) / (p1[0] - p0[0]);
      return p0[1] + (p1[1] - p0[1]) * t;
    };
  }
  function onReveal(el, cb) { if (el.classList.contains('in')) cb(); else el.addEventListener('reveal', cb, { once: true }); }
  function whileVisible(el, cb) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }).observe(el);
  }

  /* ---------- story engine ----------
     .story > .stage-col (sticky dark stage) + .steps > .step. Scroll activates the step crossing
     the trigger line; the stage stepper and Present mode drive the same go(i). */
  var storyApi = null;
  function story(opts) {
    var root = document.querySelector('.story');
    if (!root) return null;
    var steps = [].slice.call(root.querySelectorAll('.step'));
    var n = steps.length, idx = -1, mode = 'scroll', io = null;
    var dotsEl = root.querySelector('.dots');
    var prevBtn = root.querySelector('[data-step-prev]'), nextBtn = root.querySelector('[data-step-next]');
    var stepsCol = root.querySelector('.steps');
    var titles = steps.map(function (s, i) {
      var h = s.querySelector('h2');
      if (!h) return 'Step ' + (i + 1);
      h = h.cloneNode(true);
      [].forEach.call(h.querySelectorAll('.m-num'), function (x) { x.remove(); });  /* numbered badges (chapter 03) */
      return h.textContent.replace(/\s+/g, ' ').trim();
    });
    steps.forEach(function (s, i) {
      var sn = s.querySelector('.step-n');
      if (sn && !sn.textContent.trim()) { sn.innerHTML = pad(i + 1) + '<i>/ ' + pad(n) + '</i>'; sn.setAttribute('aria-label', 'Step ' + (i + 1) + ' of ' + n); }
    });
    if (dotsEl) dotsEl.innerHTML = '<span class="scount num" aria-hidden="true"><b>01</b><i>/ ' + pad(n) + '</i></span>';
    var countEl = dotsEl && dotsEl.querySelector('b');
    var toc = root.querySelector('.toc ol');
    if (toc) {
      toc.innerHTML = titles.map(function (t, i) {
        return '<li><a href="#story" data-go="' + i + '"><span class="num">' + pad(i + 1) + '</span><span class="tt">' + t + '</span>' + I.arrow + '</a></li>';
      }).join('');
      toc.querySelectorAll('[data-go]').forEach(function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); request(+a.getAttribute('data-go'), true); });
      });
    }
    root.querySelectorAll('[data-begin]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); request(0, true); }); });

    /* the cover photograph holds the right-hand panel until the header's foot rises past 62% of the
       viewport, so the diagram is in place before step 1 reaches the reading line */
    var stageEl = root.querySelector('.stage'), headEl = root.querySelector('.chapter-head');
    function setHead(on) {
      root.classList.toggle('at-head', on);
      if (!on && stageEl) markIn(stageEl);
    }
    if (headEl && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { if (mode === 'scroll') setHead(es[0].isIntersecting); }, { rootMargin: '-62% 0px 0px 0px', threshold: 0 }).observe(headEl);
    } else setHead(false);

    /* "up next" cue on the last step (Present mode) */
    var nxc = CHAPTERS[cur];
    var cue = document.createElement('div');
    cue.className = 'pnext';
    cue.innerHTML = nxc
      ? '<span class="label">Up next</span><span class="pnext-t">Chapter ' + pad(nxc.n) + ' · ' + nxc.title + '</span><span class="pnext-k"><kbd>→</kbd> to continue</span>'
      : '<span class="label">End of the series</span><span class="pnext-t">That’s all eight chapters.</span><span class="pnext-k"><kbd>Esc</kbd> to exit</span>';
    if (stepsCol) stepsCol.appendChild(cue);
    if (document.documentElement.classList.contains('og') && stepsCol && cur) {
      var c0 = CHAPTERS[cur - 1], og = document.createElement('div');
      og.className = 'og-title';
      og.innerHTML = '<span class="label">Chapter ' + pad(cur) + ' of 08 · ' + c0.tag + '</span><b>' + c0.title + '</b><span class="t">' + c0.blurb + '</span>';
      stepsCol.appendChild(og);
    }

    function go(i) {
      i = Math.max(0, Math.min(n - 1, i));
      if (i === idx) return;
      var from = idx;
      idx = i;
      steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      if (countEl) countEl.textContent = pad(i + 1);
      if (toc) [].slice.call(toc.querySelectorAll('a')).forEach(function (a, k) { if (k === i) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
      if (prevBtn) prevBtn.disabled = mode === 'scroll' && i === 0;
      if (nextBtn) nextBtn.disabled = mode === 'scroll' && i === n - 1;
      cue.classList.toggle('on', i === n - 1);
      if (tipFor) hideTip();
      store.set('last', { n: cur, step: i, total: n });
      if (i === n - 1 && done.indexOf(cur) < 0) { done.push(cur); store.set('done', done); }
      if (opts.onStep) opts.onStep(i, steps[i], from);
    }
    function scrollToStep(i, instant) {
      var s = steps[Math.max(0, Math.min(n - 1, i))];
      var r = s.getBoundingClientRect(), y;
      if (mobile()) {
        var col = root.querySelector('.stage-col');
        var stageBottom = parseFloat(getComputedStyle(col).top) + col.offsetHeight;
        y = window.scrollY + r.top - stageBottom - 14;
      } else {
        y = window.scrollY + r.top + r.height / 2 - window.innerHeight * 0.5;
      }
      window.scrollTo({ top: y, behavior: instant || reduce ? 'auto' : 'smooth' });
    }
    /* while a requested scroll is travelling, steps passing the trigger line must not take over */
    var locked = false, lockTimer = null;
    function unlock() {
      if (!locked) return;
      locked = false; clearTimeout(lockTimer);
      window.removeEventListener('scrollend', unlock);
      sync();
    }
    function lockScroll() {
      locked = true; clearTimeout(lockTimer);
      if ('onscrollend' in window) window.addEventListener('scrollend', unlock);
      lockTimer = setTimeout(unlock, 1800);
    }
    function lineY() {
      if (!mobile()) return window.innerHeight * 0.5;
      var col = root.querySelector('.stage-col');
      return Math.min(window.innerHeight * 0.92, parseFloat(getComputedStyle(col).top) + col.offsetHeight + 60);
    }
    function sync() {
      if (mode !== 'scroll') return;
      var y = lineY();
      for (var k = 0; k < n; k++) { var r = steps[k].getBoundingClientRect(); if (r.top <= y && r.bottom >= y) { go(k); return; } }
    }
    function request(i, moveFocus) {
      if (mode === 'present') { presentGo(i); return; }
      i = Math.max(0, Math.min(n - 1, i));
      go(i); lockScroll(); scrollToStep(i);
      /* from the contents list or Begin: take focus to the step, so the next Tab continues from there */
      if (moveFocus) { steps[i].setAttribute('tabindex', '-1'); steps[i].focus({ preventScroll: true }); }
    }
    function mobile() { return window.matchMedia('(max-width: 1000px)').matches; }
    function observe() {
      if (io) io.disconnect();
      var m = '-49% 0px -50% 0px';
      if (mobile()) {
        var col = root.querySelector('.stage-col');
        var line = Math.min(0.92, (parseFloat(getComputedStyle(col).top) + col.offsetHeight + 60) / window.innerHeight);
        m = '-' + Math.round(line * 100) + '% 0px -' + (99 - Math.round(line * 100)) + '% 0px';
      }
      io = new IntersectionObserver(function (entries) {
        if (mode !== 'scroll' || locked) return;
        entries.forEach(function (e) { if (e.isIntersecting) go(steps.indexOf(e.target)); });
      }, { rootMargin: m, threshold: 0 });
      steps.forEach(function (s) { io.observe(s); });
    }
    steps.forEach(function (s, i) { s.addEventListener('click', function (e) { if (mode === 'scroll' && i !== idx && !e.target.closest('[data-t], button, a')) request(i); }); });
    if (prevBtn) prevBtn.addEventListener('click', function () { request(idx - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { request(idx + 1); });

    /* reading progress in the nav segment */
    var navEl = document.getElementById('nav');
    function progress() {
      if (!navEl) return;
      var r = root.getBoundingClientRect(), total = r.height - window.innerHeight;
      var p = Math.max(0, Math.min(1, -r.top / Math.max(1, total)));
      navEl.style.setProperty('--p', p.toFixed(4));
    }
    window.addEventListener('scroll', progress, { passive: true });

    /* present mode */
    var toast = document.createElement('div');
    toast.className = 'ptoast'; toast.setAttribute('aria-hidden', 'true');
    toast.innerHTML = '<span><kbd>→</kbd> next</span><span><kbd>←</kbd> back</span><span><kbd>F</kbd> full screen</span><span><kbd>Esc</kbd> exit</span>';
    if (PRESENT) body.appendChild(toast);
    var idleTimer = null;
    function wake() {
      body.classList.remove('idle');
      clearTimeout(idleTimer);
      if (mode === 'present') idleTimer = setTimeout(function () { body.classList.add('idle'); }, 2600);
    }
    if (PRESENT) window.addEventListener('mousemove', wake, { passive: true });
    function presentGo(i) {
      if (i < 0) { if (cur > 1) window.location.href = CHAPTERS[cur - 2].file + '?present=last'; return; }
      if (i >= n) { window.location.href = cur < CHAPTERS.length ? CHAPTERS[cur].file + '?present' : 'index.html'; return; }
      go(i);
    }
    function onPresentKey(e) {
      if (mode !== 'present' || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      var k = e.key;
      if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Enter' && !e.target.closest('button, a')) { e.preventDefault(); presentGo(idx + 1); }
      else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); presentGo(idx - 1); }
      else if (k === 'Escape') { e.preventDefault(); exitPresent(); }
      else if (k === 'Home') { e.preventDefault(); presentGo(0); }
      else if (k === 'End') { e.preventDefault(); presentGo(n - 1); }
      else if ((k === 'f' || k === 'F') && document.documentElement.requestFullscreen) {
        e.preventDefault();
        if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
        else document.documentElement.requestFullscreen().catch(function () {});
      }
    }
    function enterPresent(at) {
      if (!PRESENT) return;
      mode = 'present';
      body.classList.add('present');
      setHead(false);
      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;
      var u = new URL(window.location.href); u.searchParams.set('present', ''); history.replaceState(null, '', u.toString().replace('present=', 'present'));
      if (typeof at === 'number') { idx = -1; go(at); }
      window.dispatchEvent(new Event('resize'));
      wake();
      var shown = false;
      try { shown = sessionStorage.getItem('hx:ptoast'); sessionStorage.setItem('hx:ptoast', '1'); } catch (e) {}
      if (!shown && !still) { toast.classList.add('on'); setTimeout(function () { toast.classList.remove('on'); }, 4200); }
    }
    function exitPresent() {
      mode = 'scroll';
      body.classList.remove('present', 'idle');
      toast.classList.remove('on');
      var u = new URL(window.location.href); u.searchParams.delete('present'); history.replaceState(null, '', u.toString());
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
      window.dispatchEvent(new Event('resize'));
      requestAnimationFrame(function () { lockScroll(); scrollToStep(idx, true); });
    }
    if (PRESENT) window.addEventListener('keydown', onPresentKey);
    document.querySelectorAll('[data-present]').forEach(function (b) { b.addEventListener('click', function () { enterPresent(Math.max(0, idx)); }); });
    root.querySelectorAll('[data-present-exit]').forEach(function (b) { b.addEventListener('click', exitPresent); });

    var mq = window.matchMedia('(max-width: 1000px)');
    if (mq.addEventListener) mq.addEventListener('change', observe);
    observe();

    var startAt = parseInt(params.get('step') || '1', 10) - 1;
    if (params.has('present') && PRESENT) {
      var pvp = params.get('present');
      enterPresent(pvp === 'last' ? n - 1 : Math.max(0, startAt));
    } else {
      go(Math.max(0, startAt));
      if (params.has('step')) requestAnimationFrame(function () { lockScroll(); scrollToStep(startAt, true); });
    }
    progress();
    storyApi = { go: request, get index() { return idx; }, get mode() { return mode; }, present: enterPresent, exit: exitPresent, count: n };
    return storyApi;
  }

  window.HX = { config: CONFIG, present: PRESENT, chapters: CHAPTERS, current: cur, reduce: reduce, still: still, touch: touch, tween: tween, morph: morph, sampler: sampler, onReveal: onReveal, whileVisible: whileVisible, pad: pad, icons: I, story: story, links: links };
})();
