"use client";

import { useRef, useState, type DragEvent } from "react";
import { PhotoCropEditor, defaultFrame } from "./PhotoCropEditor";
import { FramedPhoto } from "@/components/ui/Photo";
import { button } from "@/components/ui/styles";
import { type PhotoFrame } from "@/lib/photo-frame";

export type DraftPhoto = {
  key: string;
  file: File;
  url: string;
  frame: PhotoFrame | null;
};

/**
 * Las fotos del primer día, antes de que el caso exista.
 *
 * No se suben aquí: se eligen, se ven, se encuadran y se marca cuál es el
 * retrato. La subida va después de crear la causa, porque Storage las cuelga de
 * su identificador. El retrato es una elección y no «la primera»: en campo la
 * primera foto suele ser la casa, y esa no es la cara que tiene que salir en la
 * tarjeta.
 */
export function CasePhotoDrafts({
  photos,
  portraitKey,
  onAdd,
  onRemove,
  onPortrait,
  onFrame,
  disabled = false,
}: {
  photos: DraftPhoto[];
  portraitKey: string | null;
  onAdd: (files: File[]) => void;
  onRemove: (key: string) => void;
  onPortrait: (key: string | null) => void;
  onFrame: (key: string, frame: PhotoFrame | null) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [cropping, setCropping] = useState<string | null>(null);

  function take(list: FileList | File[] | null) {
    if (!list || disabled) return;
    const files = Array.from(list).filter(isImageFile);
    if (files.length) onAdd(files);
    if (input.current) input.current.value = "";
  }

  const drop = {
    onDragEnter: (event: DragEvent) => {
      event.preventDefault();
      if (!disabled) setOver(true);
    },
    onDragOver: (event: DragEvent) => {
      event.preventDefault();
      if (!disabled) setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      setOver(false);
      take(event.dataTransfer.files);
    },
  };

  const cropPhoto = photos.find((photo) => photo.key === cropping) ?? null;
  const cropKind = cropPhoto?.key === portraitKey ? "portrait" : "situation";

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(event) => take(event.target.files)}
      />

      {photos.length === 0 ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => input.current?.click()}
          {...drop}
          className={`flex min-h-36 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${
            over
              ? "border-ink bg-panel-high text-ink"
              : "border-line-strong bg-panel-high text-muted hover:border-ink/40 hover:text-ink"
          }`}
        >
          <span className="text-sm font-medium">Añadir fotos</span>
          <span className="max-w-[16rem] text-xs leading-relaxed text-faint">
            Toca para elegir del carrete o de la cámara. También puedes soltarlas aquí.
          </span>
        </button>
      ) : (
        <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {photos.map((photo) => {
            const chosen = photo.key === portraitKey;
            return (
              <li key={photo.key} className="relative">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onPortrait(chosen ? null : photo.key)}
                  className="block w-full text-left"
                  aria-pressed={chosen}
                  aria-label={
                    chosen
                      ? "Retrato elegido. Toca otra vez para dejarlo sin retrato."
                      : "Usar como retrato"
                  }
                >
                  <FramedPhoto
                    src={photo.url}
                    alt=""
                    kind={chosen ? "portrait" : "situation"}
                    frame={photo.frame}
                    eager
                    className={`aspect-square w-full ${
                      chosen
                        ? "rounded-full outline-2 outline-offset-2 outline-ink"
                        : "rounded-lg"
                    }`}
                  />
                  <span
                    className={`mt-1.5 block text-center text-[11px] leading-tight ${
                      chosen ? "font-medium text-ink" : "text-faint"
                    }`}
                  >
                    {chosen ? "Retrato" : "Tocar: retrato"}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setCropping(photo.key)}
                  className="mt-1 w-full text-center text-[11px] text-accent hover:underline disabled:opacity-50"
                >
                  Encuadrar
                </button>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    URL.revokeObjectURL(photo.url);
                    if (chosen) onPortrait(null);
                    if (cropping === photo.key) setCropping(null);
                    onRemove(photo.key);
                  }}
                  className="absolute -right-1 -top-1 flex size-11 items-center justify-center rounded-full text-ink"
                  aria-label="Quitar esta foto"
                >
                  <span className="flex size-7 items-center justify-center rounded-full border border-line-strong bg-panel-high text-sm leading-none">
                    ×
                  </span>
                </button>
              </li>
            );
          })}

          <li>
            <button
              type="button"
              disabled={disabled}
              onClick={() => input.current?.click()}
              {...drop}
              className={`flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-panel-high ${
                over
                  ? "border-ink text-ink"
                  : "border-line-strong text-muted hover:border-ink/40 hover:text-ink"
              }`}
            >
              <span className="text-lg leading-none">+</span>
              <span className="px-1 text-center text-[11px] leading-tight">Más fotos</span>
            </button>
          </li>
        </ul>
      )}

      {cropPhoto && (
        <DraftCropDialog
          photo={cropPhoto}
          kind={cropKind}
          onSave={(frame) => {
            onFrame(cropPhoto.key, frame);
            setCropping(null);
          }}
          onClose={() => setCropping(null)}
        />
      )}
    </div>
  );
}

function DraftCropDialog({
  photo,
  kind,
  onSave,
  onClose,
}: {
  photo: DraftPhoto;
  kind: "situation" | "portrait";
  onSave: (frame: PhotoFrame | null) => void;
  onClose: () => void;
}) {
  const [frame, setFrame] = useState<PhotoFrame>(() => photo.frame ?? defaultFrame(kind));

  return (
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
          <PhotoCropEditor src={photo.url} kind={kind} value={frame} onChange={setFrame} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={button.primary} onClick={() => onSave(frame)}>
            Guardar encuadre
          </button>
          <button type="button" className={button.ghost} onClick={() => onSave(null)}>
            Recorte automático
          </button>
          <button type="button" className={button.ghost} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);
}
