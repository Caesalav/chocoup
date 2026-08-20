import { CHOCO_PATH, viewBoxAttr } from "@/lib/choco-map";
import {
  CHOCO_LABEL_ANCHOR,
  colombiaViewBoxAttr,
  COLOMBIA_PATH,
  INTRO_ZOOM_FROM,
} from "@/lib/colombia-map";
import type { NeedsTier } from "@/lib/needs-scale";
import type { CSSProperties } from "react";

/**
 * Una de las treinta formas del departamento, ya resuelta por quien la pide: el
 * trazado del DANE, la clase de relleno del tramo que le toca y el nombre de ese
 * tramo.
 *
 * El color viene hecho y no se busca aquí, y no es por comodidad. Este archivo
 * lo importa también la apertura de /mapa, que es un fragmento de cliente y
 * presume de pesar tres kilobytes: consultar el tramo desde dentro traería la
 * tabla de colores y, colgado de ella, el catálogo de trazados del DANE entero
 * —doce kilobytes— a una pantalla que no dibuja ni una de estas piezas. El tramo
 * se nombra con el tipo de la escala y nada más: un `import type` no deja rastro
 * en el paquete.
 */
type MosaicPiece = { id: string; d: string; fill: string; tier: NeedsTier };

/**
 * Filete del departamento, en píxeles y no en unidades del dibujo.
 *
 * Sin filete el Chocó DESAPARECE del país, que es exactamente lo contrario de
 * lo que viene a hacer esta vista: el gris del municipio sin documentar
 * (`need-blank`) y el del país (`land`) están a 1,04:1 de contraste, o sea que
 * son el mismo gris. El relleno verde de antes no tenía ese problema; el mosaico
 * solo se distingue del país donde alguien ya documentó, que hoy son tres
 * municipios de treinta y siempre serán menos de treinta.
 *
 * En píxeles porque el departamento se dibuja aquí entre 26 y 92 px de ancho
 * —medido en el navegador: 26 en una ventana de 360×640, 48 en un teléfono, 53
 * en un escritorio de 1440×900, 92 en una tableta de 820×1180— y con un grosor
 * proporcional el filete valdría tres veces y media más en un sitio que en otro,
 * o sea que se borraría justo donde el dibujo ya es más pequeño y más falta
 * hace. Es la ley del mosaico, escrita en `NON_SCALING` de ChocoMap.
 *
 * Se ve la mitad, un píxel y medio, y la de dentro la tapa el relleno de la
 * PROPIA silueta —de ahí el `paint-order`—: eso es lo que deja el filete POR
 * FUERA en vez de comiéndose la franja costera de los municipios del Pacífico,
 * que en algunos tramos mide dos píxeles de ancho enteros.
 *
 * Lo tapaba el mosaico, y ya no puede: la leyenda baja las piezas a 0,22 cuando
 * se pregunta por un tramo, y por debajo de una pieza traslúcida el filete asoma
 * hacia dentro y se dobla de grosor. Medido en el departamento a 390 × 844 con el
 * cursor está en «Prioritario»: con el trazo debajo del relleno cambian 1.104 px
 * y 441 se van hacia el verde; con el trazo encima, 1.475 y 916. Esos 475 px de
 * verde que aparecen son más que las tres piezas de color juntas —301 px²—, o
 * sea que la respuesta a la leyenda sería el contorno engordando y no el color
 * bajando.
 */
const CHOCO_RING = 3;

type Props = {
  /** El tamaño lo decide quien lo usa; sin valor por defecto para que no gane
   *  un w-full sobre el ancho que pide la página. */
  className: string;
  /** Escribe el nombre encima del departamento. Lo pide la vista de /mapa, donde
   *  el localizador es lo único que hay en pantalla y una forma resaltada sin
   *  nombre no dice cuál de los treinta y dos es; la apertura del mapa lo apaga,
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
  /**
   * Las treinta piezas del departamento, coloreadas. Con ellas el Chocó deja de
   * ser una etiqueta verde dentro del país y es el mismo mapa que hay en la otra
   * pestaña, recortado a su silueta —y no hay que recortar nada: las treinta
   * formas del DANE cubren el 99,86 % del área de `CHOCO_PATH`, y las dos tablas
   * están dibujadas en las mismas coordenadas que el país, así que caen en su
   * sitio sin transformar ni enmascarar—.
   *
   * VA EN LA VISTA QUIETA Y NO EN LA APERTURA, aunque el mismo componente sirva
   * las dos, y no por ahorrar:
   *
   * El acercamiento arranca con el departamento a un cuarto de su tamaño —39 px
   * de ancho en un teléfono, 20 en una ventana corta— y lo que tiene que
   * conseguir en su primer medio segundo es que el ojo encuentre el Chocó en un
   * país entero. Eso lo hace una forma llena. Un mosaico que en veintisiete de
   * sus treinta piezas es del mismo gris que el país necesita el filete para
   * existir, y un filete es un contorno: pide que lo busques, no salta.
   *
   * Y el relevo se rompería, que es lo que de verdad lo decide. Lo que se
   * disuelve al final son dos dibujos que tienen que ser el mismo, y ni el filete
   * ni el canal de papel del tablero pueden serlo a los dos extremos de un
   * acercamiento de cuatro aumentos: los dos se miden en píxeles de pantalla, así
   * que al empezar son una pasta blanca sobre una pieza de dos píxeles y al
   * acabar tendrían que aparecer de la nada sobre un mosaico que ya estaba
   * quieto. Un relleno plano que se va no tiene ese problema.
   */
  mosaic?: MosaicPiece[];
};

