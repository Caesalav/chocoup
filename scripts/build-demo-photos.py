"""Prepara las imágenes de muestra del modo demostración.

Toma los PNG generados a mano, los normaliza a dos tamaños (grande y miniatura)
y les incrusta el sello "muestra". El sello va dentro de la zona que sobrevive a
los recortes cuadrado y 3:2 que hacen las galerías, así que ninguna imagen puede
acabar en pantalla sin él.

Uso: python3 scripts/build-demo-photos.py <carpeta-de-origen>
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFont

FONT = "/System/Library/Fonts/Supplemental/Georgia.ttf"
OUT = Path(__file__).resolve().parent.parent / "public" / "demo"

NAMES = [
    "choco-rio",
    "choco-pueblo",
    "choco-palafitos",
    "choco-costa",
    "choco-canoas",
    "choco-camino",
    "choco-selva",
    "choco-edificio",
]

# Ancho final de cada versión. La grande es para la vista ampliada; la miniatura
# se ve entre 80 y 380 px en cuadrículas y tarjetas.
SIZES = {"": (1600, 82), "-mini": (400, 78)}


def stamp(image: Image.Image) -> None:
    """Pone el sello abajo y centrado, con margen suficiente para el recorte 3:2."""
    width, height = image.size
    size = max(11, round(height * 0.038))
    font = ImageFont.truetype(FONT, size)

    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    left, top, right, bottom = draw.textbbox((0, 0), "muestra", font=font)
    text_width, text_height = right - left, bottom - top
    pad_x, pad_y = round(size * 0.85), round(size * 0.5)
    pill_width = text_width + pad_x * 2
    pill_height = text_height + pad_y * 2

    # 9% de margen inferior: el recorte a 3:2 se come un 5,5% por arriba y abajo.
    pill_x = (width - pill_width) / 2
    pill_y = height - height * 0.09 - pill_height

    draw.rounded_rectangle(
        (pill_x, pill_y, pill_x + pill_width, pill_y + pill_height),
        radius=pill_height / 2,
        fill=(22, 19, 15, 190),
    )
    draw.text(
        (pill_x + pad_x - left, pill_y + pad_y - top),
        "muestra",
        font=font,
        fill=(255, 253, 250, 235),
    )

    image.alpha_composite(overlay)


def build(source: Path, name: str) -> None:
    original = Image.open(source).convert("RGB")

    # El portal es oscuro: sin bajar un poco la luz y el color, las fotos saltan
    # fuera de la página en lugar de apoyarse en ella.
    original = ImageEnhance.Brightness(original).enhance(0.92)
    original = ImageEnhance.Color(original).enhance(0.9)

    for suffix, (width, quality) in SIZES.items():
        height = round(width * original.height / original.width)
        resized = original.resize((width, height), Image.LANCZOS).convert("RGBA")
        stamp(resized)
        target = OUT / f"{name}{suffix}.jpg"
        resized.convert("RGB").save(target, "JPEG", quality=quality, optimize=True, progressive=True)
        print(f"{target.relative_to(OUT.parent.parent)}  {width}x{height}  {target.stat().st_size // 1024} KB")


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2

    assets = Path(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)

    missing = [name for name in NAMES if not (assets / f"{name}.png").exists()]
    if missing:
        print(f"Faltan en {assets}: {', '.join(missing)}")
        return 1

    for name in NAMES:
        build(assets / f"{name}.png", name)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
