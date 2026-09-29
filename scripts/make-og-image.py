#!/usr/bin/env python
"""
make-og-image.py — build the 1200x630 social share card (`public/images/og-image.jpg`).

The card is what WhatsApp / Facebook / Slack / X show when someone shares a
cantonpickup.com link, so it carries the brand: a Guangzhou hero photo, a dark
gradient for text legibility, the CantonPickup wordmark and a one-line value
proposition. Google Ads asset policy forbids burned-in text — that rule does
NOT apply here; og cards are expected to be branded.

Run it with the PIL-enabled interpreter:

  C:/Users/Administrator/.workbuddy/binaries/python/envs/default/Scripts/python.exe \
      scripts/make-og-image.py

Options:
  --src public/images/hero/guangzhou-bluehour.jpg   any landscape photo
  --bias 0.0          vertical crop bias (-1 bottom, +1 top)
  --text tagline      the one-liner under the wordmark
"""

import argparse
import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

W, H = 1200, 630
BRAND_BLUE = (18, 85, 155)  # --c-700
WORDMARK = "CantonPickup"


def crop_to_ratio(im, ratio, bias=0.0):
    w, h = im.size
    if w / h > ratio:
        new_w, new_h = int(round(h * ratio)), h
        left = (w - new_w) // 2
        return im.crop((left, 0, left + new_w, h))
    new_w, new_h = w, int(round(w / ratio))
    slack = h - new_h
    top = int(round(slack * (0.5 - bias * 0.5))) if slack else 0
    return im.crop((0, top, w, top + new_h))


def load_font(name, size):
    local = os.path.join(HERE, name)
    if os.path.exists(local):
        return ImageFont.truetype(local, size)
    for fb in (r"C:\Windows\Fonts\GOTHICB.TTF", r"C:\Windows\Fonts\arialbd.ttf"):
        if os.path.exists(fb):
            return ImageFont.truetype(fb, size)
    return ImageFont.load_default()


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--src", default=os.path.join(ROOT, "public", "images", "hero", "guangzhou-bluehour.jpg"))
    ap.add_argument("--out", default=os.path.join(ROOT, "public", "images", "og-image.jpg"))
    ap.add_argument("--bias", type=float, default=0.0)
    ap.add_argument("--text", default="Guangzhou airport transfers & private drivers")
    ap.add_argument("--pill", default="Baiyun Airport · Foshan · From $57")
    args = ap.parse_args()

    src = Image.open(args.src).convert("RGB")
    im = crop_to_ratio(src, W / H, args.bias).resize((W, H), Image.LANCZOS)

    # --- legibility: dark navy wash, stronger on the left where text sits ---
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for x in range(0, W, 4):
        t = x / W
        # 0 -> heavy (alpha 200) on the left, 0.75 -> light (40) on the right
        a = int(200 - 160 * min(1.0, t / 0.75))
        od.rectangle((x, 0, x + 4, H), fill=(6, 28, 51, a))
    im = Image.alpha_composite(im.convert("RGBA"), overlay)

    d = ImageDraw.Draw(im)

    # --- wordmark, centre-left, with a soft shadow ---
    mark_font = load_font("Poppins-ExtraBold.ttf", 92)
    tag_font = load_font("Poppins-Bold.ttf", 40)
    pill_font = load_font("Poppins-Bold.ttf", 30)

    tx = 84
    ty = 212
    d.text((tx + 3, ty + 4), WORDMARK, font=mark_font, fill=(6, 28, 51, 140))
    d.text((tx, ty), WORDMARK, font=mark_font, fill=(255, 255, 255, 255))

    # --- tagline ---
    ty2 = ty + 128
    d.text((tx + 2, ty2 + 2), args.text, font=tag_font, fill=(6, 28, 51, 120))
    d.text((tx, ty2), args.text, font=tag_font, fill=(233, 240, 248, 255))

    # --- pill badge under the tagline ---
    l, t, r, b = d.textbbox((0, 0), args.pill, font=pill_font)
    pw, ph = r - l, b - t
    px0, py0 = tx, ty2 + 84
    px1, py1 = px0 + pw + 44, py0 + ph + 28
    badge = Image.new("RGBA", (px1 - px0, py1 - py0), (0, 0, 0, 0))
    ImageDraw.Draw(badge).rounded_rectangle(
        (0, 0, px1 - px0 - 2, py1 - py0 - 2), radius=(py1 - py0) // 2,
        fill=(*BRAND_BLUE, 235),
    )
    im.paste(badge, (px0, py0), badge)
    d = ImageDraw.Draw(im)
    d.text((px0 + 22 - l, py0 + 14 - t), args.pill, font=pill_font, fill=(255, 255, 255, 255))

    im.convert("RGB").save(args.out, "JPEG", quality=88, optimize=True, progressive=True)
    kb = os.path.getsize(args.out) / 1024
    print(f"wrote {args.out} — {W}x{H}, {kb:.0f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
