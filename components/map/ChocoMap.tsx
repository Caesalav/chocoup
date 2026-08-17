import Link from "next/link";
import { CHOCO_PATH, LAND, placePins, viewBoxAttr, type MapPin } from "@/lib/choco-map";
import { MUNICIPALITIES, NEIGHBOURS_PATH, RIVERS_PATH } from "@/lib/choco-texture";

type Props = {
  pins: MapPin[];
  /** Con valor, cada ciudad enlaza a `${linkBase}/${slug}`. */
  linkBase?: string;
  /** Ciudad que se resalta, para la vista de un solo municipio. */
  activeSlug?: string;
  /** Oculta rótulos y textura, para usos pequeños donde solo importa la forma. */
  bare?: boolean;
  /** El tamaño lo decide quien lo usa: el lienzo lo limita en alto y la ficha en ancho. */
  className: string;
  /** Cambiar solo si hay dos mapas detallados en la misma página. */
  clipId?: string;
};

const TONES = ["fill-land-1", "fill-land-2", "fill-land-3", "fill-land-4"];

/**
 * Esquema del Chocó con las ciudades documentadas.
 *
 * Sin JavaScript y sin servicio de mapas: es SVG renderizado en el servidor y
 * los enlaces son <a>. La textura son tres capas de datos abiertos horneadas en
 * el bundle (municipios, ríos y departamentos vecinos), unos 19 KB en total.
 *
 * Los trazos anchos detrás del relleno dejan solo su mitad exterior a la vista,
 * lo que produce el halo de curvas de nivel alrededor de la costa.
 */
export function ChocoMap({
  pins,
  linkBase,
  activeSlug,
  bare = false,
  className,
  clipId = "recorte-choco",
}: Props) {
  const placed = placePins(pins);

  return (
    <svg
      viewBox={viewBoxAttr}
      className={className}
      role="img"
      aria-label={`Mapa del Chocó con ${pins.length} municipios documentados`}
    >
      {!bare && (
        <defs>
          <clipPath id={clipId}>
            <path d={CHOCO_PATH} />
          </clipPath>
        </defs>
      )}

      {/* Departamentos vecinos: masas de tierra apenas insinuadas, para que el
          Chocó no flote en el vacío. Sin relleno se leerían como alambres. */}
      {!bare && (
        <>
          <path d={NEIGHBOURS_PATH} className="fill-neighbour" />
          <path
            d={NEIGHBOURS_PATH}
            className="fill-none stroke-contour"
            strokeWidth={1}
            opacity={0.3}
          />
        </>
      )}

      {/* Halo de curvas de nivel alrededor de la costa. */}
      <g className="stroke-contour">
        <path d={CHOCO_PATH} className="fill-none" strokeWidth={52} opacity={0.09} />
        <path d={CHOCO_PATH} className="fill-none" strokeWidth={34} opacity={0.12} />
        <path d={CHOCO_PATH} className="fill-none" strokeWidth={18} opacity={0.18} />
      </g>

      <path d={CHOCO_PATH} className="fill-land" />

      {/* Mosaico de los 30 municipios: la textura principal del mapa. */}
      {!bare && (
        <g clipPath={`url(#${clipId})`}>
          {MUNICIPALITIES.map((municipality) => (
            <path
              key={municipality.id}
              d={municipality.d}
              className={`${TONES[municipality.tone]} stroke-border-muni`}
              strokeWidth={0.8}
            />
          ))}
          <path d={RIVERS_PATH} className="fill-none stroke-water" strokeWidth={3.5} />
        </g>
      )}

      <path
        d={CHOCO_PATH}
        className="fill-none stroke-contour"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {!bare && (
        <text
          x={-108}
          y={LAND.height * 0.32}
          className="fill-faint"
          fontSize={24}
          letterSpacing={5}
          transform={`rotate(-90 ${-108} ${LAND.height * 0.32})`}
          textAnchor="middle"
        >
          OCÉANO PACÍFICO
        </text>
      )}

      {placed.map((pin) => {
        const featured = pin.featured || pin.slug === activeSlug;
        const radius = featured ? 17 : 14;

        const mark = (
          <g className="[&_circle]:transition-transform hover:[&_circle]:scale-110">
            {Math.abs(pin.labelY - pin.y) > 2 && (
              <line
                x1={pin.x}
                y1={pin.y}
                x2={pin.labelX + (pin.anchor === "end" ? 6 : -6)}
                y2={pin.labelY - 7}
                className="stroke-line-strong"
                strokeWidth={1.5}
              />
            )}

            {featured && (
              <circle
                cx={pin.x}
                cy={pin.y}
                r={radius + 9}
                className="fill-none stroke-amber"
                strokeWidth={2}
                opacity={0.45}
              />
            )}
            <circle
              cx={pin.x}
              cy={pin.y}
              r={radius + 3}
              className="fill-base"
              opacity={0.55}
            />
            <circle
              cx={pin.x}
              cy={pin.y}
              r={radius}
              className={featured ? "fill-amber" : "fill-teal"}
            />
            {pin.index !== undefined && (
              <text
                x={pin.x}
                y={pin.y + 6}
                textAnchor="middle"
                fontSize={16}
                className={featured ? "fill-base" : "fill-ink"}
                fontWeight={500}
              >
                {String(pin.index).padStart(2, "0")}
              </text>
            )}

            {!bare && (
              <text
                x={pin.labelX}
                y={pin.labelY + 9}
                textAnchor={pin.anchor}
                fontSize={27}
                className={`stroke-base ${featured ? "fill-ink" : "fill-body"}`}
                strokeWidth={7}
                style={{ paintOrder: "stroke" }}
              >
                {pin.name}
              </text>
            )}
          </g>
        );

        return linkBase ? (
          <Link key={pin.id} href={`${linkBase}/${pin.slug}`} aria-label={pin.name}>
            {mark}
          </Link>
        ) : (
          <g key={pin.id}>{mark}</g>
        );
      })}
    </svg>
  );
}
