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
import { paintMunicipalities, TIER_FILL, TIER_STROKE } from "@/lib/needs-scale";

type Props = {
  pins: MapPin[];
  /** Construye el enlace de cada municipio documentado. Sin esto el mapa es un
   *  dibujo: se usa así en la ficha, donde no hay a dónde ir. */
  hrefFor?: (pin: MapPin) => string;
  /** Municipio elegido: se le marca el punto, no un filete. Un contorno de tinta
   *  sobre el mosaico abre un hueco de papel entre vecinos. */
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
 * El Chocó como mosaico de sus 30 municipios, coloreados por cuánto falta
 * por cubrir.
 *
 * Sin JavaScript y sin servicio de mapas: es SVG renderizado en el servidor y
 * los enlaces son <a>, así que /mapa funciona con la señal del Chocó y
 * compartido por WhatsApp. Las formas son del DANE (lib/choco-texture) y no se
 * mueven nunca: no hay cámara, ni zoom, ni máscara, ni detalle de calles.
 *
 * Cada forma se pinta de un tono plano. El trazo es del mismo color, fino, y
 * va debajo del relleno: cubre las rendijas del DANE sin dibujar un filete.
 * Un contorno negro o uno de papel entre pueblos es exactamente el hueco que
 * se veía alrededor de Quibdó.
 */
export function ChocoMap({ pins, hrefFor, activeSlug, bare = false, className }: Props) {
  const painted = paintMunicipalities(pins);
  // Los sin documentar van debajo: así el trazo de un pueblo en color sella
  // la junta y no deja asomar el papel entre dos formas que no coinciden al
  // píxel —el DANE simplificado deja rendijas de menos de una unidad.
  const layered = [...painted].sort(
    (a, b) => Number(a.tier !== "blank") - Number(b.tier !== "blank"),
  );
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
      {bare ? (
        <path
          d={CHOCO_PATH}
          className="fill-land stroke-contour"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
      ) : (
        <>
          {/* Base del departamento: si dos polígonos del DANE no se tocan al
              píxel, lo que asoma es el gris de «sin documentar», no el papel. */}
          <path d={CHOCO_PATH} className="fill-need-blank" />
          {layered.map((shape) => {
            const href = shape.city && hrefFor ? hrefFor(shape.city) : null;

            const region = (
              <path
                d={shape.d}
                className={`${TIER_FILL[shape.tier]} ${TIER_STROKE[shape.tier]}`}
                strokeWidth={1.2}
                strokeLinejoin="round"
                strokeLinecap="round"
                style={{ paintOrder: "stroke fill" }}
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
          })}
        </>
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
