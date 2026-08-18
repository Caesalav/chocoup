import { CHOCO_PATH, viewBoxAttr } from "@/lib/choco-map";
import {
  CHOCO_LABEL_ANCHOR,
  colombiaViewBoxAttr,
  COLOMBIA_PATH,
  INTRO_ZOOM_FROM,
} from "@/lib/colombia-map";
import type { CSSProperties } from "react";

type Props = {
  /** El tamaño lo decide quien lo usa; sin valor por defecto para que no gane
   *  un w-full sobre el ancho que pide la página. */
  className: string;
  /** Escribe el nombre encima del departamento. Lo pide la vista de /mapa, donde
   *  el localizador es lo único que hay en pantalla y una forma verde sin nombre
   *  no dice cuál de los treinta y dos es; la apertura del mapa lo deja apagado,
   *  porque durante un acercamiento de segundo y medio un rótulo de doce píxeles
   *  es ruido y el pie ya escribe «Chocó · Colombia». */
  named?: boolean;
  /**
   * Encuadra como el mapa del Chocó y mete el dibujo en el grupo que se acerca.
   *
   * Solo lo usa la apertura, y es la pieza de la que depende que el relevo no se
   * vea: con el mismo viewBox y el mismo tamaño en pantalla que el mapa de
   * debajo, terminar el acercamiento es dejar de transformar. El país cabe igual
   * porque lo que sobresale del encuadre lo recorta el propio SVG.
   */
  zooms?: boolean;
};

/**
 * Colombia con el Chocó resaltado. SVG en el servidor, sin JavaScript.
 */
export function ColombiaLocator({ className, named = false, zooms = false }: Props) {
  const drawing = (
    <>
      {/* El trazo es de doce unidades porque el marco es el del mapa detallado,
          casi seis veces más grande que el marco propio que tenía antes el
          localizador: son las dos unidades de siempre, medidas en la regla
          nueva. */}
      <path
        d={COLOMBIA_PATH}
        className={`fill-land stroke-contour${zooms ? " intro-country" : ""}`}
        strokeWidth={12}
        strokeLinejoin="round"
      />

      {/* La misma silueta que dibuja el mapa del Chocó, sin recortar contra el
          país: desde que el contorno de Colombia sigue a este en la costa
          compartida, no hay nada que sobresalga que recortar. Y sin recorte el
          departamento de la apertura puede acabar encima del del mapa hasta el
          último punto, que es de lo que va todo esto. */}
      <path d={CHOCO_PATH} className={`fill-accent${zooms ? " intro-handoff" : ""}`} />

      {/* El nombre va fuera, con una guía hasta el departamento, y no encima. El
          Chocó mide 375 unidades de ancho en un encuadre de 2.500: escrito
          dentro tiene que bajar a un cuerpo que en pantalla son ocho píxeles, y a
          ese tamaño deja de ser un nombre y es una mancha clara sobre el verde.
          Fuera cabe al cuerpo que se lee, y hacia el este porque al oeste solo
          hay unas 240 unidades antes del filo del marco. */}
      {named && (
        <g>
          <line
            x1={CHOCO_LABEL_ANCHOR.x + 233}
            y1={CHOCO_LABEL_ANCHOR.y}
            x2={CHOCO_LABEL_ANCHOR.x + 372}
            y2={CHOCO_LABEL_ANCHOR.y}
            className="stroke-line-strong"
            strokeWidth={9}
          />
          <text
            x={CHOCO_LABEL_ANCHOR.x + 419}
            y={CHOCO_LABEL_ANCHOR.y + 47}
            className="fill-ink"
            fontSize={128}
            fontWeight={600}
            letterSpacing={12}
          >
            CHOCÓ
          </text>
        </g>
      )}
    </>
  );

  return (
    <svg
      viewBox={zooms ? viewBoxAttr : colombiaViewBoxAttr}
      className={className}
      role="img"
      aria-label="Mapa de Colombia con el departamento del Chocó resaltado"
    >
      {zooms ? (
        <g
          className="intro-zoom"
          style={
            {
              "--intro-scale": INTRO_ZOOM_FROM.scale,
              "--intro-shift": INTRO_ZOOM_FROM.shift,
            } as CSSProperties
          }
        >
          {drawing}
        </g>
      ) : (
        drawing
      )}
    </svg>
  );
}
