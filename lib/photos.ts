/**
 * Compresión en el navegador antes de subir.
 *
 * En Chocó la subida es el cuello de botella: una foto de iPhone son 3-5 MB y
 * con mala señal no llega. Reducirla al lado largo de 1600 px y JPEG 0.82 la
 * deja en 150-400 KB. 0.82 es la misma calidad que el script de fotos de un
 * caso (`scripts/build-case-photos.py`): por debajo se nota el bloqueo en una
 * fachada a contraluz; por encima se pagan kilobytes que la pantalla no enseña.
 *
 * De cada foto se guardan dos versiones. Las cuadrículas y las tarjetas muestran
 * imágenes de 80 a 380 px: servirles el original de 300 KB multiplicaba por diez
 * el tráfico de las páginas de lista, que son justo las más visitadas.
 *
 * El canvas no copia EXIF ni GPS. Eso importa: el bucket es público y una foto
 * de una vivienda no puede llevar las coordenadas encima.
 */

const FULL_EDGE = 1600;
const FULL_QUALITY = 0.82;
const THUMB_EDGE = 400;
const THUMB_QUALITY = 0.78;

export type PreparedPhoto = {
  full: Blob;
  /** Nulo si el navegador no pudo generarla; entonces se usa la grande. */
  thumb: Blob | null;
  extension: string;
  originalSize: number;
};

function isJpeg(file: File): boolean {
  return file.type === "image/jpeg" || file.type === "image/jpg" || /\.jpe?g$/i.test(file.name);
}

async function drawToBlob(
  bitmap: ImageBitmap,
  maxEdge: number,
  quality: number,
): Promise<Blob | null> {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext("2d");
  if (!context) return null;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function prepareImage(file: File): Promise<PreparedPhoto> {
  // Los HEIC de iPhone no los decodifica el canvas en todos los navegadores.
  // Si algo falla, se sube el original antes que perder la foto.
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const [full, thumb] = await Promise.all([
      drawToBlob(bitmap, FULL_EDGE, FULL_QUALITY),
      drawToBlob(bitmap, THUMB_EDGE, THUMB_QUALITY),
    ]);
    bitmap.close();

    if (!full) throw new Error("no se pudo comprimir");

    // Un JPEG que ya es más ligero que el recodificado se deja: recodificar
    // no lo aclara y sí lo hincha. Un PNG o un HEIC decodificado siempre pasa
    // a JPEG, aunque el original pesara menos: el PNG de un visor de iPhone
    // trae franjas y metadatos que no queremos publicar.
    if (full.size >= file.size && isJpeg(file)) {
      return {
        full: file,
        thumb,
        extension: extensionOf(file.name),
        originalSize: file.size,
      };
    }
    return { full, thumb, extension: "jpg", originalSize: file.size };
  } catch {
    return {
      full: file,
      thumb: null,
      extension: extensionOf(file.name),
      originalSize: file.size,
    };
  }
}

function extensionOf(filename: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
  return match ? match[1].toLowerCase() : "jpg";
}

/** Rutas de la pareja de archivos: ciudad/[caso]/aleatorio.ext y su miniatura. */
export function storagePathsFor(
  cityId: string,
  caseId: string | null,
  extension: string,
): { full: string; thumb: string } {
  const id = crypto.randomUUID();
  const folder = caseId ? `${cityId}/casos/${caseId}` : cityId;
  return {
    full: `${folder}/${id}.${extension}`,
    thumb: `${folder}/${id}-mini.jpg`,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
