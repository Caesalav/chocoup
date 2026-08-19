#!/usr/bin/env python3
"""Muestrea los pixeles reales de la imagen de referencia de marca.

No estima colores a ojo: cuenta pixeles exactos, agrupa por frecuencia y
reporta los valores hex dominantes junto con su cobertura y su luminancia
relativa (WCAG). Solo lectura; no escribe en el repositorio.
"""
import collections
import sys

from PIL import Image

RUTA = sys.argv[1] if len(sys.argv) > 1 else (
    "/Users/charliedrive/.cursor/projects/Users-charliedrive-Choc-up/assets/"
    "image-205bd858-aa8c-452e-a33e-ab4998514cc0.png"
)


def luminancia(rgb):
    def canal(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (canal(x) for x in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contraste(a, b):
    la, lb = luminancia(a), luminancia(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def hexa(rgb):
    return "#{:02x}{:02x}{:02x}".format(*rgb)


img = Image.open(RUTA).convert("RGB")
w, h = img.size
print(f"archivo: {RUTA}")
print(f"tamano: {w}x{h}  pixeles: {w*h}")
print()

pix = img.load()
cuenta = collections.Counter(img.getdata())
total = w * h

print("=== COLORES EXACTOS MAS FRECUENTES (>=0.4% de la imagen) ===")
print(f"{'hex':>9} {'rgb':>16} {'%':>7} {'lum':>7} {'vs blanco':>10} {'vs negro':>9}")
for rgb, n in cuenta.most_common(40):
    pct = 100.0 * n / total
    if pct < 0.4:
        break
    print(
        f"{hexa(rgb):>9} {str(rgb):>16} {pct:6.2f}% {luminancia(rgb):7.4f}"
        f" {contraste(rgb,(255,255,255)):9.2f}:1 {contraste(rgb,(0,0,0)):8.2f}:1"
    )

print()
print("=== SONDAS PUNTUALES (media de un cuadro 9x9 centrado) ===")


def sonda(nombre, x, y, k=4):
    ac = [0, 0, 0]
    n = 0
    for dy in range(-k, k + 1):
        for dx in range(-k, k + 1):
            xx, yy = min(max(x + dx, 0), w - 1), min(max(y + dy, 0), h - 1)
            p = pix[xx, yy]
            ac[0] += p[0]
            ac[1] += p[1]
            ac[2] += p[2]
            n += 1
    m = tuple(round(c / n) for c in ac)
    print(f"{nombre:<38} ({x:4d},{y:4d}) {hexa(m)}  {m}  lum {luminancia(m):.4f}")
    return m


# Coordenadas elegidas mirando la retícula de la lámina de referencia.
sonda("tarjeta logo: fondo verde bosque", 120, 100)
sonda("tarjeta logo: fondo verde bosque (bajo)", 430, 270)
sonda("tarjeta logo: cinta ondulada media", 300, 100)
sonda("tarjeta logo: cinta ondulada media (2)", 262, 275)
sonda("tarjeta logo: tinta clara del logotipo", 268, 205)
sonda("icono: fondo lima", 530, 100)
sonda("icono: fondo lima (2)", 700, 250)
sonda("icono: trazo verde bosque", 612, 240)
sonda("tarjeta lavanda: fondo", 110, 350)
sonda("tarjeta lavanda: fondo (2)", 270, 520)
sonda("tarjeta lavanda: titular oscuro", 104, 465)
sonda("tarjeta producto: fondo lima", 340, 330)
sonda("tarjeta producto: cinta media", 420, 350)
sonda("tarjeta producto: titular oscuro", 345, 465)
sonda("lienzo exterior (papel)", 20, 20)
sonda("lienzo exterior (papel, abajo)", 400, 600)

print()
print("=== BUSQUEDA DEL VERDE MEDIO DE LAS CINTAS ===")
# El verde medio vive en la tarjeta oscura entre x 80..470, y 70..295.
recorte = img.crop((80, 70, 470, 295))
c2 = collections.Counter(recorte.getdata())
for rgb, n in c2.most_common(8):
    print(f"  {hexa(rgb)} {rgb} {100.0*n/(recorte.size[0]*recorte.size[1]):6.2f}%")

print()
print("=== VERDE 'fresh herbs' (acento sobre lavanda) ===")
recorte = img.crop((155, 452, 285, 478))
c3 = collections.Counter(recorte.getdata())
for rgb, n in c3.most_common(6):
    print(f"  {hexa(rgb)} {rgb} {100.0*n/(recorte.size[0]*recorte.size[1]):6.2f}%")
