import Link from "next/link";
import {
  CHOCO_PATH,
  CITY_LABEL,
  LABEL_BASELINE,
  labelHitBox,
  leaderFor,
  OCEAN_LABEL,
  placeOceanLabel,
  placePins,
  viewBoxAttr,
  type MapPin,
} from "@/lib/choco-map";
import { plural } from "@/lib/format";
import { paintMunicipalities, TIER_FILL, type NeedsTier } from "@/lib/needs-scale";

type Props = {
  pins: MapPin[];
  /** Construye el enlace de cada municipio documentado. Sin esto el mapa es un
   *  dibujo: se usa así en la ficha, donde no hay a dónde ir. */
  hrefFor?: (pin: MapPin) => string;
  /** Municipio del recado: lleva contorno de tinta, que es la marca de "este
   *  es". No es lo mismo que estar bajo el cursor y no se parece. */
  activeSlug?: string;
  /** Solo la silueta y el punto, para usos diminutos donde el mosaico se
   *  convertiría en papilla: a 96 px de ancho, la separación entre municipios
   *  mide menos de medio píxel. */
  bare?: boolean;
  /** El tamaño lo decide quien lo usa: /mapa lo limita en alto, la ficha de un
   *  municipio en ancho. */
  className: string;
};

/**
 * Almohadilla del departamento, en unidades del viewBox: un trazo de papel con
 * juntas redondas que recorta visualmente los picos del polígono del DANE y abre
 * un canal suave contra el fondo. Escala con el dibujo porque es una forma, no
 * una línea; los grosores de línea del mosaico no escalan, y el motivo está en
 * `NON_SCALING` y en la hoja de estilos.
 */
const CUSHION_STROKE = 18;

/**
 * LOS TRAZOS DEL MOSAICO SE MIDEN EN PÍXELES, NO EN UNIDADES DEL DIBUJO.
 *
 * El mapa no tiene un tamaño: medido en el navegador, el mosaico se dibuja a 262
 * px de ancho en un teléfono, a 529 en una tableta y a entre 278 y 464 en
 * escritorio, según lo alta que sea la ventana. Son más del doble de diferencia,
 * y con trazos proporcionales eso significa que la misma señal vale el doble en
 * un sitio que en otro: el contorno del municipio elegido salía a 2,1 px en la
 * tableta y a 0,7 px en un escritorio bajo, o sea que desaparecía justo donde el
 * mapa ya es más pequeño.
 *
 * Con `non-scaling-stroke` el grosor se mide después de la escala, así que la
 * separación entre municipios, el filete del cursor y la tinta del elegido miden
 * lo mismo en cualquier pantalla. Es lo que hace cualquier mapa de verdad: el
 * dibujo se acerca, el grosor del linde no.
 *
 * Va en las formas declaradas y no en las capas porque `vector-effect` no se
 * hereda: puesto aquí, lo recogen las cuatro capas que las reutilizan.
 */
const NON_SCALING = "non-scaling-stroke";

/**
 * Radio del asidero de un municipio documentado, en unidades del viewBox: unos
 * 14 px de diámetro en un teléfono. Ver la capa de frente.
 */
const GRIP_RADIUS = 16;

/**
 * Prefijo de los identificadores de las treinta formas.
 *
 * Las formas se declaran una vez y las capas las reutilizan con `<use>`: son
 * doce kilobytes de trazado y hacen falta cuatro veces (color, canal, elegido y
 * frente). Repetirlas costaría 36 KB de HTML en cada visita, y /mapa se sirve en
 * caliente. El precio es que EN UNA PÁGINA SOLO PUEDE HABER UN MOSAICO, porque
 * los identificadores serían dos veces los mismos; hoy es así por diseño (el
 * mosaico vive solo en /mapa y en la portada, y la ficha de municipio usa
 * `bare`, que no declara ninguno).
 */
const SHAPE = "choco-mun-";

