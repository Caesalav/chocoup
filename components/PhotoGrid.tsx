"use client";

import { useCallback, useEffect, useState } from "react";
import { photoUrl, thumbUrl } from "@/lib/format";
import type { Photo } from "@/lib/types";

type Props = {
  photos: Pick<Photo, "id" | "storage_path" | "thumb_path" | "caption">[];
  /** Ancho de la primera foto: destaca la imagen de apertura de una ciudad. */
  featureFirst?: boolean;
};

export function PhotoGrid({ photos, featureFirst = false }: Props) {
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
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <li
            key={photo.id}
            className={
              featureFirst && index === 0 ? "col-span-2 sm:col-span-2 sm:row-span-2" : undefined
            }
          >
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group relative block w-full overflow-hidden rounded-lg border border-line bg-land"
            >
              <img
                src={thumbUrl(photo)}
                alt={photo.caption || "Situación documentada"}
                loading={index < 3 ? "eager" : "lazy"}
                className={`w-full object-cover opacity-90 transition-opacity group-hover:opacity-100 ${
                  featureFirst && index === 0 ? "aspect-4/3" : "aspect-square"
                }`}
              />
              <span className="absolute left-2 top-2 rounded-full bg-base/70 px-2 py-0.5 text-[10px] font-medium tabular-nums text-body backdrop-blur">
                {String(index + 1).padStart(2, "0")}
              </span>
            </button>
            {photo.caption && (
              <p className="mt-2 text-xs leading-snug text-faint">{photo.caption}</p>
            )}
          </li>
        ))}
      </ul>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-base/95 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={close}
              className="smallcaps rounded-full px-4 py-2 text-[15px] text-muted hover:text-ink"
            >
              Cerrar
            </button>
          </div>
          <div
            className="flex min-h-0 flex-1 items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={photoUrl(active.storage_path)}
              alt={active.caption || "Situación documentada"}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div
            className="mx-auto mt-4 flex w-full max-w-3xl items-center justify-between gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => step(-1)}
              className="smallcaps rounded-full px-3 py-2 text-[15px] text-muted hover:text-ink"
            >
              Anterior
            </button>
            <p className="min-w-0 flex-1 text-center text-xs leading-snug text-muted">
              {active.caption}
            </p>
            <button
              type="button"
              onClick={() => step(1)}
              className="smallcaps rounded-full px-3 py-2 text-[15px] text-muted hover:text-ink"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </>
  );
}
