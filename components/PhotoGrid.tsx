"use client";

import { useCallback, useEffect, useState } from "react";
import { button } from "@/components/ui/styles";
import { photoUrl, thumbUrl } from "@/lib/format";
import { savedFrame } from "@/lib/photo-frame";
import type { Photo } from "@/lib/types";
import { FramedPhoto } from "@/components/ui/Photo";

/**
 * El carrete de fotos y su vista ampliada.
 *
 * Solo tiene dos formas, que es lo que el portal usa: sobre papel se arrastra en
 * el móvil y se abre en rejilla a partir de `lg`; sobre la foto de portada de un
 * municipio (`overlay`) va dentro del velo oscuro y sigue siendo carrete a
 * cualquier ancho, porque ahí no hay sitio para una rejilla.
 *
 * Tenía una tercera —un mosaico cuadrado con la primera foto a doble ancho y el
 * número incrustado en la esquina— que era la de la etapa anterior y que después
 * de los dos rediseños no la pedía ninguna pantalla: quedaban las ramas, la
 * opción `featureFirst` y una `variant` con un solo valor real.
 */
type Props = {
  photos: Pick<Photo, "id" | "storage_path" | "thumb_path" | "caption" | "focus_x" | "focus_y" | "zoom">[];
  /** Sobre la foto de portada: el carrete va en el velo oscuro y no se
   *  convierte en rejilla al ensanchar. */
  overlay?: boolean;
};

export function PhotoGrid({ photos, overlay = false }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) =>
      setOpenIndex((current) =>
        current === null ? null : (current + delta + photos.length) % photos.length,
      ),
    [photos.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [openIndex, close, step]);

  if (photos.length === 0) return null;

  const active = openIndex === null ? null : photos[openIndex];

  return (
    <>
      <ul
        className={
          overlay
            ? "no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-px-5 px-5 sm:scroll-px-8 sm:px-8"
            : "no-scrollbar -mx-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-px-5 px-5 lg:mx-0 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] lg:gap-3 lg:overflow-visible lg:px-0"
        }
      >
        {photos.map((photo, index) => (
          <li
            key={photo.id}
            className={
              overlay
                ? "w-[6.1rem] shrink-0 snap-start sm:w-[7.25rem]"
                : "w-[6.1rem] shrink-0 snap-start lg:w-auto"
            }
          >
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className={`group relative block w-full overflow-hidden bg-land transition-colors ${
                overlay
                  ? "rounded-2xl ring-1 ring-paper/40 hover:ring-paper/70"
                  : "rounded-lg border border-line hover:border-line-strong"
              }`}
            >
              <FramedPhoto
                src={thumbUrl(photo)}
                alt={photo.caption || "Situación documentada"}
                frame={savedFrame(photo)}
                eager={index < 3}
                className="aspect-[3/2] w-full"
              />
            </button>
          </li>
        ))}
      </ul>
      {!overlay && (
        <p className="mt-2 text-[12px] text-faint lg:hidden">Desliza · toca para ampliar</p>
      )}

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-paper/95 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={close}
              className={button.ghost}
            >
              Cerrar
            </button>
          </div>
          <div
            className="flex min-h-0 flex-1 items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            {/* El filete es lo que le da un canto a la foto: sobre el negro de
                antes se recortaba sola, y sobre papel una imagen de cielo o de
                playa se derrama en el fondo sin él. */}
            <img
              src={photoUrl(active.storage_path)}
              alt={active.caption || "Situación documentada"}
              className="max-h-full max-w-full rounded-lg border border-line object-contain"
            />
          </div>
          <div
            className="mx-auto mt-4 flex w-full max-w-3xl items-center justify-between gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => step(-1)}
              className={button.ghost}
            >
              Anterior
            </button>
            <p className="min-w-0 flex-1 text-center text-xs leading-snug text-muted">
              {active.caption}
            </p>
            <button
              type="button"
              onClick={() => step(1)}
              className={button.ghost}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </>
  );
}
