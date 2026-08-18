import type { CaseUpdate, Photo } from "./types";
import { savedFrame } from "./photo-frame";

/**
 * La galería de la situación: las fotos del caso que no son el retrato.
 *
 * El retrato va en la tarjeta. Las del seguimiento pueden repetirse aquí: en
 * un caso real la foto del plano o de los materiales es también foto de la
 * vivienda, y esconderla del carrusel la dejaría a medias.
 */
export function situationPhotos<T extends { id: string }>(
  photos: T[],
  portraitPhotoId: string | null,
  _updates: Array<{ photo_id: string | null }> = [],
): T[] {
  if (!portraitPhotoId) return photos;
  return photos.filter((photo) => photo.id !== portraitPhotoId);
}

/** Cuelga de cada nota la ruta de su foto, buscándola entre las del propio caso. */
export function withUpdatePhotos(
  updates: Array<Omit<CaseUpdate, "photoPath" | "photoFrame"> & { photo_id?: string | null }>,
  photos: Pick<Photo, "id" | "storage_path" | "focus_x" | "focus_y" | "zoom">[],
): CaseUpdate[] {
  const byId = new Map(photos.map((photo) => [photo.id, photo]));
  return updates.map((update) => {
    const photoId = update.photo_id ?? null;
    const photo = photoId ? (byId.get(photoId) ?? null) : null;
    return {
      ...update,
      photo_id: photoId,
      photoPath: photo?.storage_path ?? null,
      photoFrame: savedFrame(photo),
    };
  });
}
