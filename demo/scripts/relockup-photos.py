"""Put the approved Hearfy lockup onto the props inside the site's photos.

    python3 scripts/relockup-photos.py            # rewrite in place
    python3 scripts/relockup-photos.py --check    # report only, exit 1 if stale

The photographs come from the founders' image generator, which branded every
prop it drew with the name in casings CLAUDE.md rules out -- "HEARFY" here, on
the CMA's polo and on the hearing-aid case. The name is in PIXELS, so no
source-text guard can see it; `lib/one-pager.test.ts` asserts this script still
runs instead.

The fix is the deck's, and the video pipeline's before that
(internal/recut/tools/rebrand.py): inpaint the wrong lockup away and composite
the APPROVED asset's own pixels over the hole. The mark is never redrawn, so
the teal and the letterforms stay exactly what the brand files say.

Unlike the deck's `prep-assets.py`, there is no upstream render to re-cut from
-- these JPEGs were committed directly -- so this rewrites them in place and is
idempotent: the boxes below are already clean after the first run, and running
again composites the same artwork onto the same spot.
"""
import os, sys
import numpy as np
import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
BRAND = os.environ.get("BRAND", os.path.join(ROOT, "public", "brand"))
LOGO_PNG = os.path.join(BRAND, "hearfy-logo-2000w.png")
# the asset's widest internal gap (columns 700-896 of 2000) splits mark/wordmark
LOGO_SPLIT = 798


def _trim(l):
    ys, xs = np.where(l[:, :, 3] > 0)
    return l[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def _logo(part="full", color=None):
    """The approved lockup, trimmed to its ink.

    part='stacked' re-composes the SAME two pieces vertically, mark centred
    over wordmark -- the arrangement the polo wears. Both halves are still the
    asset's own pixels; only their relative position changes.
    """
    l = cv2.imread(LOGO_PNG, cv2.IMREAD_UNCHANGED)
    if l is None:
        raise SystemExit(f"approved logo asset missing: {LOGO_PNG}")
    l = l.copy()
    if part == "word":
        l = _trim(l[:, LOGO_SPLIT:])
    elif part == "stacked":
        mark, word = _trim(l[:, :LOGO_SPLIT]), _trim(l[:, LOGO_SPLIT:])
        mw = max(2, int(round(word.shape[1] * 0.62)))
        mh = max(2, int(round(mw * mark.shape[0] / mark.shape[1])))
        mark = cv2.resize(mark, (mw, mh), interpolation=cv2.INTER_AREA)
        gap = max(1, mh // 5)
        W = max(mw, word.shape[1])
        out = np.zeros((mh + gap + word.shape[0], W, 4), np.uint8)
        out[0:mh, (W - mw) // 2:(W - mw) // 2 + mw] = mark
        out[mh + gap:, (W - word.shape[1]) // 2:(W - word.shape[1]) // 2 + word.shape[1]] = word
        l = out
    else:
        l = _trim(l)
    if color is not None:  # a one-colour print (embroidery, vinyl)
        m = l[:, :, 3] > 0
        for c in range(3):
            l[:, :, c][m] = color[c]
    return l


def relockup(arr, clear, at, width, part="full", light=False, thr=170,
             color=None, soften=0.6, colour_key=True):
    """Replace one baked-in lockup in `arr` (BGR) with the approved artwork."""
    x, y, w, h = clear
    sub = arr[y:y + h, x:x + w]
    g = cv2.cvtColor(sub, cv2.COLOR_BGR2GRAY)
    ink = ((g > thr) if light else (g < thr)).astype(np.uint8) * 255
    # The mark's saturated bars sit mid-grey, so luminance alone leaves them
    # ghosting behind the new lockup. Only safe where the ground is
    # near-neutral -- on a coloured garment it keys the garment itself.
    if colour_key:
        hsv = cv2.cvtColor(sub, cv2.COLOR_BGR2HSV)
        ink = cv2.bitwise_or(ink, cv2.inRange(hsv, (70, 40, 40), (115, 255, 255)))
    mask = np.zeros(arr.shape[:2], np.uint8)
    mask[y:y + h, x:x + w] = cv2.dilate(ink, np.ones((3, 3), np.uint8))
    arr = cv2.inpaint(arr, mask, 5, cv2.INPAINT_TELEA)

    lg = _logo(part, color)
    lh = max(2, int(round(width * lg.shape[0] / lg.shape[1])))
    lg = cv2.resize(lg, (width, lh), interpolation=cv2.INTER_AREA)
    alpha = cv2.GaussianBlur(lg[:, :, 3].astype(np.float32) / 255.0, (3, 3), soften)
    ax, ay = at
    sl = arr[ay:ay + lh, ax:ax + width].astype(np.float32)
    if sl.shape[:2] != (lh, width):
        raise SystemExit(f"relockup: lockup at {at} escapes the image")
    for c in range(3):
        sl[:, :, c] = sl[:, :, c] * (1 - alpha) + lg[:, :, c].astype(np.float32) * alpha
    arr[ay:ay + lh, ax:ax + width] = sl.astype(np.uint8)
    return arr


# Every photo with the name on a prop, and where. Coordinates are in the
# committed file's own pixels. A photo absent from here has no branding in it
# (checked by eye across public/one-pager, public/video and public/exam on
# 2026-09-04): only the hero carries a lockup.
JOBS = {
    "public/one-pager/visit-home.jpg": [
        # The CMA's polo: a stacked lockup, embroidered in one light thread.
        # The clear box stops just under the wordmark. The darker band below it
        # is a fold-shadow in the photograph, not print - measured mean 10.4
        # against 18.9 for lit fabric - so widening the box to "clean" it only
        # inpaints away shading that belongs there.
        dict(clear=(843, 420, 87, 69), at=(852, 424), width=66, part="stacked",
             light=True, thr=140, color=(238, 240, 242), soften=0.5),
        # The kit case: horizontal, printed light on a black shell.
        dict(clear=(611, 612, 110, 34), at=(614, 616), width=104,
             light=True, thr=140, color=(238, 240, 242), soften=0.5),
    ],
}


def main():
    check = "--check" in sys.argv
    stale = []
    for rel, regions in JOBS.items():
        path = os.path.join(ROOT, rel)
        img = cv2.imread(path)
        if img is None:
            raise SystemExit(f"missing photo: {rel}")
        out = img.copy()
        for r in regions:
            out = relockup(out, **r)
        if check:
            # A rerun on an already-fixed photo changes almost nothing; a photo
            # that still carries the old lockup moves a lot of pixels.
            diff = float(np.abs(out.astype(np.int16) - img.astype(np.int16)).mean())
            print(f"{rel:44s} mean delta {diff:.2f}")
            if diff > 1.5:
                stale.append(rel)
        else:
            cv2.imwrite(path, out, [cv2.IMWRITE_JPEG_QUALITY, 92])
            print(f"{rel:44s} {len(regions)} lockup(s) -> {os.path.getsize(path)//1024} KB")
    if stale:
        raise SystemExit("stale, re-run without --check: " + ", ".join(stale))


if __name__ == "__main__":
    main()
