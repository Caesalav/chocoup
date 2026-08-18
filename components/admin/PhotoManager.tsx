import { deletePhoto, savePhotoCaption, setCasePortrait } from "@/app/admin/actions";
import { PhotoUploader } from "./PhotoUploader";
import { PhotoFrameButton } from "./PhotoFrameButton";
import { DangerSubmitButton, SubmitButton } from "./SubmitButton";
import { FramedPhoto } from "@/components/ui/Photo";
import { field, panel } from "@/components/ui/styles";
import { thumbUrl } from "@/lib/format";
import { savedFrame } from "@/lib/photo-frame";
import { isDemoMode } from "@/lib/supabase/env";
import type { Photo } from "@/lib/types";

export function PhotoManager({
  cityId,
  caseId = null,
  photos,
  portraitPhotoId = null,
}: {
  cityId: string;
  caseId?: string | null;
  photos: Photo[];
  /** La foto marcada hoy como retrato. Solo tiene sentido dentro de un caso. */
  portraitPhotoId?: string | null;
}) {
  return (
    <div>
      {isDemoMode() ? (
        <p className="rounded-lg border border-dashed border-line-strong bg-panel px-3.5 py-3 text-sm text-muted">
          Subir fotos necesita Storage. Con datos de muestra no hay dónde guardarlas.
        </p>
      ) : (
        <PhotoUploader cityId={cityId} caseId={caseId} />
      )}

      {caseId && photos.length > 0 && (
        <PortraitPicker caseId={caseId} photos={photos} portraitPhotoId={portraitPhotoId} />
      )}

      {photos.length > 0 && (
        <ul className="mt-5 space-y-3">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className="flex gap-3 rounded-xl border border-line bg-panel p-3"
            >
              <FramedPhoto
                src={thumbUrl(photo)}
                alt=""
                frame={savedFrame(photo)}
                kind={photo.id === portraitPhotoId ? "portrait" : "situation"}
                className="size-20 shrink-0 rounded-md"
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

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <PhotoFrameButton
                    photo={photo}
                    kind={photo.id === portraitPhotoId ? "portrait" : "situation"}
                  />
                  <form action={deletePhoto}>
                    <input type="hidden" name="id" value={photo.id} />
                    <input type="hidden" name="storage_path" value={photo.storage_path} />
                    <input type="hidden" name="thumb_path" value={photo.thumb_path} />
                    <DangerSubmitButton confirmText="¿Borrar esta foto?">
                      Borrar foto
                    </DangerSubmitButton>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Cuál de las fotos de esta persona la representa.
 *
 * Es una elección y no un orden: la primera foto que hace el equipo al entrar en
 * una casa es la casa, así que tomar «la primera» por retrato deja la tarjeta de
 * la familia enseñando un recorte redondo de escombros. Quien estuvo delante es
 * quien sabe cuál es.
 *
 * Va aquí, entre las fotos del caso, porque no hay nada que subir: el retrato es
 * una de estas. Un formulario propio y no una casilla dentro de las filas de
 * abajo, que ya son dos formularios cada una y los formularios no se anidan.
 *
 * Las miniaturas van RECORTADAS EN REDONDO y con `.photo-portrait`, el mismo
 * encuadre de la tarjeta pública: es lo único que deja ver antes de guardar qué se
 * va a perder por los costados. Una rejilla de cuadraditos aquí y círculos allí
 * obliga a adivinar, y con el encuadre de las situaciones —que carga hacia abajo—
 * pasaba algo peor que adivinar: se elegía sobre una vista previa decapitada que
 * no era la que iba a salir publicada.
 *
 * Se elige con radios y sin JavaScript de por medio: el aro de tinta de la
 * elegida lo pinta `peer-checked` y el envío es un formulario normal. En campo
 * esto se usa desde un móvil con la señal que haya.
 */
function PortraitPicker({
  caseId,
  photos,
  portraitPhotoId,
}: {
  caseId: string;
  photos: Photo[];
  portraitPhotoId: string | null;
}) {
  const chosen = photos.find((photo) => photo.id === portraitPhotoId) ?? null;

  return (
    <form action={setCasePortrait} className={`${panel} mt-5 p-4`}>
      <input type="hidden" name="case_id" value={caseId} />

      <fieldset>
        <legend className="font-medium text-ink">Retrato de la persona</legend>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          La foto suya que sale en la tarjeta de este municipio, recortada en redondo. Elige la
          que se le vea a ella, no la de la casa. Si ninguna sirve, deja «Sin retrato»: la
          tarjeta pone sus iniciales y se lee igual de bien.
        </p>

        <ul className="no-scrollbar mt-4 flex snap-x gap-3 overflow-x-auto pb-1">
          <li className="shrink-0 snap-start">
            <label className="block cursor-pointer text-center">
              <input
                type="radio"
                name="photo_id"
                value=""
                defaultChecked={!chosen}
                className="peer sr-only"
              />
              <span className="flex size-16 items-center justify-center rounded-full border border-dashed border-line-strong text-center text-[11px] leading-tight text-faint peer-checked:border-solid peer-checked:border-ink peer-checked:outline-2 peer-checked:outline-offset-2 peer-checked:outline-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                Sin
                <br />
                retrato
              </span>
            </label>
          </li>

          {photos.map((photo) => (
            <li key={photo.id} className="shrink-0 snap-start">
              <label className="block cursor-pointer">
                <input
                  type="radio"
                  name="photo_id"
                  value={photo.id}
                  defaultChecked={photo.id === portraitPhotoId}
                  className="peer sr-only"
                />
                <FramedPhoto
                  src={thumbUrl(photo)}
                  alt={photo.caption || "Foto sin pie"}
                  kind="portrait"
                  frame={savedFrame(photo)}
                  className="size-16 rounded-full peer-checked:outline-2 peer-checked:outline-offset-2 peer-checked:outline-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
                />
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SubmitButton variant="secondary">Guardar retrato</SubmitButton>
        <p className="text-xs text-muted">
          {chosen
            ? `Ahora mismo: ${chosen.caption || "una foto sin pie"}`
            : "Ahora mismo esta persona no tiene retrato."}
        </p>
      </div>
    </form>
  );
}
