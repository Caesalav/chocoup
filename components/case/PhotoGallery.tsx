"use client";

import { useRef, useState } from "react";
import { Photo } from "@/components/ui/Photo";
import { savedFrame } from "@/lib/photo-frame";
import type { Photo as PhotoRow } from "@/lib/types";

/**
 * Las fotos del caso, a sangre y una detrás de otra.
 *
 * El carrete es desplazamiento con ajuste de CSS: se pasa con el dedo sin que
 * intervenga JavaScript, y esa parte funciona siempre. Lo único que hace el
 * cliente es enterarse de en cuál estás para encender su tramo del indicador y
 * cambiar el pie de foto. Sin JavaScript se queda marcada la primera, que es la
 * que se está viendo al abrir: no miente en ningún momento.
 *
 * Tramos y no puntos, como en la referencia: con cuatro fotos los puntos son
 * cuatro motas de dos píxeles y no se distingue cuál está encendida.
 */
export function PhotoGallery({
  photos,
  className = "",
  showCaption = true,
}: {
  photos: Pick<PhotoRow, "id" | "storage_path" | "caption" | "focus_x" | "focus_y" | "zoom">[];
  className?: string;
  /** En la ficha el titular va sobre la foto y el pie se comería. */
  showCaption?: boolean;
}) {
  const rail = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);

  const caption = photos[index]?.caption ?? "";

  return (
    <div className={`relative ${className}`}>
      <ul
        ref={rail}
        onScroll={() => {
          const node = rail.current;
          if (!node) return;
          const next = Math.round(node.scrollLeft / node.clientWidth);
          setIndex((current) => (current === next ? current : next));
        }}
        className="no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto"
      >
        {photos.map((photo, position) => (
          <li key={photo.id} className="size-full shrink-0 snap-center">
            <Photo
              path={photo.storage_path}
              frame={savedFrame(photo)}
              alt={photo.caption || "Situación documentada"}
              eager={position === 0}
              className="size-full"
            />
          </li>
        ))}
      </ul>

      <span aria-hidden className="veil-t pointer-events-none absolute inset-x-0 top-0 h-28" />
      <span aria-hidden className="veil-b pointer-events-none absolute inset-x-0 bottom-0 h-1/2" />

      {photos.length > 1 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-6 flex justify-center gap-1.5"
        >
          {photos.map((photo, position) => (
            <span
              key={photo.id}
              className={`h-[3px] w-7 rounded-full transition-colors duration-200 ${
                position === index ? "bg-paper" : "bg-paper/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* El pie va alto porque la hoja de contenido sube sobre la galería con la
          esquina redondeada y se comería la última línea. */}
      {showCaption && caption && (
        <p className="pointer-events-none absolute inset-x-0 bottom-16 px-6 text-center text-[12px] leading-snug text-paper/90">
          {caption}
        </p>
      )}

      <p className="sr-only">
        {photos.length === 1
          ? "1 fotografía"
          : `${photos.length} fotografías, se pasan deslizando`}
      </p>
    </div>
  );
}
