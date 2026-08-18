"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CheckIcon, CopyIcon } from "@/components/ui/icons";

/**
 * Si este navegador sabe copiar al portapapeles, y solo se puede saber en el
 * navegador.
 *
 * Va por `useSyncExternalStore` y no por un estado que se enciende en un efecto:
 * es la forma que tiene React de leer un valor que en el servidor no existe sin
 * romper la hidratación. La instantánea del servidor es `false`, así que el HTML
 * sale sin botón; la del cliente pregunta de verdad. La suscripción no hace nada
 * porque esto no cambia mientras la página vive.
 *
 * `navigator.clipboard` no está en todas partes: falta en http sobre una IP de la
 * red local, que es exactamente cómo se prueba el portal desde un móvil del equipo.
 */
const NEVER_CHANGES = () => () => {};
const hasClipboard = () => typeof navigator !== "undefined" && Boolean(navigator.clipboard);
const onServer = () => false;

/**
 * Copiar la llave, y nada más que eso.
 *
 * Es un añadido y no el camino: copiar al portapapeles no existe sin JavaScript,
 * así que **este botón no se pinta en el servidor**. Aparece después de hidratar y
 * solo si hay portapapeles. Sin JavaScript no queda aquí un botón muerto que se
 * pulsa y no hace nada: no queda nada, y la llave de arriba sigue escrita entera y
 * seleccionable, que es la vía principal y la que va a usar casi todo el mundo.
 *
 * Es la misma decisión que `ShareLink`, con una diferencia: allí hay un enlace de
 * verdad debajo al que caerse —wa.me funciona sin nada encendido— y aquí no hay
 * ninguno, así que en vez de degradar se retira.
 *
 * Y si el navegador rechaza la escritura —permiso denegado, pestaña sin foco— lo
 * dice y manda a seleccionar a mano. Callarse dejaría a alguien pegando en su app
 * lo último que tuviera copiado, y esto es un destino de dinero.
 */
export function CopyKeyButton({
  value,
  noun = "llave",
}: {
  value: string;
  /** Qué se está copiando, en minúscula: «llave» o «número». */
  noun?: string;
}) {
  const ready = useSyncExternalStore(NEVER_CHANGES, hasClipboard, onServer);
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (!ready) return null;

  const label =
    state === "copied"
      ? `${noun === "número" ? "Número copiado" : "Llave copiada"}`
      : state === "failed"
        ? "No se pudo copiar: selecciónalo arriba"
        : `Copiar ${noun === "número" ? "el número" : "la llave"}`;

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value).then(
          () => setState("copied"),
          () => setState("failed"),
        );
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setState("idle"), 4000);
      }}
      className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-panel-high px-4 text-[14px] font-medium text-body transition-[border-color,color,scale] duration-150 hover:border-ink/40 hover:text-ink active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {state === "copied" ? (
        <CheckIcon className="size-4 text-accent" />
      ) : (
        <CopyIcon className="size-4" />
      )}
      {label}
    </button>
  );
}
