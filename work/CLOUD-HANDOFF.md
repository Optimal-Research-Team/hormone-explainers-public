# Cloud handoff (Sep 28, 2026)

This is the public version of the Hormone Explainers. It was adapted from Optimal-Research-Team/hormone-explainers (internal, patient-use). The medical edits are listed in CHANGES-MEDICAL.md. Peter accepts the compliance risk here, but the content must be medically accurate.

Remaining:
1. Apply work/explainers-review-issues.json (38 findings from a medical review and a QA review). Fix all high and medium findings, plus cheap lows, and log any medical edits in CHANGES-MEDICAL.md.
2. Mobile-first pass: 80% of Optimal's users are on phones. Check the scroll stories, the WebGL sky hero, the chapter menu and TOC, the glossary popovers, the top bar and the footer at 390, 375, 360 and 320 with touch at DPR 3.
3. Enable Pages with `gh api -X POST repos/Optimal-Research-Team/hormone-explainers-public/pages -f build_type=workflow`, watch the deploy, and verify https://optimal-research-team.github.io/hormone-explainers-public/ with no console errors.
