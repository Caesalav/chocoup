"use client";

import { useRef } from "react";
import { field } from "@/components/ui/styles";
import { clampFrame, defaultFrame, frameVars, type PhotoFrame } from "@/lib/photo-frame";

/**
 * El recorte que el equipo elige: arrastrar para mover, la barra para acercar.
 *
 * La caja de aquí es la misma clase que va a pintar el portal (`.photo-crop` o
 * `.photo-portrait`), así que lo que se ve es lo que se publica. No se recorta
 * el archivo: se guardan tres números.
 */
export function PhotoCropEditor({
  src,
  kind,
  value,
  onChange,
}: {
  src: string;
  kind: "situation" | "portrait";
  value: PhotoFrame;
  onChange: (frame: PhotoFrame) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; focusX: number; focusY: number } | null>(null);

  return (
    <div>
      <div
        ref={box}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            focusX: value.focusX,
            focusY: value.focusY,
          };
        }}
        onPointerMove={(event) => {
          if (!drag.current || !box.current) return;
          const rect = box.current.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          const dx = ((event.clientX - drag.current.x) / rect.width) * (100 / value.zoom);
          const dy = ((event.clientY - drag.current.y) / rect.height) * (100 / value.zoom);
          onChange(
            clampFrame({
              ...value,
              focusX: drag.current.focusX - dx,
              focusY: drag.current.focusY - dy,
            }),
          );
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        className={`relative cursor-grab touch-none overflow-hidden bg-land active:cursor-grabbing ${
          kind === "portrait" ? "mx-auto aspect-square w-56 rounded-full" : "aspect-[3/2] w-full rounded-xl"
        }`}
        style={frameVars(value)}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className={`${kind === "portrait" ? "photo-portrait" : "photo-crop"} size-full select-none`}
        />
      </div>

      <label className="mt-3 block">
        <span className={field.label}>Acercar</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={value.zoom}
          onChange={(event) =>
            onChange(clampFrame({ ...value, zoom: Number(event.target.value) }))
          }
          className="mt-2 w-full accent-accent"
        />
      </label>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Arrastra la foto para elegir qué se ve. Acercar enseña menos, con más detalle.
      </p>
    </div>
  );
}

export { defaultFrame };