/**
 * El Chocó como mosaico de sus 30 municipios, coloreados por cuánto falta
 * por cubrir.
 *
 * Sin JavaScript y sin servicio de mapas: es SVG renderizado en el servidor y
 * los enlaces son <a>, así que /mapa funciona con la señal del Chocó y
 * compartido por WhatsApp. Las formas son del DANE (lib/choco-texture) y no se
 * mueven nunca: no hay cámara, ni zoom, ni máscara, ni detalle de calles.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTÁ EN CAPAS POR OFICIO Y NO EN UNA PIEZA POR MUNICIPIO
 *
 * En SVG no hay z-index: manda el orden del documento. Mientras cada municipio
 * era un grupo con su relleno y su filete de papel, resaltar uno no servía de
 * nada, porque los treinta se pintan en cadena y los que van escritos DESPUÉS le
 * pintaban encima el filete y el color. Medido en el navegador sobre el contorno
 * de la forma resaltada: a Atrato le tapaban 278 de 360 puntos Lloró, Cértegui y
 * Río Quito; a Cértegui, 265; a Istmina, 229 entre seis vecinos. Y los tres que
 * salían limpios eran justo los que se escriben al final. El `z-index: 4` del
 * hover se calculaba —el navegador lo informaba— y no hacía absolutamente nada.
 *
 * Así que el mosaico se ordena por oficio, y el orden de pintado deja de ser un
 * accidente del catálogo del DANE:
 *
 *   1. color     los treinta rellenos. Son colindantes, no se solapan.
 *   2. canal     el filete de papel de los treinta, DE UNA VEZ y encima de todos
 *                los colores. Antes cada uno pintaba el suyo, y el del último
 *                mordía el relleno del primero: la separación salía distinta
 *                según quién estuviera escrito antes.
 *   3. elegido   el contorno de tinta del municipio del recado. Uno como mucho.
 *   4. frente    los treinta otra vez, invisibles, y ES LO ÚNICO QUE RECIBE EL
 *                CURSOR. El que está debajo del puntero se enciende aquí, encima
 *                de todo el mosaico. Como en esta capa nunca hay más de uno
 *                visible, que un vecino le pinte encima no es que no pase: no
 *                puede pasar.
 *   5. rótulos   guías, puntos y nombres. Un nombre no lo tapa nada.
 *
 * Nada de esto necesita JavaScript ni `:has()`: es `<use>`, `:hover` y
 * `:focus-visible`, que existen desde siempre.
 */
