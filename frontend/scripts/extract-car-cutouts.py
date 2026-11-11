"""Slice reference carousels into clean white-background car PNGs for the shop UI."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

ASSETS = Path(
    r"C:\Users\Dart\.cursor\projects\c-Users-Dart-Desktop-projects-Lastik-shop-lastik-shop\assets"
)
OUT = Path(__file__).resolve().parents[1] / "public" / "images" / "cars"
OUT.mkdir(parents=True, exist_ok=True)

REF1 = ASSETS / "image-308826ee-f44e-49d6-8cf2-3c3ec38be290.png"
REF2 = ASSETS / "image-be9dac82-b602-43c3-a0f1-0918e29bc4f0.png"


def to_studio_card(crop: Image.Image, tw: int = 480, th: int = 320) -> Image.Image:
    """Place car crop on pure white studio canvas (matches reference ecommerce cards)."""
    rgb = crop.convert("RGB")
    # mild sharpen after upscale
    scale = min((tw - 28) / rgb.width, (th - 36) / rgb.height)
    nw, nh = max(1, int(rgb.width * scale)), max(1, int(rgb.height * scale))
    up = rgb.resize((nw, nh), Image.Resampling.LANCZOS)
    up = ImageEnhance.Sharpness(up).enhance(1.15)
    up = ImageEnhance.Contrast(up).enhance(1.05)

    canvas = Image.new("RGB", (tw, th), (255, 255, 255))
    ox = (tw - nw) // 2
    oy = th - nh - 18
    canvas.paste(up, (ox, oy))

    # soft oval ground shadow under car
    shadow = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    cy = th - 22
    draw.ellipse((ox + 18, cy - 8, ox + nw - 18, cy + 10), fill=(15, 23, 42, 28))
    shadow = shadow.filter(ImageFilter.GaussianBlur(6))
    out = canvas.convert("RGBA")
    out = Image.alpha_composite(out, shadow)
    return out.convert("RGBA")


def slice_row(
    path: Path,
    names: list[str],
    *,
    total_slots: float,
    first_index: float = 0.0,
):
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    slot = w / total_slots
    # keep car body; drop Persian caption strip
    y0, y1 = 1, max(2, int(h * 0.74))
    print(f"{path.name} {w}x{h} slot={slot:.1f}")

    for i, name in enumerate(names):
        center = (first_index + i + 0.5) * slot
        half = slot * 0.40
        left = max(0, int(center - half))
        right = min(w, int(center + half))
        crop = img.crop((left, y0, right, y1))
        card = to_studio_card(crop)
        dest = OUT / name
        card.save(dest, "PNG", optimize=True)
        print(f"  {name}: crop={crop.size} -> {card.size} ({dest.stat().st_size}b)")


def main():
    # Screenshot 1: ~6.6 slots; 6 full cars starting at 0
    slice_row(
        REF1,
        [
            "peugeot-206-sd.png",
            "tiba-hatch.png",
            "pride.png",
            "peugeot-207.png",
            "samand-lx.png",
            "tondar-90.png",
        ],
        total_slots=6.55,
        first_index=0.0,
    )

    # Screenshot 2: ~7 slots; first is partial → start at 1
    slice_row(
        REF2,
        [
            "peugeot-pars.png",
            "peugeot-405.png",
            "tiba-sedan.png",
            "pride-all.png",
            "peugeot-206.png",
            "pride-131.png",
        ],
        total_slots=7.0,
        first_index=1.0,
    )

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
