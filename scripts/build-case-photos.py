"""Prepara las fotos de un caso real: quita las franjas, reduce, y borra los metadatos.

Hermano de build-demo-photos.py, con dos diferencias que importan:

  * **No estampa el sello «muestra».** El sello existe para que una imagen de
    archivo no pueda pasar por documentación del terremoto. Estas fotos SON la
    documentación: ponérselo sería mentir al revés.

  * **Borra los metadatos.** Las de muestra salen de un generador y no traen
    nada; estas salen de un móvil. Un móvil escribe dentro del archivo dónde se
    tomó la foto, con qué aparato y a qué hora, y el bucket `fotos` es público:
    la URL de una foto es también la descarga del archivo entero. Publicar las
    coordenadas de la vivienda de una persona a la que además se nombra, en un
    territorio con actores armados, es el daño más grande que puede hacer este
    script. Ver `sin_metadatos()` y `comprueba()`.

Uso:
    python3 scripts/build-case-photos.py <carpeta-de-origen> \
        [--retrato IMG_1450.PNG] [--salida CARPETA] \
        [--ciudad UUID] [--caso UUID] [--rehacer]

De cada foto salen dos JPEG que comparten un nombre aleatorio —el grande y su
`-mini`—, que es la pareja que espera `thumbUrl()` de lib/format.ts, más un
`manifiesto.json` con las rutas de Storage listas para insertar en
`public.photos`.

Sin `--ciudad` y `--caso` el manifiesto deja esas rutas en nulo. Es a propósito:
la carpeta de Storage es la que ataca la política `fotos_team_insert`
(`<city_id>/casos/<case_id>/…`), así que una carpeta inventada no es un nombre
feo, es la foto de una persona colgada del municipio equivocado.

La salida NO va al repositorio, y por omisión se escribe en
`<origen>/procesadas`: son personas identificables y en .gitignore no hay
ninguna regla que las tape.
"""

import argparse
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageOps, ExifTags

# Lado largo de cada versión y su calidad JPEG. Las cifras son las de
# build-demo-photos.py y el motivo del peso es el de siempre: el portal se abre
# con la señal del Chocó y se comparte por WhatsApp.
#
# Lo que cambia es a qué lado se aplican. Aquel script fija el ANCHO porque sus
# imágenes son horizontales; estas son verticales y de 1320 px de ancho, así que
# fijar el ancho en 1600 las estiraría: detalle inventado pagado en kilobytes.
# Se limita el lado largo y nunca se amplía, que es exactamente lo que hace
# `lib/photos.ts` con cada foto que el equipo sube desde el móvil. Para una foto
# horizontal las dos reglas dan el mismo resultado.
TAMANOS = {"": (1600, 82), "-mini": (400, 78)}

# Extensiones que puede escupir un móvil. El PNG es lo que sale del visor;
# HEIC no lo abre Pillow sin plugin y se avisa en vez de saltárselo callando.
ORIGENES = ("*.png", "*.PNG", "*.jpg", "*.JPG", "*.jpeg", "*.JPEG")

# Hasta dónde llega "esto es negro de relleno". Las franjas del visor del móvil
# son 0 exactos, pero una foto que ya haya pasado por un JPEG llega con ruido
# cerca del cero, así que se deja holgura.
NEGRO = 12

# Una franja de visor ocupa decenas de líneas. Por debajo de esto no se recorta
# nada: tres filas oscuras en el borde de una foto a contraluz son cielo, no
# franja, y comérselas sería justo el error que este script tiene que evitar.
FRANJA_MINIMA = 8

# Si después de recortar queda menos de esta parte de la imagen, el script no ha
# entendido la foto. Para, en vez de entregar un recorte absurdo con buena cara.
BANDA_MINIMA = 0.5


def _maximos_por_linea(gris: Image.Image) -> list[int]:
    """El píxel más claro de cada fila, sobre los bytes crudos porque hay miles."""
    ancho, alto = gris.size
    datos = gris.tobytes()
    return [max(datos[y * ancho : (y + 1) * ancho]) for y in range(alto)]


