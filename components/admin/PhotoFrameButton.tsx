"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePhotoFrame } from "@/app/admin/actions";
import { PhotoCropEditor, defaultFrame } from "./PhotoCropEditor";
import { button } from "@/components/ui/styles";
import { photoUrl } from "@/lib/format";
import { savedFrame, type PhotoFrame } from "@/lib/photo-frame";
import type { Photo } from "@/lib/types";

/**
 * Encuadrar una foto que ya está subida: mueve la ventana, no el archivo.
 */
export function PhotoFrameButton({
  photo,
  kind,
}: {
  photo: Photo;
  kind: "situation" | "portrait";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [frame, setFrame] = useState<PhotoFrame>(() => savedFrame(photo) ?? defaultFrame(kind));
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setError("");
    setFrame(savedFrame(photo) ?? defaultFrame(kind));
  }

  return (
    <>
      <button type="button" className={button.ghost} onClick={() => setOpen(true)}>
        Encuadrar
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Encuadrar fotografía"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 sm:items-center"
        >
          <div className="max-h-[92svh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-panel-high p-4 shadow-float">
            <p className="font-display text-[18px] leading-tight text-ink">Encuadrar</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              {kind === "portrait"
                ? "Así sale el retrato, recortado en redondo. Deja la cara en el círculo."
                : "Así sale en el carrusel y en el diario. Deja a la vista lo que importa."}
            </p>

            <div className="mt-4">
              <PhotoCropEditor
                src={photoUrl(photo.storage_path)}
                kind={kind}
                value={frame}
                onChange={setFrame}
              />
            </div>

            {error && <p className="mt-3 text-sm text-need-high">{error}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={`${button.primary} disabled:opacity-60`}
                disabled={pending}
                onClick={() => {
                  setError("");
                  startTransition(async () => {
                    try {
                      await savePhotoFrame({ id: photo.id, frame });
                      router.refresh();
                      setOpen(false);
                    } catch (caught) {
                      setError(
                        caught instanceof Error ? caught.message : "No se pudo guardar el encuadre.",
                      );
                    }
                  });
                }}
              >
                {pending ? "Guardando…" : "Guardar encuadre"}
              </button>
              <button
                type="button"
                className={`${button.ghost} disabled:opacity-60`}
                disabled={pending}
                onClick={() => {
                  setError("");
                  startTransition(async () => {
                    try {
                      await savePhotoFrame({ id: photo.id, frame: null });
                      router.refresh();
                      setOpen(false);
                    } catch (caught) {
                      setError(
                        caught instanceof Error ? caught.message : "No se pudo quitar el encuadre.",
                      );
                    }
                  });
                }}
              >
                Recorte automático
              </button>
              <button type="button" className={button.ghost} onClick={close} disabled={pending}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
