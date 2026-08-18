"use client";

import { registerPhoto } from "@/app/admin/actions";
import { PHOTO_BUCKET } from "@/lib/constants";
import { prepareImage, storagePathsFor } from "@/lib/photos";
import type { PhotoFrame } from "@/lib/photo-frame";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Comprime en el navegador y deja la foto registrada en el caso.
 *
 * Es el mismo camino que el subidor de la galería: el archivo no pasa por
 * Next. Devuelve el identificador para colgarlo del avance.
 */
export async function uploadCasePhoto(
  file: File,
  cityId: string,
  caseId: string,
  frame: PhotoFrame | null = null,
): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const { full, thumb, extension } = await prepareImage(file);
  const paths = storagePathsFor(cityId, caseId, extension);

  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(paths.full, full, {
    contentType: full.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  let thumbPath = "";
  if (thumb) {
    const upload = await supabase.storage.from(PHOTO_BUCKET).upload(paths.thumb, thumb, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (!upload.error) thumbPath = paths.thumb;
  }

  return registerPhoto({
    cityId,
    caseId,
    storagePath: paths.full,
    thumbPath,
    frame,
  });
}