/**
 * Colombia con el Chocó resaltado. SVG en el servidor, sin JavaScript.
 */
export function ColombiaLocator({ className, named = false, zooms = false, mosaic }: Props) {
  const drawing = (
    <>
      {/* El mar llena el encuadre. El país va encima, en el gris de las
          superficies hundidas, y el Chocó encima del país: tres capas, tres
          significados. El oro de la escala no puede vivir también en la tierra
          del país. */}
      <rect className="fill-mar" x="-300" y="-900" width="2700" height="3800" />
      <path
        d={COLOMBIA_PATH}
        className={`fill-tierra stroke-contour${zooms ? " intro-country" : ""}`}
        strokeWidth={12}
        strokeLinejoin="round"
      />
      {!zooms && (
        <text
          x={-96}
          y={640}
          className="fill-mar-ink"
          fontSize={92}
          fontWeight={500}
          letterSpacing={10}
          transform="rotate(-90 -96 640)"
          textAnchor="middle"
        >
          Pacífico
        </text>
      )}

      {/* La misma silueta que dibuja el mapa del Chocó, sin recortar contra el
          país: desde que el contorno de Colombia sigue a este en la costa
          compartida, no hay nada que sobresalga que recortar. Y sin recorte el
          departamento de la apertura puede acabar encima del del mapa hasta el
          último punto, que es de lo que va todo esto. */}
      {mosaic ? (
        <>
          {/* La silueta entera debajo, en el gris de "sin documentar", y no por
              gusto: al mosaico le falta el 0,14 % del área para llenarla —el
              catálogo de municipios y el del departamento vienen simplificados
              cada uno por su lado—, y las piezas colindan sin solaparse, así que
              entre dos vecinas queda además la costura del suavizado. Por esas
              rendijas se vería el país, o sea que el departamento saldría cosido
              con hilo del color de lo que tiene alrededor. Con el gris detrás, lo
              que asoma por ellas es el gris que le toca. */}
          <path
            d={CHOCO_PATH}
            className="fill-need-blank stroke-ink"
            strokeWidth={CHOCO_RING}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{ paintOrder: "stroke fill" }}
          />
          {/* Las treinta piezas a hueso: sin el canal de papel que las separa en
              el tablero y sin un solo rótulo. No es una simplificación, es que el
              canal no cabe. Se mide en píxeles de pantalla, y el linde interior
              del departamento mide 571 px a este tamaño: los cuatro píxeles del
              tablero convertirían en papel 2.282 de los 2.569 px² que ocupa el
              Chocó en un teléfono, el 89 %. Ni medio píxel sale bien —cuesta el
              11 %, y lo cobra sobre todo en las piezas de color, que son lo único
              que este dibujo tiene que decir—. Sin canal el mosaico se separa
              solo donde hace falta: dos vecinos del mismo tramo dicen lo mismo y
              da igual dónde acaba uno, y dos de tramos distintos ya los separa el
              salto de color. Lo que se pierde es poder contar las treinta piezas,
              que a 48 px de ancho no se podían contar de ninguna manera.

              Llevan la clase y el tramo del tablero porque el filtro de la
              leyenda es CSS y ya estaba escrito para ellas: `.map-board` es el
              contenedor de la página, o sea que cubre las dos vistas, y sus
              reglas bajan todo `.map-fill` cuyo `data-tier` no sea el que se está
              señalando. Con la clase puesta, el país aprende el gesto sin una
              línea de hoja de estilos y sin poder decir algo distinto que el
              tablero.

              De la clase viene también el color escalonado del tablero, y aquí
              entra de golpe: `--i` no se pasa, así que los treinta arrancan a la
              vez y en medio segundo. No estorba porque cae dentro de la entrada
              del propio contenedor (`.enters`, 0,42 s) y es el mismo gesto —el
              color llega—; medido, la pieza está al 0,58 a los 80 ms y al 0,97 a
              los 260. Y con `prefers-reduced-motion` no hay nada que apagar: la
              regla que ya existe para `.map-fill` la cubre. */}
          <g>
            {mosaic.map((piece) => (
              <path
                key={piece.id}
                d={piece.d}
                className={`map-fill ${piece.fill}`}
                data-tier={piece.tier}
              />
            ))}
          </g>
        </>
      ) : (
        <path d={CHOCO_PATH} className={`fill-accent${zooms ? " intro-handoff" : ""}`} />
      )}

      {/* El nombre va fuera, con una guía hasta el departamento, y no encima. El
          Chocó mide 375 unidades de ancho en un encuadre de 2.500: escrito
          dentro tiene que bajar a un cuerpo que en pantalla son ocho píxeles, y a
          ese tamaño deja de ser un nombre y es una mancha clara sobre el dibujo.
          Fuera cabe al cuerpo que se lee, y hacia el este porque al oeste solo
          hay unas 240 unidades antes del filo del marco. */}
      {named && (
        <g>
          <line
            x1={CHOCO_LABEL_ANCHOR.x + 233}
            y1={CHOCO_LABEL_ANCHOR.y}
            x2={CHOCO_LABEL_ANCHOR.x + 372}
            y2={CHOCO_LABEL_ANCHOR.y}
            className="map-country-guide stroke-muted"
            strokeWidth={9}
          />
          <text
            x={CHOCO_LABEL_ANCHOR.x + 419}
            y={CHOCO_LABEL_ANCHOR.y + 47}
            className="map-country-name fill-ink"
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
      aria-label={
        mosaic
          ? "Mapa de Colombia con el Chocó resaltado y sus treinta municipios coloreados por cuánto falta por cubrir"
          : "Mapa de Colombia con el departamento del Chocó resaltado"
      }
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