def _tramos_con_contenido(maximos: list[int]) -> list[tuple[int, int]]:
    """Tramos seguidos de línea en los que algún píxel pasa de NEGRO."""
    tramos: list[tuple[int, int]] = []
    inicio = None
    for i, maximo in enumerate(maximos):
        if maximo > NEGRO:
            if inicio is None:
                inicio = i
        elif inicio is not None:
            tramos.append((inicio, i - 1))
            inicio = None
    if inicio is not None:
        tramos.append((inicio, len(maximos) - 1))
    return tramos


def _banda(maximos: list[int], eje: str, nombre: str) -> tuple[int, int, list[tuple[int, int]]]:
    """Dónde empieza y acaba el contenido en un eje, y qué islas quedan fuera.

    No vale quedarse con la primera y la última línea que no son negras. En
    IMG_1440 el visor dejó visible la barra gris de inicio del iPhone: una isla
    de 14 filas pegada al borde de abajo y separada de la foto por 220 filas de
    negro. Con el primer y el último no-negro, esa foto habría salido con 236
    filas de más y un pegote gris al pie. Se busca el tramo seguido más largo
    —que es la foto— y las islas se devuelven para poder informar de ellas.
    """
    tramos = _tramos_con_contenido(maximos)
    if not tramos:
        raise SystemExit(f"{nombre}: la imagen es negra entera en {eje}")

    cual = max(range(len(tramos)), key=lambda i: tramos[i][1] - tramos[i][0])
    mayor = tramos[cual]
    islas = [t for i, t in enumerate(tramos) if i != cual]

    total = len(maximos)
    largo = mayor[1] - mayor[0] + 1
    if largo < total * BANDA_MINIMA:
        raise SystemExit(
            f"{nombre}: en {eje} el contenido sería solo {largo} de {total} líneas. "
            "Revisa la foto a mano antes de seguir."
        )

    # Una franja tiene que ser gruesa para creerse. Si mide menos que
    # FRANJA_MINIMA no se toca ese borde: es contenido oscuro, no relleno.
    inicio = mayor[0] if mayor[0] >= FRANJA_MINIMA else 0
    fin = mayor[1] if (total - 1 - mayor[1]) >= FRANJA_MINIMA else total - 1
    return inicio, fin, islas


def recorte(img: Image.Image, nombre: str) -> tuple[tuple[int, int, int, int], dict]:
    """Mide las franjas de los cuatro lados y devuelve la caja del contenido.

    Los cuatro y no solo arriba y abajo: la misma foto girada llega con las
    franjas a los lados, y el criterio no puede depender de cómo se sostuvo el
    teléfono.
    """
    gris = img.convert("L")
    ancho, alto = gris.size

    filas = _maximos_por_linea(gris)
    arriba, abajo, islas_v = _banda(filas, "vertical", nombre)
    # Transponer y volver a medir filas es medir columnas, y sale gratis
    # comparado con recorrer la imagen por columnas en Python.
    izq, der, islas_h = _banda(
        _maximos_por_linea(gris.transpose(Image.Transpose.TRANSPOSE)), "horizontal", nombre
    )

    # Las dos líneas de cada costura, para poder demostrar que el corte cae en un
    # escalón y no a mitad de un degradado.
    costura = {
        "fuera_arriba": filas[arriba - 1] if arriba > 0 else None,
        "dentro_arriba": filas[arriba],
        "dentro_abajo": filas[abajo],
        "fuera_abajo": filas[abajo + 1] if abajo < alto - 1 else None,
    }

    medidas = {
        "franjas": {
            "arriba": arriba,
            "abajo": alto - 1 - abajo,
            "izquierda": izq,
            "derecha": ancho - 1 - der,
        },
        "contenido": [der - izq + 1, abajo - arriba + 1],
        "costura": costura,
        "islas_descartadas": [
            {"eje": eje, "desde": a, "hasta": b, "lineas": b - a + 1}
            for eje, tramos in (("vertical", islas_v), ("horizontal", islas_h))
            for a, b in tramos
        ],
    }
    return (izq, arriba, der + 1, abajo + 1), medidas


