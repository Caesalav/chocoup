"use client";

import { useEffect, useState } from "react";
import { ColombiaLocator } from "@/components/map/ColombiaLocator";

/**
 * Apertura de /mapa: Colombia, el Chocó encendido dentro, y un acercamiento que
 * termina justo encima del mapa y se disuelve sobre él.
 *
 * Casi nadie de fuera sabe dónde queda el Chocó, y el mapa del departamento a
 * secas no lo cuenta. Es una capa que se pone encima y se va: el mapa de debajo
 * está quieto todo el rato, así que no hay cámara, ni encuadres, ni marcadores
 * que contra-escalar. El movimiento vive entero en CSS (.intro-zoom,
 * .intro-country e .intro-handoff); este componente solo decide si la capa llega
 * a montarse.
 *
 * El localizador se importa aquí, y con él los trazados del país y del
 * departamento: 3,2 kB comprimidos en un fragmento que solo carga esta pantalla.
 * La otra opción era que se los pasara el servidor ya dibujados —entonces no
 * habría JavaScript que descargar, pero los mismos trazados viajarían dentro del
 * HTML en cada visita, porque /mapa se sirve en caliente, y se pagarían aunque
 * la apertura no fuera a verse, que es lo normal: solo sale una vez por sesión y
 * nunca con prefers-reduced-motion. Importándolo se pagan una vez y se quedan en
 * la caché: a la tercera vez que se abre el mapa ya sale a cuenta, y aquí se
 * abre muchas veces al día y con mala señal.
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
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      {/* Una plancha del MISMO color que la ventana tapa el mapa hasta que el
          departamento ya ha aterrizado. Antes se iba abriendo durante todo el
          acercamiento, y eso enseñaba el mosaico debajo de un Chocó que todavía
          venía de camino: dos veces la misma forma a dos tamaños, que es justo la
          superposición que no encajaba.

          Y tiene que ser el color de la ventana, no otro: la plancha se apaga con
          una transición, así que cualquier diferencia se ve como un fundido de
          color encima del dibujo. La ventana es de papel (ver /mapa), así que
          esto es de papel. */}
      <div className="intro-handoff absolute inset-0 bg-paper" />

      {/* Con el encuadre del mapa del Chocó (`zooms`): el mismo viewBox y el
          mismo tamaño en pantalla que el mapa de debajo, que es lo que permite
          que el acercamiento termine exactamente encima de él. */}
      <ColombiaLocator zooms className="absolute inset-0 size-full" />

      <p className="intro-handoff absolute inset-x-0 bottom-3 text-center text-[10px] uppercase tracking-[0.3em] text-faint">
        Chocó · Colombia
      </p>
    </div>
  );
}
