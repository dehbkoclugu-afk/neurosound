#!/usr/bin/env python3
"""
Draw the app marks from the same numbers the Dial uses.

The icon and the in-app dial were two different drawings of "a dial": the
icon had ticks all the way round the circle, the dial has 21 ticks over a
270 degree gain sweep with a dead zone at the bottom, which is the whole
thing that makes it read as a knob rather than a clock. Someone tapping the
icon and someone looking at the Player were seeing different instruments.

The constants below are copied from components/ui/Dial.tsx on purpose — a
Python script cannot import a TSX module, so they are duplicated with this
note rather than silently drifting. If the dial's sweep changes, change it
here and re-run:

    python3 scripts/generate-icons.py

Supersampled 4x and downsampled, because the ticks are 2px at final size and
alias badly otherwise.
"""

import math
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "assets", "images")

# --- from components/ui/Dial.tsx ---
ANGLE_MIN = -135.0
ANGLE_MAX = 135.0
TICK_COUNT = 21
MAJOR_EVERY = 5
# The needle rests at 50%, which is the middle of the sweep: straight up.
NEEDLE_ANGLE = 0.0

# --- from constants/theme.ts ---
INK_LIGHT = (127, 168, 204)   # dark.accent / inkBlueLight
INK_DARK = (47, 92, 138)      # light.accent / inkBlue
PAPER_DARK = (21, 19, 15)     # dark.background
PAPER_LIGHT = (247, 242, 231)  # light.background

SS = 4  # supersample factor


def draw_dial(size, ink, background, margin_ratio=0.14):
    """Return an RGBA image of the mark at `size`, drawn at SS and reduced."""
    s = size * SS
    img = Image.new("RGBA", (s, s), background + (255,) if background else (0, 0, 0, 0))
    # Everything translucent goes on its own layer and is composited at the
    # end. Drawing an RGBA fill straight onto the image *replaces* pixels
    # rather than blending them, so the face's 11%-alpha wash came out as
    # solid ink — which is exactly how the first run of this script produced
    # a flat blue disc instead of a dial.
    overlay = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    cx = cy = s / 2
    outer = s * (0.5 - margin_ratio)
    face_r = outer * 0.78

    def tick(angle_deg, length, width, alpha):
        # 0 degrees points up, positive clockwise — the same convention as the
        # dial's rotate transform.
        a = math.radians(angle_deg - 90)
        r_out = outer
        r_in = outer - length
        x1, y1 = cx + math.cos(a) * r_in, cy + math.sin(a) * r_in
        x2, y2 = cx + math.cos(a) * r_out, cy + math.sin(a) * r_out
        d.line([(x1, y1), (x2, y2)], fill=ink + (alpha,), width=int(width))

    step = (ANGLE_MAX - ANGLE_MIN) / (TICK_COUNT - 1)
    for i in range(TICK_COUNT):
        major = i % MAJOR_EVERY == 0
        tick(
            ANGLE_MIN + step * i,
            outer * (0.20 if major else 0.11),
            max(2, s * (0.011 if major else 0.008)),
            255 if major else 130,
        )

    # Face: a filled disc a touch lighter than the ground, with a hairline rim.
    d.ellipse(
        [cx - face_r, cy - face_r, cx + face_r, cy + face_r],
        fill=ink + (28,),
        outline=ink + (110,),
        width=max(2, int(s * 0.006)),
    )

    # Needle: hub to just inside the face rim.
    a = math.radians(NEEDLE_ANGLE - 90)
    d.line(
        [(cx, cy), (cx + math.cos(a) * face_r * 0.86, cy + math.sin(a) * face_r * 0.86)],
        fill=ink + (255,),
        width=max(3, int(s * 0.016)),
    )
    hub = s * 0.022
    d.ellipse([cx - hub, cy - hub, cx + hub, cy + hub], fill=ink + (255,))

    return Image.alpha_composite(img, overlay).resize((size, size), Image.LANCZOS)


def save(img, name, mode=None):
    path = os.path.join(ASSETS, name)
    out = img.convert(mode) if mode else img
    out.save(path)
    print("wrote", os.path.relpath(path, os.path.join(HERE, "..")))


def main():
    # Store icon: opaque, dark ground.
    save(draw_dial(1024, INK_LIGHT, PAPER_DARK), "icon.png", "RGB")

    # Android adaptive foreground: transparent, and inset further because the
    # launcher crops a circle out of the middle.
    save(draw_dial(1024, INK_LIGHT, None, margin_ratio=0.27), "android-icon-foreground.png")

    # Monochrome (themed icons): same geometry, single flat colour.
    mono = draw_dial(1024, (255, 255, 255), None, margin_ratio=0.27)
    save(mono, "android-icon-monochrome.png")

    # Splash sits on the theme background, so it is transparent too.
    save(draw_dial(1024, INK_LIGHT, None, margin_ratio=0.10), "splash-icon.png")

    # Favicon: too small for minor ticks to survive, but the sweep still reads.
    save(draw_dial(48, INK_DARK, None, margin_ratio=0.06), "favicon.png")


if __name__ == "__main__":
    main()