def metadatos_de(ruta: Path) -> dict:
    """Qué trae el original, para poder decir qué se ha quitado.

    Solo los NOMBRES de las etiquetas. Si hay GPS, lo que hay que saber es que
    estaba: copiar las coordenadas a un informe o a un manifiesto sería mudar el
    problema de sitio, que es precisamente lo que este script viene a evitar.
    """
    img = Image.open(ruta)
    exif = img.getexif()
    etiquetas = sorted(ExifTags.TAGS.get(t, str(t)) for t in exif)

    gps = {}
    try:
        gps = exif.get_ifd(ExifTags.IFD.GPSInfo)
    except Exception:  # noqa: BLE001 — un EXIF roto no puede parar el proceso
        gps = {}

    interno = {}
    try:
        interno = exif.get_ifd(ExifTags.IFD.Exif)
    except Exception:  # noqa: BLE001
        interno = {}

    return {
        "exif": etiquetas,
        "exif_interno": sorted(ExifTags.TAGS.get(t, str(t)) for t in interno),
        "gps": sorted(ExifTags.GPSTAGS.get(t, str(t)) for t in gps),
        "xmp": "xmp" in img.info or "XML:com.adobe.xmp" in img.info,
        "icc": "icc_profile" in img.info,
        "dpi": bool(img.info.get("dpi")),
        "otros": sorted(k for k in img.info if k not in ("exif", "xmp", "XML:com.adobe.xmp", "icc_profile", "dpi")),
    }


def sin_metadatos(img: Image.Image) -> Image.Image:
    """La misma imagen sin nada colgando de ella.

    Pillow no escribe el EXIF si no se lo pasas, pero `info` viaja de una
    operación a la siguiente y de ahí se han escapado XMP e ICC más de una vez,
    en esta y en otras librerías. Reconstruir la imagen desde sus píxeles deja
    `info` vacío por construcción: no queda nada que se pueda colar por
    descuido. Es la diferencia entre confiar en la librería y no necesitar
    confiar en ella.
    """
    return Image.frombytes(img.mode, img.size, img.tobytes())


# Marcadores JPEG que no llevan carga y por tanto no ocupan longitud.
SIN_CARGA = {0xD8, 0xD9, 0x01, *range(0xD0, 0xD8)}
SOS = 0xDA
SOF = {0xC0, 0xC1, 0xC2}
NOMBRES = {0xE0: "APP0", 0xE1: "APP1", 0xE2: "APP2", 0xED: "APP13", 0xEE: "APP14", 0xFE: "COM"}


def marcadores(ruta: Path) -> list[tuple[int, bytes]]:
    """Los marcadores de la cabecera del JPEG, hasta el inicio de los datos.

    Se lee el archivo terminado y no el objeto que había en memoria: lo que hay
    que comprobar es lo que se va a subir. Y se para en SOS a propósito: más allá
    empiezan los datos comprimidos, donde tres bytes que digan "GPS" son una
    casualidad estadística y no un metadato, y buscarlos ahí solo produce
    sustos falsos.
    """
    datos = ruta.read_bytes()
    if datos[:2] != b"\xff\xd8":
        raise SystemExit(f"{ruta.name}: no ha salido un JPEG")

    encontrados: list[tuple[int, bytes]] = []
    i = 2
    while i < len(datos) - 1 and datos[i] == 0xFF:
        marca = datos[i + 1]
        if marca in SIN_CARGA:
            i += 2
            continue
        largo = int.from_bytes(datos[i + 2 : i + 4], "big")
        encontrados.append((marca, datos[i + 4 : i + 2 + largo]))
        if marca == SOS:
            break
        i += 2 + largo
    return encontrados


