"""
Generates the Markov v2 logo set.

The mark is the argument in one image: a chain of checkpoints where only the newest
one is lit. The Markov property says the next state depends only on the current state
— which holds only if you can identify the current state. Three dim nodes, one bright,
and a ring around the bright one to say "this is the one you have to find".

    python submission/make-logo.py

Writes PNGs into submission/logo/.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).parent / "logo"
OUT.mkdir(exist_ok=True)

INK = (14, 17, 27)            # near-black, slight blue
DIM = (86, 96, 124)           # spent checkpoints
LIVE = (94, 234, 212)         # the current state — teal, reads on light and dark
LINE = (52, 60, 82)
PAPER = (250, 250, 252)


def draw_chain(d, cx, cy, r, gap, n=4, line_w=None):
    """Chain of n nodes centred on (cx, cy); the last is the live one."""
    line_w = line_w or max(2, r // 5)
    span = (n - 1) * gap
    x0 = cx - span / 2
    xs = [x0 + i * gap for i in range(n)]

    for a, b in zip(xs, xs[1:]):
        d.line([(a + r, cy), (b - r, cy)], fill=LINE, width=line_w)

    for i, x in enumerate(xs):
        live = i == n - 1
        fill = LIVE if live else DIM
        d.ellipse([x - r, cy - r, x + r, cy + r], fill=fill)
        if live:
            ring = r + line_w * 2.2
            d.ellipse([x - ring, cy - ring, x + ring, cy + ring],
                      outline=LIVE, width=max(2, line_w))


def font(size):
    for name in ("segoeuib.ttf", "arialbd.ttf", "seguisb.ttf", "arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def mark(size, bg):
    img = Image.new("RGBA", (size, size), bg)
    d = ImageDraw.Draw(img)
    r = int(size * 0.075)
    gap = int(size * 0.215)
    draw_chain(d, size / 2, size / 2, r, gap)
    return img


# 1. Square mark, transparent and on ink
mark(512, (0, 0, 0, 0)).save(OUT / "mark-512-transparent.png")
mark(512, INK + (255,)).save(OUT / "mark-512-dark.png")
mark(512, PAPER + (255,)).save(OUT / "mark-512-light.png")
mark(1024, (0, 0, 0, 0)).save(OUT / "mark-1024-transparent.png")

# 2. Favicon-ish sizes
for s in (32, 64, 128, 256):
    mark(s, (0, 0, 0, 0)).save(OUT / f"mark-{s}-transparent.png")

# 3. Horizontal lockup: mark + wordmark
W, H = 1200, 400
img = Image.new("RGBA", (W, H), INK + (255,))
d = ImageDraw.Draw(img)
draw_chain(d, 250, H / 2, 30, 86)
f_name = font(96)
f_sub = font(34)
d.text((430, H / 2 - 74), "MARKOV", font=f_name, fill=PAPER)
d.text((430 + d.textlength("MARKOV", font=f_name) + 22, H / 2 - 70), "v2",
       font=f_name, fill=LIVE)
d.text((434, H / 2 + 34), "read the whole set, and order it yourself",
       font=f_sub, fill=DIM)
img.save(OUT / "lockup-1200x400-dark.png")

# 4. Social card
W, H = 1200, 630
img = Image.new("RGBA", (W, H), INK + (255,))
d = ImageDraw.Draw(img)
draw_chain(d, W / 2, 250, 34, 104)
f_title = font(78)
f_tag = font(36)
title = "MARKOV v2"
d.text(((W - d.textlength(title, font=f_title)) / 2, 360), title,
       font=f_title, fill=PAPER)
tag = "cross-agent handoff on Walrus"
d.text(((W - d.textlength(tag, font=f_tag)) / 2, 462), tag, font=f_tag, fill=LIVE)
sub = "the search that returns your checkpoints doesn't know which one is current"
f_small = font(26)
d.text(((W - d.textlength(sub, font=f_small)) / 2, 522), sub, font=f_small, fill=DIM)
img.save(OUT / "social-1200x630.png")

for p in sorted(OUT.glob("*.png")):
    print(f"  {p.name:32} {p.stat().st_size // 1024:4} KB")
