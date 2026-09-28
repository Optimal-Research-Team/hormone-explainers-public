#!/usr/bin/env python3
"""Write the SEO block in each page's <head>: title, description, canonical, Open Graph,
Twitter and JSON-LD (MedicalWebPage, audience: Patient).

The block sits between <!-- seo:start --> and <!-- seo:end -->. On the first run it replaces
everything from <title> to the twitter:card line. Re-run after editing PAGES:

    python3 tools/seo-head.py
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = 'https://optimal-research-team.github.io/hormone-explainers-public/'
PUBLISHED = '2026-09-28'
MODIFIED = '2026-09-28'

CLINIC = {
    '@type': 'MedicalClinic',
    '@id': 'https://www.beoptimal.ca/#clinic',
    'name': 'Optimal Health Clinic',
    'url': 'https://www.beoptimal.ca',
    'logo': BASE + 'assets/img/optimal-wordmark-green.png',
    'telephone': '+1-437-370-0291',
    'email': 'care@beoptimal.ca',
    'address': {
        '@type': 'PostalAddress',
        'streetAddress': '630 Huronia Road, Unit 5',
        'addressLocality': 'Barrie',
        'addressRegion': 'ON',
        'postalCode': 'L4N 0W5',
        'addressCountry': 'CA',
    },
}
SITE = {'@type': 'WebSite', '@id': BASE + '#site', 'name': 'Hormone Explainers', 'url': BASE,
        'inLanguage': 'en-CA', 'publisher': {'@id': CLINIC['@id']}}
AUDIENCE = {'@type': 'MedicalAudience', 'audienceType': 'Patient'}

# file, <title>, H1 / og:title stem, meta description, og image, topics
PAGES = [
    ('index.html',
     'Hormone Explainers: cortisol, sleep and hormones · Optimal',
     'Hormone Explainers',
     'Eight short, interactive explainers on cortisol, stress, sleep and the sex hormones, with the evidence labelled. Free education from Optimal Health Clinic.',
     'home.jpg', ['Cortisol', 'Stress', 'Sleep', 'Melatonin', 'Insulin resistance', 'Sex hormones']),
    ('01-dose-response.html',
     'Cortisol: why too little and too much both harm · Optimal',
     'Cortisol has a dose-dependent effect',
     'Drag a marker along cortisol’s dose–response curve to see what too little, too much and the healthy middle band do in the body. Chapter 1 of 8.',
     '01.jpg', ['Cortisol', 'Adrenal insufficiency', 'Cushing’s syndrome']),
    ('02-hpa-dysfunction.html',
     'Chronic stress and the daily cortisol curve · Optimal',
     'How chronic stress can change the cortisol curve',
     'How long-term stress can flatten the daily cortisol rhythm, what research shows, and why adrenal fatigue isn’t a recognized diagnosis. Chapter 2 of 8.',
     '02.jpg', ['Cortisol', 'Chronic stress', 'HPA axis', 'Circadian rhythm']),
    ('03-measuring-cortisol.html',
     'Cortisol awakening response, slope and AUC, explained · Optimal',
     'Three ways to measure cortisol',
     'The cortisol awakening response, diurnal slope and area under the curve: three research measures from one daily curve, and their limits. Chapter 3 of 8.',
     '03.jpg', ['Cortisol awakening response', 'Diurnal cortisol slope', 'Salivary cortisol']),
    ('04-cortisol-partners.html',
     'Cortisol’s partners: oxytocin, GABA and melatonin · Optimal',
     'Cortisol’s partners',
     'What turns cortisol production down, what buffers its effects, and how cortisol and melatonin trade places across the day. Chapter 4 of 8.',
     '04.jpg', ['Cortisol', 'Oxytocin', 'Melatonin', 'DHEA', 'HPA axis']),
    ('05-hormone-tree.html',
     'Foundational vs. top-line hormones: the hormone tree · Optimal',
     'Foundational vs. top-line hormones',
     'A way to think about hormone priorities: sex hormones as the canopy, insulin as the trunk, cortisol and thyroid as the roots. Chapter 5 of 8.',
     '05.jpg', ['Sex hormones', 'Insulin', 'Cortisol', 'Thyroid']),
    ('06-cycle-stop-points.html',
     'The hormone loop: sleep, insulin, cortisol and mood · Optimal',
     'The hormone cycle and its stop points',
     'Sleep, insulin, cortisol, mood, estrogen and melatonin feed each other in a loop. Six places to interrupt it, with the evidence labelled. Chapter 6 of 8.',
     '06.jpg', ['Insomnia', 'Insulin resistance', 'Cortisol', 'Menopause', 'Melatonin']),
    ('07-sleep-hormone-web.html',
     'How sleep, cortisol, insulin and sex hormones connect · Optimal',
     'Sleep, cortisol and the hormone web',
     'Twelve links between sleep, melatonin, cortisol, insulin resistance, testosterone, estrogen, progesterone and mood, traced one at a time. Chapter 7 of 8.',
     '07.jpg', ['Sleep', 'Melatonin', 'Cortisol', 'Insulin resistance', 'Estrogen', 'Testosterone', 'Progesterone']),
    ('08-pyramid-of-interventions.html',
     'Where to start: sleep before supplements · Optimal',
     'The pyramid of interventions',
     'The pyramid of interventions: sleep and circadian rhythm at the base, then movement, food and the basics, with supplements at the top. Chapter 8 of 8.',
     '08.jpg', ['Sleep hygiene', 'Circadian rhythm', 'Exercise', 'Nutrition', 'Dietary supplements']),
]


def a(v):
    return html.escape(v, quote=True)


def block(i, page):
    file, title, h1, desc, img, topics = page
    url = BASE if file == 'index.html' else BASE + file
    og = BASE + 'assets/og/' + img
    og_title = h1 + (' · Optimal' if file == 'index.html' else ' · Hormone Explainers')
    alt = ('A 24-hour cortisol and melatonin rhythm over a boreal treeline' if file == 'index.html'
           else h1 + ': an illustrated diagram from Optimal’s hormone explainers')
    web = {
        '@type': 'MedicalWebPage', '@id': url + '#page', 'url': url, 'name': h1, 'headline': h1,
        'description': desc, 'inLanguage': 'en-CA', 'audience': AUDIENCE,
        'specialty': 'https://schema.org/Endocrine',
        'about': [{'@type': 'MedicalEntity', 'name': t} for t in topics],
        'image': og, 'datePublished': PUBLISHED, 'dateModified': MODIFIED,
        'isPartOf': {'@id': SITE['@id']}, 'publisher': {'@id': CLINIC['@id']},
    }
    if file == 'index.html':
        web['hasPart'] = [{'@type': 'MedicalWebPage', 'name': p[2], 'url': BASE + p[0], 'position': n}
                          for n, p in enumerate(PAGES[1:], 1)]
        graph = [SITE, CLINIC, web]
    else:
        web['position'] = i
        web['breadcrumb'] = {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Hormone Explainers', 'item': BASE},
            {'@type': 'ListItem', 'position': 2, 'name': h1, 'item': url}]}
        graph = [SITE, CLINIC, web]
    ld = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, separators=(',', ':'))
    ld = ld.replace('</', '<\\/')
    lines = [
        '<!-- seo:start -->',
        '<title>%s</title>' % html.escape(title, quote=False),
        '<meta name="description" content="%s">' % a(desc),
        '<link rel="canonical" href="%s">' % url,
        '<meta name="robots" content="index, follow, max-image-preview:large">',
        '<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">',
        '<meta property="og:type" content="%s">' % ('website' if file == 'index.html' else 'article'),
        '<meta property="og:locale" content="en_CA">',
        '<meta property="og:site_name" content="Optimal · Hormone Explainers">',
        '<meta property="og:title" content="%s">' % a(og_title),
        '<meta property="og:description" content="%s">' % a(desc),
        '<meta property="og:url" content="%s">' % url,
        '<meta property="og:image" content="%s">' % og,
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta property="og:image:alt" content="%s">' % a(alt),
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="twitter:title" content="%s">' % a(og_title),
        '<meta name="twitter:description" content="%s">' % a(desc),
        '<meta name="twitter:image" content="%s">' % og,
        '<meta name="twitter:image:alt" content="%s">' % a(alt),
        '<script type="application/ld+json">%s</script>' % ld,
        '<!-- seo:end -->',
    ]
    return '\n'.join(lines)


def main():
    for i, page in enumerate(PAGES):
        path = ROOT / page[0]
        src = path.read_text()
        new = block(i, page)
        if '<!-- seo:start -->' in src:
            src = re.sub(r'<!-- seo:start -->.*?<!-- seo:end -->', lambda m: new, src, flags=re.S)
        else:
            src, n = re.subn(r'<title>.*?<meta name="twitter:card" content="summary_large_image">', lambda m: new, src, flags=re.S)
            assert n == 1, page[0]
        path.write_text(src)
        print('wrote', page[0])

    urls = [BASE] + [BASE + p[0] for p in PAGES[1:]]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for n, u in enumerate(urls):
        sm.append('  <url><loc>%s</loc><lastmod>%s</lastmod><priority>%s</priority></url>' % (u, MODIFIED, '1.0' if n == 0 else '0.8'))
    sm.append('</urlset>')
    (ROOT / 'sitemap.xml').write_text('\n'.join(sm) + '\n')
    (ROOT / 'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: %ssitemap.xml\n' % BASE)
    print('wrote sitemap.xml, robots.txt')


if __name__ == '__main__':
    main()