def comprueba(ruta: Path, ancho: int, alto: int) -> dict:
    """Abre el archivo escrito y comprueba que está limpio. Si no, para.

    Verificar leyendo es el único modo honesto: que la librería prometa no
    copiar metadatos no es lo mismo que mirar los bytes que se van a publicar.
    """
    img = Image.open(ruta)
    if img.size != (ancho, alto):
        raise SystemExit(f"{ruta.name}: mide {img.size} y debería medir {(ancho, alto)}")
    if img.getexif():
        raise SystemExit(f"{ruta.name}: sigue habiendo EXIF")
    sobra = {"exif", "xmp", "XML:com.adobe.xmp", "icc_profile", "comment", "photoshop"} & set(img.info)
    if sobra:
        raise SystemExit(f"{ruta.name}: sigue habiendo {', '.join(sorted(sobra))}")

    cabecera = marcadores(ruta)
    submuestreo = None
    for marca, carga in cabecera:
        # APP0 es la cabecera JFIF: versión, unidad de densidad y un par de
        # ceros donde iría una miniatura. Es del formato, no de la foto: no dice
        # nada de quién, cuándo ni dónde, y quitarla es buscarle las cosquillas
        # a decodificadores viejos por cero ganancia. Cualquier otro APPn sí es
        # metadato —APP1 es EXIF y XMP, APP2 el perfil ICC, APP13 IPTC— y no
        # puede quedar ninguno.
        if marca in NOMBRES and marca != 0xE0:
            raise SystemExit(f"{ruta.name}: ha quedado un {NOMBRES[marca]} de {len(carga)} bytes")
        if marca in SOF:
            componentes = carga[5]
            submuestreo = [
                (carga[7 + c * 3] >> 4, carga[7 + c * 3] & 0x0F) for c in range(componentes)
            ]

    # 4:2:0 es luminancia entera y color a la mitad en los dos ejes: (2,2) para
    # la Y y (1,1) para las dos de color. Se comprueba en el archivo porque el
    # valor por omisión de la librería depende de su versión.
    if submuestreo != [(2, 2), (1, 1), (1, 1)]:
        raise SystemExit(f"{ruta.name}: el submuestreo es {submuestreo} y no 4:2:0")

    return {
        "marcadores": [NOMBRES.get(m, f"0x{m:02X}") for m, _ in cabecera],
        "app0_bytes": next((len(c) for m, c in cabecera if m == 0xE0), 0),
        "submuestreo": "4:2:0",
        "bytes": ruta.stat().st_size,
    }


def prepara(origen: Path, salida: Path, identificador: str) -> dict:
    """Una foto de origen -> el JPEG grande y su miniatura, ya limpios."""
    bruto = Image.open(origen)

    # La orientación se aplica al píxel ANTES de borrar la etiqueta. Al revés,
    # un retrato tumbado se publicaría tumbado: la etiqueta era lo único que lo
    # ponía derecho y la vamos a tirar.
    derecho = ImageOps.exif_transpose(bruto).convert("RGB")

    caja, medidas = recorte(derecho, origen.name)
    contenido = sin_metadatos(derecho.crop(caja))

    archivos = {}
    for sufijo, (lado, calidad) in TAMANOS.items():
        escala = min(1, lado / max(contenido.size))
        ancho = max(1, round(contenido.width * escala))
        alto = max(1, round(contenido.height * escala))
        version = contenido.resize((ancho, alto), Image.LANCZOS) if escala < 1 else contenido

        destino = salida / f"{identificador}{sufijo}.jpg"
        version.save(
            destino,
            "JPEG",
            quality=calidad,
            subsampling=2,  # 4:2:0
            optimize=True,
            # Progresivo: con mala señal la foto se ve entera y borrosa antes de
            # verse nítida, en vez de aparecer por franjas de arriba abajo.
            progressive=True,
        )
        archivos[sufijo or "grande"] = {
            "archivo": destino.name,
            "tamano": [ancho, alto],
            **comprueba(destino, ancho, alto),
        }

    return {"medidas": medidas, "versiones": archivos, "metadatos_origen": metadatos_de(origen)}


