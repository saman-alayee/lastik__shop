"""
Compose white product-card images with brand logo + size + فاق overlays.
Always uses original Digikala/catalog sources (never re-composites card outputs).
Run: python scripts/compose-tire-card-images.py
"""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
FRONTEND_PUBLIC = ROOT / "frontend" / "public"
NEXEN_DIR = FRONTEND_PUBLIC / "images" / "products" / "nexen"
OUT_DIR = NEXEN_DIR / "cards"
LOGO = FRONTEND_PUBLIC / "images" / "brands" / "nexen-transparent.png"
LOGO_FALLBACK = FRONTEND_PUBLIC / "images" / "brands" / "nexen.png"
DB = ROOT / "backend" / "prisma" / "dev.db"
INV = ROOT / "backend" / "prisma" / "data" / "nexen-hamidavi-inventory.json"

CARD = 900
PERSIAN = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")

# Only Digikala tire cutouts (no truck / warehouse lifestyle photos).
PATTERN_SRC = {
    "NBLUE HD PLUS": NEXEN_DIR / "dk-nblue-3.jpg",
    "NPRIZ AH8": NEXEN_DIR / "dk-npriz-ah8.jpg",
    "NPRIZ RH7": NEXEN_DIR / "dk-npriz-ah5.jpg",
    "NFERA AU7": NEXEN_DIR / "dk-nfera-au7.jpg",
    "NFERA SU1": NEXEN_DIR / "dk-nfera-su1.jpg",
    "NFERA SUPREME": NEXEN_DIR / "dk-nfera-au7.jpg",
    "NFERA RU1": NEXEN_DIR / "dk-nfera-su1.jpg",
    "NFERA": NEXEN_DIR / "dk-nfera-su1.jpg",
    "ROHTX RH5": NEXEN_DIR / "dk-nfera-su1.jpg",
    "RO542": NEXEN_DIR / "dk-nfera-au7.jpg",
    "CP671": NEXEN_DIR / "dk-npriz-ah5.jpg",
    "CP672": NEXEN_DIR / "dk-npriz-ah8.jpg",
}

FALLBACKS = [
    NEXEN_DIR / "dk-nblue-1.jpg",
    NEXEN_DIR / "dk-nblue-2.jpg",
    NEXEN_DIR / "dk-nblue-3.jpg",
    NEXEN_DIR / "dk-nblue-5.jpg",
    NEXEN_DIR / "dk-nblue-6.jpg",
    NEXEN_DIR / "dk-nblue-7.jpg",
    NEXEN_DIR / "dk-nblue-8.jpg",
    NEXEN_DIR / "dk-npriz-ah8.jpg",
    NEXEN_DIR / "dk-nfera-au7.jpg",
    NEXEN_DIR / "dk-nfera-su1.jpg",
]


def fa(text: object) -> str:
    return str(text).translate(PERSIAN)


def normalize_pattern(raw: str) -> str:
    s = (
        str(raw or "")
        .strip()
        .upper()
        .replace("’", "'")
        .replace("`", "'")
        .replace("N'BLUE", "NBLUE")
        .replace("N’BLUE", "NBLUE")
        .replace("N-BLUE", "NBLUE")
        .replace("N BLUE", "NBLUE")
        .replace("N'PRIZ", "NPRIZ")
        .replace("N’PRIZ", "NPRIZ")
        .replace("N'FERA", "NFERA")
        .replace("N’FERA", "NFERA")
        .replace("NF SUPREME", "NFERA SUPREME")
        .replace("NFERA-", "NFERA ")
        .replace("ROADIAN HTX RH5", "ROHTX RH5")
        .replace("ROADIAN 542", "RO542")
    )
    while "  " in s:
        s = s.replace("  ", " ")
    return s.strip()


