import { deletePhoto, savePhotoCaption } from "@/app/admin/actions";
import { PhotoUploader } from "./PhotoUploader";
import { DangerSubmitButton, SubmitButton } from "./SubmitButton";
import { field } from "@/components/ui/styles";
import { thumbUrl } from "@/lib/format";
import { isDemoMode } from "@/lib/supabase/env";
import type { Photo } from "@/lib/types";

export function PhotoManager({
  cityId,
  caseId = null,
  photos,
}: {
  cityId: string;
  caseId?: string | null;
  photos: Photo[];
}) {
  return (
    <div>
      {isDemoMode() ? (
        <p className="rounded-lg border border-dashed border-line-strong bg-panel/40 px-3.5 py-3 text-sm text-muted">
          Subir fotos necesita Storage. Con datos de muestra no hay dónde guardarlas.
        </p>
      ) : (
        <PhotoUploader cityId={cityId} caseId={caseId} />
      )}

      {photos.length > 0 && (
        <ul className="mt-5 space-y-3">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className="flex gap-3 rounded-xl border border-line bg-panel/60 p-3"
            >
              <img
                src={thumbUrl(photo)}
                alt=""
                loading="lazy"
                className="size-20 shrink-0 rounded-md object-cover"
              />

              <div className="min-w-0 flex-1">
                <form action={savePhotoCaption} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={photo.id} />
                  <label className="min-w-0 flex-1">
                    <span className={field.label}>Pie de foto</span>
                    <input
                      name="caption"
                      defaultValue={photo.caption}
                      className={field.input}
                      placeholder="Qué se ve en la foto"
                    />
                  </label>
                  <label className="w-20">
                    <span className={field.label}>Orden</span>
                    <input
                      name="sort_order"
                      type="number"
                      defaultValue={photo.sort_order}
                      className={field.input}
                    />
                  </label>
                  <SubmitButton variant="secondary">Guardar</SubmitButton>
                </form>

                <form action={deletePhoto} className="mt-2">
                  <input type="hidden" name="id" value={photo.id} />
                  <input type="hidden" name="storage_path" value={photo.storage_path} />
                  <input type="hidden" name="thumb_path" value={photo.thumb_path} />
                  <DangerSubmitButton confirmText="¿Borrar esta foto?">
                    Borrar foto
                  </DangerSubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
