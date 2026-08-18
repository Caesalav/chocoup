"use client";

import { useEffect, useState } from "react";
import { ColombiaLocator } from "@/components/map/ColombiaLocator";
import { CHOCO_LABEL_ANCHOR, COLOMBIA_FRAME } from "@/lib/colombia-map";

/**
 * Apertura de /mapa: Colombia, el Chocó encendido dentro, y un acercamiento que
 * se disuelve sobre el mapa.
 *
 * Casi nadie de fuera sabe dónde queda el Chocó, y el mapa del departamento a
 * secas no lo cuenta. Es una capa que se pone encima y se va: el mapa de debajo
 * está quieto todo el rato, así que no hay cámara, ni encuadres, ni marcadores
 * que contra-escalar. El movimiento vive entero en CSS (.intro-veil e
 * .intro-zoom); este componente solo decide si la capa llega a montarse.
 *
 * Una vez por sesión: en una visita que entra y sale del mapa para abrir
 * municipios, volver a verla en cada vuelta sería un peaje, no una explicación.
 */
export function MapIntro() {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    try {
      if (sessionStorage.getItem("chocoIntroPlayed") === "1") return;
    } catch {
      /* Sin sessionStorage se verá en cada recarga: molesta menos que perderla. */
    }

    // En el fotograma siguiente y no en este: montar la capa y arrancar el
    // acercamiento en la misma pasada se come los primeros cuadros.
    //
    // El sello se pone al arrancar de verdad y no al decidir: un efecto que se
    // monta y se desmonta sin llegar a pintar —React lo hace en pareja en
    // desarrollo— dejaría la apertura marcada como vista sin haberla enseñado,
    // y entonces no se ve nunca en toda la sesión.
    const frame = requestAnimationFrame(() => {
      try {
        sessionStorage.setItem("chocoIntroPlayed", "1");
      } catch {
        /* Igual que arriba: sin almacenamiento, se repite. */
      }
      setPlay(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!play) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <div className="intro-veil absolute inset-0 bg-paper" />

      <div className="absolute inset-0 flex items-center justify-center">
        {/* El acercamiento tiene que ir hacia el Chocó, y su sitio dentro del
            marco de Colombia es dato del mapa: se calcula en vez de dejar dos
            porcentajes a ojo en el CSS. La proporción del marco la pone este
            envoltorio para que ese origen caiga sobre el dibujo y no sobre la
            caja vacía que lo rodea. */}
        <div
          className="intro-zoom h-[82%]"
          style={{
            aspectRatio: `${COLOMBIA_FRAME.width} / ${COLOMBIA_FRAME.height}`,
            transformOrigin: `${(CHOCO_LABEL_ANCHOR.x / COLOMBIA_FRAME.width) * 100}% ${
              (CHOCO_LABEL_ANCHOR.y / COLOMBIA_FRAME.height) * 100
            }%`,
          }}
        >
          <ColombiaLocator className="h-full w-full" />
        </div>
      </div>

      <p className="intro-veil absolute inset-x-0 bottom-3 text-center text-[10px] uppercase tracking-[0.3em] text-faint">
        Chocó · Colombia
      </p>
    </div>
  );
}