def font(size: int) -> ImageFont.ImageFont:
    for name in ("arial.ttf", "segoeui.ttf", "tahoma.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def source_for(pattern: str, index: int) -> Path:
    key = normalize_pattern(pattern)
    path = PATTERN_SRC.get(key)
    if path and path.exists() and path.name.startswith("dk-"):
        return path
    available = [fb for fb in FALLBACKS if fb.exists()]
    if not available:
        raise FileNotFoundError("No Digikala tire-only images found")
    return available[index % len(available)]


def fit_on_white(src: Image.Image, size: int = CARD) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    img = src.convert("RGBA")
    img.thumbnail((int(size * 0.86), int(size * 0.74)), Image.Resampling.LANCZOS)
    x = (size - img.width) // 2
    y = max(88, (size - img.height) // 2 - 36)
    canvas.alpha_composite(img, (x, y))
    return canvas


def draw_logo_and_size(canvas: Image.Image, size_label: str) -> None:
    """Bottom-center row: transparent brand logo + size pill (e.g. 215/55R16)."""
    draw = ImageDraw.Draw(canvas)
    f = font(44)
    text = str(size_label).replace(" ", "").upper()
    bbox = draw.textbbox((0, 0), text, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]

    logo = None
    logo_path = LOGO if LOGO.exists() else LOGO_FALLBACK
    if logo_path.exists():
        logo = Image.open(logo_path).convert("RGBA")
        # ensure dark plate is gone even if opaque PNG sneaks in
        px = logo.load()
        for yy in range(logo.height):
            for xx in range(logo.width):
                r, g, b, a = px[xx, yy]
                if r < 45 and g < 45 and b < 45:
                    px[xx, yy] = (r, g, b, 0)
        logo.thumbnail((150, 64), Image.Resampling.LANCZOS)

    icon = 32
    gap = 12
    logo_gap = 14
    pad_x, pad_y = 22, 12
    logo_w = logo.width if logo else 0
    logo_h = logo.height if logo else 0

    pill_w = tw + pad_x * 2 + icon + gap
    pill_h = max(th + pad_y * 2, 58)
    row_h = max(pill_h, logo_h)
    row_w = (logo_w + logo_gap if logo else 0) + pill_w
    x0 = (canvas.width - row_w) // 2
    y0 = canvas.height - row_h - 36

    # Transparent logo (no plate / background)
    if logo:
        ly = y0 + (row_h - logo_h) // 2
        canvas.alpha_composite(logo, (x0, ly))
        pill_x = x0 + logo_w + logo_gap
    else:
        pill_x = x0

    pill_y = y0 + (row_h - pill_h) // 2
    pill = Image.new("RGBA", (pill_w, pill_h), (0, 0, 0, 0))
    pd = ImageDraw.Draw(pill)
    pd.rounded_rectangle(
        (0, 0, pill_w - 1, pill_h - 1),
        radius=pill_h // 2,
        fill=(255, 255, 255, 250),
        outline=(226, 232, 240, 255),
        width=2,
    )
    cx, cy = 18 + icon // 2, pill_h // 2
    pd.ellipse((cx - icon // 2, cy - icon // 2, cx + icon // 2, cy + icon // 2), fill=(220, 38, 38, 255))
    pd.ellipse((cx - 8, cy - 8, cx + 8, cy + 8), outline=(255, 255, 255, 235), width=3)
    pd.text((18 + icon + gap, (pill_h - th) // 2 - 2), text, fill=(15, 23, 42, 255), font=f)
    canvas.alpha_composite(pill, (pill_x, pill_y))


def compose(src_path: Path, size_label: str, out_path: Path) -> None:
    canvas = fit_on_white(Image.open(src_path))
    draw_logo_and_size(canvas, size_label)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(out_path, "JPEG", quality=90, optimize=True)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    inv_by_sku = {str(r["sku"]): r for r in json.loads(INV.read_text(encoding="utf-8"))}
    if not DB.exists():
        raise SystemExit(f"DB not found: {DB}")

    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    products = con.execute(
        """
        select id, name, tireSizeLabel, tireAspect, tirePattern, tireMeta
        from products
        where isActive = 1
        """
    ).fetchall()

    mapping: list[tuple[str, str]] = []
    for index, p in enumerate(products):
        meta = {}
        try:
            meta = json.loads(p["tireMeta"] or "{}")
        except Exception:
            meta = {}
        sku = str(meta.get("sku") or "")
        inv = inv_by_sku.get(sku, {})
        size = p["tireSizeLabel"] or inv.get("size") or ""
        pattern = p["tirePattern"] or inv.get("pattern") or meta.get("pattern") or ""
        if not size:
            print("skip", p["name"])
            continue
        src = source_for(str(pattern), index)
        out_name = f"{sku or p['id'][-8:]}-{size.replace('/', '-')}.jpg"
        out_path = OUT_DIR / out_name
        compose(src, size, out_path)
        rel = f"/images/products/nexen/cards/{out_name}"
        mapping.append((rel, p["id"]))
        con.execute("update products set image = ? where id = ?", (rel, p["id"]))
        print("ok", out_name, "<-", src.name)

    con.commit()
    con.close()
    (OUT_DIR / "manifest.json").write_text(json.dumps(mapping, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Composed {len(mapping)} card images")


if __name__ == "__main__":
    main()
