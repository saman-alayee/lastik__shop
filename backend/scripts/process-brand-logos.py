"""Knock out solid white/black backgrounds from brand logos -> transparent PNG."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "frontend" / "public" / "images" / "brands" / "_raw"
OUT = ROOT / "frontend" / "public" / "images" / "brands"


def near(c: int, target: int, tol: int) -> bool:
    return abs(c - target) <= tol


def knock_color(
    img: Image.Image,
    *,
    mode: str,
    tol: int = 28,
    soft: int = 18,
) -> Image.Image:
    """mode: 'white' | 'black' | 'both' — make near-bg pixels transparent."""
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            kill = False
            if mode in ("white", "both"):
                if near(r, 255, tol) and near(g, 255, tol) and near(b, 255, tol):
                    kill = True
                elif min(r, g, b) > 255 - soft and max(r, g, b) - min(r, g, b) < 12:
                    kill = True
            if mode in ("black", "both") and not kill:
                if near(r, 0, tol) and near(g, 0, tol) and near(b, 0, tol):
                    kill = True
                elif max(r, g, b) < soft and max(r, g, b) - min(r, g, b) < 10:
                    kill = True
            if kill:
                px[x, y] = (r, g, b, 0)
    return rgba


def trim(img: Image.Image, pad: int = 8) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(img.width, r + pad)
    b = min(img.height, b + pad)
    return img.crop((l, t, r, b))


def save(img: Image.Image, name: str) -> None:
    out = OUT / name
    img = trim(img)
    # Cap width for UI
    if img.width > 900:
        h = int(img.height * (900 / img.width))
        img = img.resize((900, max(1, h)), Image.Resampling.LANCZOS)
    img.save(out, "PNG")
    print(f"ok {out.name} {img.size}")


def rasterize_svg(svg_path: Path, scale: int = 4) -> Image.Image | None:
    """Best-effort SVG -> PNG via cairosvg, else None."""
    try:
        import cairosvg  # type: ignore
        import io

        png = cairosvg.svg2png(url=str(svg_path), scale=scale)
        return Image.open(io.BytesIO(png)).convert("RGBA")
    except Exception as exc:  # noqa: BLE001
        print(f"svg rasterize skip: {exc}")
        return None


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    # Hankook — black plate -> transparent (orange icon + gray text remain)
    hankook = Image.open(RAW / "hankook-lw.png")
    save(knock_color(hankook, mode="black", tol=22), "hankook-transparent.png")

    # Kumho — prefer white-bg wordmark; fallback black plate
    kumho_src = RAW / "kumho-logodev.png"
    if not kumho_src.exists() or kumho_src.stat().st_size < 1000:
        kumho_src = RAW / "kumho-lw.png"
        kumho = knock_color(Image.open(kumho_src), mode="black", tol=22)
    else:
        kumho = knock_color(Image.open(kumho_src), mode="white", tol=30)
    save(kumho, "kumho-transparent.png")

    # Kavir — black plate, keep blue/red/white mark
    kavir = knock_color(Image.open(RAW / "kavir.png"), mode="black", tol=18)
    save(kavir, "kavir-transparent.png")

    # Iran Tire — google cutout (prefer g2); knock residual white
    iran_src = RAW / "irantire-g2.jpg"
    if not iran_src.exists():
        iran_src = RAW / "irantire-g1.jpg"
    iran = knock_color(Image.open(iran_src), mode="white", tol=32)
    save(iran, "iran-tire-transparent.png")

    # Yazd — official SVG if possible, else icon
    yazd_svg = RAW / "yazd.svg"
    yazd_img = rasterize_svg(yazd_svg) if yazd_svg.exists() else None
    if yazd_img is None:
        yazd_img = Image.open(RAW / "yazd-icon.png").convert("RGBA")
    # SVG already transparent; icon may have white
    yazd_img = knock_color(yazd_img, mode="white", tol=24)
    save(yazd_img, "yazd-transparent.png")
    # Also keep SVG for crisp UI
    if yazd_svg.exists():
        (OUT / "yazd.svg").write_bytes(yazd_svg.read_bytes())
        print("ok yazd.svg")


if __name__ == "__main__":
    main()