def main() -> int:
    partes = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    partes.add_argument("origen", type=Path, help="carpeta con las fotos tal como llegaron")
    partes.add_argument("--retrato", help="archivo de origen que es el retrato de la persona")
    partes.add_argument("--salida", type=Path, help="por omisión, <origen>/procesadas")
    partes.add_argument("--ciudad", help="city_id del municipio, para escribir las rutas de Storage")
    partes.add_argument("--caso", help="case_id del caso, para escribir las rutas de Storage")
    partes.add_argument("--rehacer", action="store_true", help="permite escribir sobre una salida que ya tiene fotos")
    args = partes.parse_args()

    if not args.origen.is_dir():
        print(f"No existe la carpeta {args.origen}")
        return 1

    fuentes = sorted({p for patron in ORIGENES for p in args.origen.glob(patron)})
    if not fuentes:
        print(f"No hay imágenes en {args.origen}. ¿Son HEIC? Pillow no los abre sin plugin.")
        return 1

    if args.retrato and not (args.origen / args.retrato).exists():
        print(f"El retrato {args.retrato} no está en {args.origen}")
        return 1

    salida = args.salida or args.origen / "procesadas"
    salida.mkdir(parents=True, exist_ok=True)
    # Los nombres son aleatorios, así que volver a correr el script no
    # sobreescribe: apila una tanda nueva junto a la vieja y ya no se sabe cuál
    # es la que está subida. Mejor negarse.
    if any(salida.glob("*.jpg")) and not args.rehacer:
        print(f"{salida} ya tiene fotos. Usa --rehacer si de verdad quieres otra tanda.")
        return 1

    # El retrato primero: es la foto que manda en la tarjeta del municipio, y el
    # resto es el carrusel en orden de archivo.
    if args.retrato:
        fuentes = sorted(fuentes, key=lambda p: (p.name != args.retrato, p.name))

    carpeta = f"{args.ciudad}/casos/{args.caso}" if args.ciudad and args.caso else None

    fotos = []
    for orden, origen in enumerate(fuentes):
        identificador = str(uuid.uuid4())
        resultado = prepara(origen, salida, identificador)

        grande = resultado["versiones"]["grande"]["archivo"]
        mini = resultado["versiones"]["-mini"]["archivo"]
        fotos.append(
            {
                "orden": orden,
                "origen": origen.name,
                "retrato": origen.name == args.retrato,
                "id": identificador,
                # Las dos columnas de public.photos. Nulas mientras no se sepa el
                # municipio: la carpeta es lo que ata la foto a su ciudad.
                "storage_path": f"{carpeta}/{grande}" if carpeta else None,
                "thumb_path": f"{carpeta}/{mini}" if carpeta else None,
                **resultado,
            }
        )

        franjas = resultado["medidas"]["franjas"]
        print(
            f"{origen.name} -> {grande}  "
            f"franjas {franjas['arriba']}/{franjas['abajo']}/{franjas['izquierda']}/{franjas['derecha']}  "
            f"{resultado['versiones']['grande']['tamano']} {resultado['versiones']['grande']['bytes'] // 1024} KB"
            f"  + mini {resultado['versiones']['-mini']['tamano']} "
            f"{resultado['versiones']['-mini']['bytes'] // 1024} KB"
        )

    manifiesto = {
        "generado": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "origen": str(args.origen),
        "ciudad_id": args.ciudad,
        "caso_id": args.caso,
        "carpeta_storage": carpeta,
        "fotos": fotos,
    }
    (salida / "manifiesto.json").write_text(
        json.dumps(manifiesto, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    total = sum(v["bytes"] for f in fotos for v in f["versiones"].values())
    print(f"\n{len(fotos)} fotos x 2 versiones = {total // 1024} KB en total, en {salida}")
    if not carpeta:
        print("Sin --ciudad y --caso: el manifiesto queda con las rutas de Storage en nulo.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
