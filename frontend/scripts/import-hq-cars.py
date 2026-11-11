"""Import generated HQ car photos into public/images/cars as white-studio PNGs."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

ASSETS = Path(
    r"C:\Users\Dart\.cursor\projects\c-Users-Dart-Desktop-projects-Lastik-shop-lastik-shop\assets"
)
OUT = Path(__file__).resolve().parents[1] / "public" / "images" / "cars"
OUT.mkdir(parents=True, exist_ok=True)

MAP = {
    "peugeot-206.png": "peugeot-206-hq.jpg",
    "peugeot-206-sd.png": "peugeot-206-sd-hq.jpg",
    "peugeot-207.png": "peugeot-207-hq.jpg",
    "peugeot-405.png": "peugeot-405-hq.jpg",
    "peugeot-pars.png": "peugeot-pars-hq.jpg",
    "pride-131.png": "pride-131-hq.jpg",
    "pride.png": "pride-hq.jpg",
    "pride-all.png": "pride-hq.jpg",
    "samand-lx.png": "samand-lx-hq.jpg",
    "tiba-hatch.png": "tiba-hatch-hq.jpg",
    "tiba-sedan.png": "tiba-sedan-hq.jpg",
    "tondar-90.png": "tondar-90-hq.jpg",
}


def to_studio(src: Path, dest: Path, tw: int = 960, th: int = 540) -> None:
    im = Image.open(src).convert("RGB")
    # trim near-white margins a bit for tighter subject
    w, h = im.size
    # keep full frame; white bg already present
    scale = min((tw - 40) / w, (th - 40) / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    resized = ImageEnhance.Sharpness(resized).enhance(1.08)

    canvas = Image.new("RGB", (tw, th), (255, 255, 255))
    ox = (tw - nw) // 2
    oy = (th - nh) // 2
    canvas.paste(resized, (ox, oy))

    # subtle shadow near bottom center
    shadow = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.ellipse((tw * 0.22, th * 0.86, tw * 0.78, th * 0.96), fill=(15, 23, 42, 22))
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    out = Image.alpha_composite(canvas.convert("RGBA"), shadow)
    out.save(dest, "PNG", optimize=True)
    print(dest.name, dest.stat().st_size)


def main():
    for dest_name, src_name in MAP.items():
        src = ASSETS / src_name
        if not src.exists():
            # try .png extension too
            alt = ASSETS / src_name.replace(".jpg", ".png")
            src = alt if alt.exists() else src
        if not src.exists():
            print("missing", src_name)
            continue
        to_studio(src, OUT / dest_name)

    # make logos
    for src, dest in [
        ("peugeot-206.png", "peugeot-make.png"),
        ("pride-131.png", "saipa-make.png"),
        ("samand-lx.png", "ikco-make.png"),
    ]:
        s = OUT / src
        if s.exists():
            Image.open(s).save(OUT / dest, "PNG", optimize=True)


if __name__ == "__main__":
    main()
