import Link from "next/link";
import {
  CHOCO_PATH,
  CITY_LABEL,
  LABEL_BASELINE,
  OCEAN_LABEL,
  placeOceanLabel,
  placePins,
  viewBoxAttr,
  type MapPin,
} from "@/lib/choco-map";
import { plural } from "@/lib/format";
import { paintMunicipalities, TIER_FILL } from "@/lib/needs-scale";
import { PaletteFillDefs } from "@/components/ui/PaletteFillDefs";

type Props = {
  pins: MapPin[];
  /** Construye el enlace de cada municipio documentado. Sin esto el mapa es un
   *  dibujo: se usa así en la ficha, donde no hay a dónde ir. */
  hrefFor?: (pin: MapPin) => string;
  /** Municipio elegido: se le marca el contorno y el resto se apaga un punto. */
  activeSlug?: string;
  /** Solo la silueta y el punto, para usos diminutos donde el mosaico se
   *  convertiría en papilla: a 96 px de ancho, la separación entre municipios
   *  mide menos de medio píxel. */
  bare?: boolean;
  /** El tamaño lo decide quien lo usa: /mapa lo limita en alto, la ficha de un
   *  municipio en ancho. */
  className: string;
};

/** Separación entre municipios: es el papel del fondo asomando entre las formas,
 *  no una línea de color, así que el mosaico funciona sobre cualquier fondo. */
const GAP = 3;

/**
 * El Chocó como mosaico de sus 30 municipios, coloreados por cuánto falta
 * por cubrir.
 *
 * Sin JavaScript y sin servicio de mapas: es SVG renderizado en el servidor y
 * los enlaces son <a>, así que /mapa funciona con la señal del Chocó y
 * compartido por WhatsApp. Las formas son del DANE (lib/choco-texture) y no se
 * mueven nunca: no hay cámara, ni zoom, ni máscara, ni detalle de calles.
 * Elegir un municipio cambia colores y contornos, jamás el encuadre.
 */
export function ChocoMap({ pins, hrefFor, activeSlug, bare = false, className }: Props) {
  const painted = paintMunicipalities(pins);
  const active = activeSlug ? painted.find((shape) => shape.city?.slug === activeSlug) : undefined;
  const placed = placePins(pins);
  const ocean = bare ? null : placeOceanLabel(placed);

  // Con enlaces dentro, el mapa no puede ser role="img": ese rol convierte en
  // decoración todo lo que hay debajo y los municipios dejarían de existir para
  // un lector de pantalla. Como grupo con nombre se anuncia el mapa y, dentro,
  // cada municipio.
  const interactive = Boolean(hrefFor) && !bare;

  return (
    <svg
      viewBox={viewBoxAttr}
      className={className}
      role={interactive ? "group" : "img"}
      aria-label={
        bare
          ? "Situación del municipio dentro del Chocó"
          : `Mapa del Chocó con ${plural(pins.length, "municipio documentado", "municipios documentados")}`
      }
    >
      <PaletteFillDefs />
      {bare ? (
        <path
          d={CHOCO_PATH}
          className="fill-land stroke-contour"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
      ) : (
        painted.map((shape) => {
          const href = shape.city && hrefFor ? hrefFor(shape.city) : null;
          // Con un municipio elegido los demás bajan un punto. No desaparecen:
          // la silueta del departamento la forman los 30, no los documentados.
          const dimmed = Boolean(active) && shape.id !== active?.id;

          const region = (
            <path
              d={shape.d}
              className={`${TIER_FILL[shape.tier]} stroke-paper`}
              strokeWidth={GAP}
              strokeLinejoin="round"
              opacity={dimmed ? 0.7 : undefined}
            />
          );

          return href && shape.city ? (
            <Link
              key={shape.id}
              href={href}
              scroll={false}
              aria-label={shape.city.name}
              className="map-region"
            >
              {region}
            </Link>
          ) : (
            <g key={shape.id}>{region}</g>
          );
        })
      )}

      {/* El contorno del elegido va en su propia pasada, encima del mosaico
          entero: dentro del grupo lo taparía la separación de sus vecinos, que
          se dibujan después. */}
      {active && !bare && (
        <path
          d={active.d}
          className="fill-none stroke-ink"
          strokeWidth={4}
          strokeLinejoin="round"
          pointerEvents="none"
        />
      )}

      {/* El rótulo del mar va donde queda sitio: la altura y la separación de la
          costa las calcula `placeOceanLabel` a partir de la silueta y de los
          nombres ya colocados. Si no queda hueco no se dibuja, que es mejor que
          cruzarse con el nombre de un municipio. */}
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

      {/* Rótulos al final, para que ninguna forma posterior los tape, y sin
          puntero: lo que se pulsa es el municipio, que es un blanco enorme. El
          nombre además está en la lista de al lado. */}
      <g pointerEvents="none">
        {placed.map((pin) => {
          const isActive = pin.slug === activeSlug;

          return (
            <g key={pin.id}>
              {Math.abs(pin.labelY - pin.y) > 2 && (
                <line
                  x1={pin.x}
                  y1={pin.y}
                  x2={pin.labelX + (pin.anchor === "end" ? 6 : -6)}
                  y2={pin.labelY - 5}
                  className="stroke-line-strong"
                  strokeWidth={1.5}
                />
              )}

              {/* Sobre el mosaico el punto va en tinta, que se lee igual encima
                  del gris y encima del rojo profundo; en la ficha, donde el
                  fondo es tierra plana y no hay escala que respetar, marca el
                  "aquí" con el verde de marca. Y ahí va tres veces más grande
                  porque el radio son unidades de mapa: a 96 px de ancho, un
                  punto de cinco unidades es medio píxel. */}
              <circle
                cx={pin.x}
                cy={pin.y}
                r={bare ? 15 : 6}
                className={`stroke-paper ${bare ? "fill-accent" : "fill-ink"}`}
                strokeWidth={bare ? 5 : 2}
              />

              {/* El trazo del color del papel hace de halo bajo las letras: el
                  rótulo cae casi siempre sobre un municipio vecino y sin él se
                  pierde contra el relleno. */}
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
                  {pin.name.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
