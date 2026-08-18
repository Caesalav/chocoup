import type { CSSProperties } from "react";

/**
 * La ventana que se enseña de una foto: dónde mira el recorte y cuánto se acerca.
 *
 * El archivo en Storage no se toca. Estos tres números son la caja con la que
 * `.photo-crop` y `.photo-portrait` recortan al pintar. Nulo en la fila significa
 * «usa el recorte por omisión de esa caja» —el 62 % de una situación, el 22 % de
 * una cara— para que una foto que nadie ha encuadrado no se mueva.
 */
export type PhotoFrame = {
  focusX: number;
  focusY: number;
  zoom: number;
};

/** Lo que llega de `public.photos`. Los tres nulos o los tres puestos. */
export type PhotoFocus = {
  focus_x: number | string | null;
  focus_y: number | string | null;
  zoom: number | string | null;
};

export const SITUATION_FRAME: PhotoFrame = { focusX: 50, focusY: 62, zoom: 1 };
export const PORTRAIT_FRAME: PhotoFrame = { focusX: 50, focusY: 22, zoom: 1 };

export function defaultFrame(kind: "situation" | "portrait"): PhotoFrame {
  return kind === "portrait" ? PORTRAIT_FRAME : SITUATION_FRAME;
}

/** El encuadre que el equipo guardó, o nulo si esta foto sigue con el recorte por omisión. */
export function savedFrame(photo: PhotoFocus | null | undefined): PhotoFrame | null {
  if (photo == null || photo.focus_x == null || photo.focus_y == null || photo.zoom == null) {
    return null;
  }
  return {
    focusX: Number(photo.focus_x),
    focusY: Number(photo.focus_y),
    zoom: Number(photo.zoom),
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampFrame(frame: PhotoFrame): PhotoFrame {
  return {
    focusX: clamp(frame.focusX, 0, 100),
    focusY: clamp(frame.focusY, 0, 100),
    zoom: clamp(frame.zoom, 1, 3),
  };
}

/**
 * Variables que leen `.photo-crop` y `.photo-portrait`. Van en el marco, no en
 * la imagen: heredan, y el recorte por omisión sigue vivo cuando no hay encuadre.
 */
export function frameVars(frame: PhotoFrame | null | undefined): CSSProperties | undefined {
  if (!frame) return undefined;
  return {
    "--photo-x": `${frame.focusX}%`,
    "--photo-y": `${frame.focusY}%`,
    "--photo-z": String(frame.zoom),
  } as CSSProperties;
}
