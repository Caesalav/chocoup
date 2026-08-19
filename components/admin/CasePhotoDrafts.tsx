"use client";

import { useRef, useState, type DragEvent } from "react";
import { FramedPhoto } from "@/components/ui/Photo";

export type DraftPhoto = {
  key: string;
  file: File;
  url: string;
};

/**
 * Las fotos del primer día, antes de que el caso exista.
 *
 * No se suben aquí: se eligen, se ven y se marca cuál es el retrato. La subida
 * va después de crear la causa, porque Storage las cuelga de su identificador.
 * El retrato es una elección y no «la primera»: en campo la primera foto suele
 * ser la casa, y esa no es la cara que tiene que salir en la tarjeta.
 */
export function CasePhotoDrafts({
  photos,
  portraitKey,
  onAdd,
  onRemove,
  onPortrait,
  disabled = false,
}: {
  photos: DraftPhoto[];
  portraitKey: string | null;
  onAdd: (files: File[]) => void;
  onRemove: (key: string) => void;
  onPortrait: (key: string | null) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

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
                  onClick={() => {
                    URL.revokeObjectURL(photo.url);
                    if (chosen) onPortrait(null);
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
    </div>
  );
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);
}