export function ChocoMap({ pins, hrefFor, activeSlug, bare = false, className }: Props) {
  const painted = paintMunicipalities(pins);
  // Los documentados van al final de las capas: son el contenido del mapa, así
  // que su asidero manda sobre el de un vecino sin documentar (ver la capa de
  // frente) y su color entra en escena después del gris.
  const layered = [...painted].sort(
    (a, b) => Number(a.tier !== "blank") - Number(b.tier !== "blank"),
  );
  const placed = placePins(pins);
  const ocean = bare ? null : placeOceanLabel(placed);
  const active = activeSlug ? painted.find((shape) => shape.city?.slug === activeSlug) : undefined;
  const interactive = Boolean(hrefFor) && !bare;
  const spotOf = new Map(placed.map((pin) => [pin.slug, pin]));

  return (
    <svg
      viewBox={viewBoxAttr}
      className={className}
      overflow="visible"
      role={interactive ? "group" : "img"}
      aria-label={
        bare
          ? "Situación del municipio dentro del Chocó"
          : `Mapa del Chocó con ${plural(pins.length, "municipio documentado", "municipios documentados")}`
      }
    >
      {bare ? (
        <path
          d={CHOCO_PATH}
          className="fill-land stroke-contour"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : (
        <>
          <defs>
            {layered.map((shape) => (
              <path
                key={shape.id}
                id={`${SHAPE}${shape.id}`}
                d={shape.d}
                vectorEffect={NON_SCALING}
              />
            ))}
          </defs>

          {/* Almohadilla del departamento: un matiz más oscuro que el papel, con
              juntas redondas, para que el Chocó se lea como una pieza y no como
              un recorte de tijera. */}
          <path
            d={CHOCO_PATH}
            className="fill-need-blank stroke-land"
            strokeWidth={CUSHION_STROKE}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ paintOrder: "stroke fill" }}
            aria-hidden
          />

          <g className="map-body" aria-hidden>
            {layered.map((shape, index) => (
              <use
                key={shape.id}
                href={`#${SHAPE}${shape.id}`}
                className={`map-fill ${TIER_FILL[shape.tier]}`}
                data-tier={shape.tier as NeedsTier}
                style={{ ["--i" as string]: index }}
              />
            ))}
          </g>

          <g className="map-channel" aria-hidden>
            {layered.map((shape) => (
              <use key={shape.id} href={`#${SHAPE}${shape.id}`} />
            ))}
          </g>

          {/* El elegido, con su propia capa por encima del canal: el contorno de
              tinta no se puede quedar a medias porque el papel de un vecino se
              pinte después. El aro que late es la llamada de atención y se va; la
              línea de tinta es el estado y se queda, que es lo que hace que
              siga diciéndolo sin movimiento. */}
          {active && (
            <g className="map-chosen" aria-hidden>
              <use href={`#${SHAPE}${active.id}`} className="map-chosen-pulse" />
              <use href={`#${SHAPE}${active.id}`} className="map-chosen-pad" />
              <use href={`#${SHAPE}${active.id}`} className="map-chosen-line" />
              {/* Y su color otra vez encima de la línea, que es lo que la deja
                  ENTERA POR FUERA de la forma. Sin esta cuarta pasada la mitad
                  del trazo cae dentro, y a los municipios que son una astilla
                  —Bahía Solano mide veinticinco unidades de ancho— el contorno
                  se les comía un cuarto del color. Marcar un pueblo no puede
                  costarle el dato que lo pinta. */}
              <use
                href={`#${SHAPE}${active.id}`}
                className={`map-chosen-face ${TIER_FILL[active.tier]}`}
              />
            </g>
          )}

          <g className="map-front">
            {layered.map((shape) => {
              const href = shape.city && hrefFor ? hrefFor(shape.city) : null;
              const spot = shape.city ? spotOf.get(shape.city.slug) : undefined;

              const body = (
                <>
                  <title>{shape.city?.name ?? shape.name}</title>
                  <use
                    href={`#${SHAPE}${shape.id}`}
                    className={`map-shape ${TIER_FILL[shape.tier]}`}
                  />
                  {/* Dos asideros invisibles, y los dos son para el pulgar. Hay
                      municipios que son una astilla —la parte más gruesa de
                      Bahía Solano mide 21 px en un teléfono— y acertarles la
                      forma es un juego. Uno rodea el punto; el otro es el
                      NOMBRE, que es el blanco más grande y más fácil que tiene
                      un municipio y al que de hecho apunta la gente. Ninguno se
                      ve; los dos abren el pueblo al que pertenecen, y por eso
                      pasar por encima del nombre también lo enciende. */}
                  {href && spot && (
                    <>
                      <circle
                        cx={spot.x}
                        cy={spot.y}
                        r={GRIP_RADIUS}
                        fill="transparent"
                        pointerEvents="fill"
                      />
                      <rect {...labelHitBox(spot)} fill="transparent" pointerEvents="fill" />
                    </>
                  )}
                </>
              );

              return href && shape.city ? (
                <Link
                  key={shape.id}
                  href={href}
                  scroll={false}
                  className="map-piece map-link"
                  aria-label={shape.city.name}
                >
                  {body}
                </Link>
              ) : (
                <g key={shape.id} className="map-piece">
                  {body}
                </g>
              );
            })}
          </g>
        </>
      )}

      {ocean && (
        <text
          x={ocean.x}
          y={ocean.y}
          className="fill-faint"
          fontSize={OCEAN_LABEL.fontSize}
          letterSpacing={OCEAN_LABEL.letterSpacing}
          transform={`rotate(-90 ${ocean.x} ${ocean.y})`}
          textAnchor="middle"
        >
          {OCEAN_LABEL.text}
        </text>
      )}

      <g pointerEvents="none">
        {/* Las guías van todas juntas y antes de los nombres: cada nombre lleva
            un halo de papel, así que si un rótulo y una guía ajena se cruzan,
            gana el rótulo. Con una guía por pueblo dentro de su propio grupo, la
            del último cruzaba el nombre del primero. */}
        <g className="map-leaders" aria-hidden>
          {placed.map((pin) => {
            const leader = leaderFor(pin);
            return leader ? (
              <line
                key={pin.id}
                data-tier={tierOf(painted, pin.slug)}
                className="map-leader"
                {...leader}
              />
            ) : null;
          })}
        </g>

        {placed.map((pin) => {
          const isActive = pin.slug === activeSlug;

          return (
            <g key={pin.id} data-tier={tierOf(painted, pin.slug)} className="map-pin">
              <circle
                cx={pin.x}
                cy={pin.y}
                r={bare ? 15 : isActive ? 7.5 : 6.5}
                className={`stroke-paper ${bare ? "fill-accent" : "fill-ink"}`}
                strokeWidth={bare ? 5 : isActive ? 4 : 3}
              />

              {!bare && (
                <text
                  x={pin.labelX}
                  y={pin.labelY + LABEL_BASELINE}
                  textAnchor={pin.anchor}
                  fontSize={CITY_LABEL.fontSize}
                  letterSpacing={CITY_LABEL.letterSpacing}
                  fontWeight={isActive ? 600 : 500}
                  className={`stroke-paper ${isActive ? "fill-ink" : "fill-body"}`}
                  strokeWidth={5}
                  style={{ paintOrder: "stroke" }}
                >
                  {pin.name}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

const tierOf = (painted: { tier: NeedsTier; city: { slug: string } | null }[], slug: string) =>
  painted.find((shape) => shape.city?.slug === slug)?.tier ?? "blank";
