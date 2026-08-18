import {
  CHOCO_IN_COLOMBIA_PATH,
  CHOCO_LABEL_ANCHOR,
  COLOMBIA_FRAME,
  COLOMBIA_PATH,
} from "@/lib/colombia-map";

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
  /** Cambiar solo si hay dos localizadores en la misma página. */
  clipId?: string;
};

/**
 * Colombia con el Chocó resaltado. SVG en el servidor, sin JavaScript.
 */
export function ColombiaLocator({ className, named = false, clipId = "recorte-colombia" }: Props) {
  return (
    <svg
      viewBox={`0 0 ${COLOMBIA_FRAME.width} ${COLOMBIA_FRAME.height}`}
      className={className}
      role="img"
      aria-label="Mapa de Colombia con el departamento del Chocó resaltado"
    >
      <defs>
        {/* El contorno de Colombia es más grueso que el del Chocó, así que sin
            recorte el departamento sobresale unos píxeles sobre el Pacífico. */}
        <clipPath id={clipId}>
          <path d={COLOMBIA_PATH} />
        </clipPath>
      </defs>

      <path
        d={COLOMBIA_PATH}
        className="fill-land stroke-contour"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path d={CHOCO_IN_COLOMBIA_PATH} className="fill-accent" clipPath={`url(#${clipId})`} />

      {/* El nombre va fuera, con una guía hasta el departamento, y no encima. El
          Chocó mide sesenta unidades de ancho en este marco: escrito dentro tiene
          que bajar a un cuerpo que en pantalla son ocho píxeles, y a ese tamaño
          deja de ser un nombre y es una mancha clara sobre el verde. Fuera cabe al
          cuerpo que se lee, y hacia el este porque al oeste solo hay cuarenta
          unidades antes del filo del marco. */}
      {named && (
        <g>
          <line
            x1={CHOCO_LABEL_ANCHOR.x + 40}
            y1={CHOCO_LABEL_ANCHOR.y}
            x2={CHOCO_LABEL_ANCHOR.x + 64}
            y2={CHOCO_LABEL_ANCHOR.y}
            className="stroke-line-strong"
            strokeWidth={1.5}
          />
          <text
            x={CHOCO_LABEL_ANCHOR.x + 72}
            y={CHOCO_LABEL_ANCHOR.y + 8}
            className="fill-ink"
            fontSize={22}
            fontWeight={600}
            letterSpacing={2}
          >
            CHOCÓ
          </text>
        </g>
      )}
    </svg>
  );
}
