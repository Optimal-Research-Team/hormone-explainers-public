"""Turn a three-tone treeline silhouette (black near / mid grey / light grey far on white)
into the hero's packed texture: 4096x512 RGB, R = near, G = mid, B = far, seamless.

Each layer is extracted from its grey level, then re-cut at valleys between trees and
reshuffled (with flips and slight stretches) into a strip about three source widths long,
so the same trees do not line up side by side on screen."""
import sys, random
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
TW, TH = 4096, 512
rng = random.Random(11)

g = np.asarray(Image.open(src).convert('L')).astype(np.float32)
H0, W0 = g.shape
ramp = lambda x, a, b: np.clip((a - x) / (a - b), 0, 1)  # 1 at <= b, 0 at >= a
near = ramp(g, 100, 22)
mid = ramp(g, 186, 150)
far = ramp(g, 248, 206)

# trim image edges (generators leave soft borders) and crop to the treeline
m = 6
near, mid, far = near[:, m:-m], mid[:, m:-m], far[:, m:-m]
rows = np.where((far > 0.5).any(axis=1))[0]
top = max(0, rows[0] - 6)
near, mid, far = near[top:], mid[top:], far[top:]
Hc, Wc = near.shape
scale = TH / Hc
target = int(round(TW / scale))

def profile(mask):
    filled = mask > 0.5
    h = np.where(filled.any(axis=0), filled.argmax(axis=0), Hc).astype(np.float32)
    return h

def valleys(h, k, step=1):
    c = []
    for x in range(k, len(h) - k, step):
        if h[x] >= h[x - k:x + k + 1].max() - 0.5:
            c.append(x)
    return c

def synth(stack, k, lo, hi, tol):
    """stack: 3 x Hc x Wc masks (near, mid, far), cut jointly so the layers stay registered."""
    hn, hm, hf = profile(stack[0]), profile(stack[1]), profile(stack[2])
    deep = np.percentile(hn, 60)
    cand = [x for x in valleys(hn, k) if hn[x] >= deep]
    H3 = {x: np.array([hn[x], hm[x], hf[x]]) for x in cand}
    pairs = []
    for s0 in cand:
        for e0 in cand:
            if lo <= e0 - s0 <= hi:
                pairs.append((s0, e0, False, H3[s0], H3[e0]))
                pairs.append((s0, e0, True, H3[e0], H3[s0]))
    tolv = np.array(tol, dtype=np.float32)
    def fits(h0, h1, k=1.0): return (np.abs(h0 - h1) <= tolv * k).all()
    use = np.zeros(Wc)
    segs, total = [], 0
    first = None
    while total < target:
        prev = segs[-1][4] if segs else None
        closing = target - total < hi * 1.1
        opts = [pp for pp in pairs if (prev is None or fits(pp[3], prev)) and (not closing or fits(pp[4], first, 1.4))]
        if not opts:
            opts = [pp for pp in pairs if prev is None or fits(pp[3], prev, 1.8)]
        # prefer stretches of the source used least so far
        opts.sort(key=lambda pp: use[pp[0]:pp[1]].mean() + rng.random() * 0.8)
        a0, b0, flip, hs, he = opts[0]
        use[a0:b0] += 1
        stretch = rng.uniform(0.92, 1.1)
        segs.append((a0, b0, flip, stretch, he))
        if first is None:
            first = hs
        total += int((b0 - a0) * stretch)
    guard = len(pairs)
    chans = []
    for L in range(3):
        cols = []
        for a, b, flip, stretch, _ in segs:
            piece = stack[L][:, a:b]
            if flip:
                piece = piece[:, ::-1]
            w = max(4, int(piece.shape[1] * stretch))
            piece = np.asarray(Image.fromarray((piece * 255).astype(np.uint8)).resize((w, Hc), Image.LANCZOS)).astype(np.float32) / 255
            cols.append(piece)
        X = 22
        strip = cols[0]
        for pc in cols[1:]:
            t = np.linspace(0, 1, X)[None, :]
            strip = np.concatenate([strip[:, :-X], strip[:, -X:] * (1 - t) + pc[:, :X] * t, pc[:, X:]], axis=1)
        t = np.linspace(0, 1, X)[None, :]
        strip = np.concatenate([strip[:, -X:] * (1 - t) + strip[:, :X] * t, strip[:, X:-X]], axis=1)
        chans.append(Image.fromarray((np.clip(strip, 0, 1) * 255).astype(np.uint8)).resize((TW, TH), Image.LANCZOS))
    return chans, len(segs), guard

(R, G, B), n, tries = synth(np.stack([near, mid, far]), 7, 160, 560, (12, 16, 9))
tex = Image.merge('RGB', (R, G, B))
tex.save(out, optimize=True)
# the page loads the lossless WebP copy (same pixels, smaller file)
tex.save(out.replace('.png', '.webp'), 'WEBP', lossless=True, quality=100, method=6)
print('segments', n, 'tries', tries)

prev = Image.new('RGB', (TW, TH), (46, 58, 80))
for msk, col in ((B, (92, 104, 118)), (G, (46, 58, 66)), (R, (10, 15, 14))):
    prev.paste(Image.new('RGB', (TW, TH), col), (0, 0), msk)
prev.resize((2048, 256), Image.LANCZOS).save(out.replace('.png', '-preview.jpg'), quality=88)

far_top = np.median(profile(far)) / Hc
mid_top = np.median(profile(mid)) / Hc
near_ground = np.percentile(profile(near), 90) / Hc
print('far top %.3f  mid top %.3f  near valleys %.3f' % (far_top, mid_top, near_ground))
