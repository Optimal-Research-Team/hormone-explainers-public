# Chapter cover photographs

Each chapter can carry one cover photograph. When a cover is switched on, it appears in two places:

1. **The chapter header**, as a rounded photo card to the right of the title (the beoptimal.ca style).
2. **The "Up next" card** at the end of the previous chapter, as that card's background.

All eight covers are switched on. A chapter without a cover falls back to a text header and the canopy photograph on "Up next".

## How to add one

1. Paste a prompt below into ChatGPT (or another image tool) and ask for a **landscape 3:2** image. ChatGPT's 1536 × 1024 output is fine; larger is better.
2. Save the image as a JPEG named `assets/img/chapters/01.jpg` … `08.jpg`, plus a WebP copy with the same name (`01.webp` …). The site serves the WebP and falls back to the JPEG.
3. Switch it on in `assets/js/site.js` under `COVERS`:
   ```js
   var COVERS = {
     1: 'assets/img/chapters/01.jpg',
     2: 'assets/img/chapters/02.jpg',
     // …
   };
   ```
4. Commit and push. Ideally add all eight at once so the chapters stay consistent.

## Prompts

Each prompt is self-contained: paste it as is.

### Chapter 01 · Cortisol has a dose-dependent effect: balance, the middle band

```
Editorial nature photograph for a premium health clinic website. A single smooth, rounded river stone balanced perfectly on top of a larger flat stone, resting on soft green moss beside a still, clear forest stream. Soft natural early-morning light, muted forest-green and warm cream colour palette, gentle film grain, shallow depth of field. Calm, minimal composition: the stones sit in the right third of the frame, with generous quiet space on the left third. No people, no text, no logos, no medical equipment. Photorealistic, landscape 3:2 aspect ratio, high resolution.
```

### Chapter 02 · How HPA dysfunction evolves: gradual depletion

```
Editorial still-life photograph for a premium health clinic website. Four leaves from the same plant laid in a neat horizontal row on natural cream linen, progressing from left to right: vivid fresh green, lighter green, yellowing, and finally dry and brown. Soft diffused top-down natural light, muted forest-green and warm cream colour palette, gentle film grain, subtle linen texture. Calm, minimal composition with the row of leaves across the lower-right of the frame and generous quiet space above and on the left. No people, no text, no logos, no medical equipment. Photorealistic, landscape 3:2 aspect ratio, high resolution.
```

### Chapter 03 · Three ways to measure cortisol: the shape of a day

```
Editorial nature photograph for a premium health clinic website. A weathered stone sundial in a quiet garden at sunrise, its long morning shadow stretching across dewy grass, low golden sunlight raking across the scene. Muted forest-green and warm cream colour palette with soft golden highlights, gentle film grain, shallow depth of field. Calm, minimal composition: the sundial sits in the right third of the frame, with generous quiet space on the left third. No people, no text, no numerals or readable markings, no logos. Photorealistic, landscape 3:2 aspect ratio, high resolution.
```

### Chapter 04 · Cortisol's partners: counterbalance

```
Editorial photograph for a premium health clinic website. A simple weathered wooden see-saw in an empty park at dusk, one end resting on the grass and the other raised, framed by soft trees. Warm golden light fading into a calm blue evening sky, muted forest-green and warm cream colour palette, gentle film grain, shallow depth of field. Calm, minimal composition: the see-saw sits in the right half of the frame, with generous quiet space on the left third. No people, no text, no logos, no playground clutter. Photorealistic, landscape 3:2 aspect ratio, high resolution.
```

### Chapter 05 · Foundational vs. top-line hormones: roots and canopy

```
Editorial nature photograph for a premium health clinic website. A large, old oak tree photographed from a low angle, its thick exposed roots gripping mossy forest ground in the foreground and its full canopy glowing in soft light above. Soft natural early-morning light filtering through the leaves, muted forest-green and warm cream colour palette, gentle film grain, shallow depth of field. Calm composition: the trunk and roots sit in the right third of the frame, with generous quiet space on the left third. No people, no text, no logos. Photorealistic, landscape 3:2 aspect ratio, high resolution.
```

### Chapter 06 · The hormone cycle and its stop points: a loop you can step out of

```
Editorial nature photograph for a premium health clinic website. A circular stone labyrinth path set into a quiet garden lawn, seen from slightly above, with light morning mist and one clear opening in the outer ring. Soft natural early-morning light, muted forest-green and warm cream colour palette, gentle film grain. Calm, minimal composition: the labyrinth sits in the right half of the frame, with generous quiet space on the left third. No people, no text, no logos. Photorealistic, landscape 3:2 aspect ratio, high resolution.
```

### Chapter 07 · Sleep, cortisol and the hormone web: connection

```
Editorial nature photograph for a premium health clinic website. A delicate spider web covered in tiny morning dew drops, backlit by soft early sunlight against a dark, out-of-focus deep green forest background, every strand catching the light. Muted forest-green and warm cream colour palette, gentle film grain, very shallow depth of field. Calm, minimal composition: the web sits in the right half of the frame, with generous dark quiet space on the left third. No spider visible, no people, no text, no logos. Photorealistic, landscape 3:2 aspect ratio, high resolution.
```

### Chapter 08 · The pyramid of interventions: build from the base

```
Editorial nature photograph for a premium health clinic website. A carefully balanced cairn of flat, smooth stones on a quiet misty shoreline, the widest and heaviest stones at the base and progressively smaller stones toward the top. Soft natural early-morning light, muted forest-green, stone-grey and warm cream colour palette, gentle film grain, shallow depth of field. Calm, minimal composition: the cairn sits in the right third of the frame, with generous quiet space on the left third. No people, no text, no logos. Photorealistic, landscape 3:2 aspect ratio, high resolution.
```

## Tips

- Generate 3–4 options per chapter and pick the calmest one. Busy images fight the text overlay on the "Up next" card.
- Keep the subject on the **right**. The "Up next" card darkens the left side for its text.
- For consistency, generate all eight in one ChatGPT conversation and ask it to "keep the same photographic style and colour grading as the previous images".
- Check every result for odd physics (floating stones, broken web strands), stray text or watermarks before using it.
