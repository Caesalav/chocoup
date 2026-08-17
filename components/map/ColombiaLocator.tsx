import { CHOCO_IN_COLOMBIA_PATH, COLOMBIA_FRAME, COLOMBIA_PATH } from "@/lib/colombia-map";

type Props = {
  /** El tamaño lo decide quien lo usa; sin valor por defecto para que no gane
   *  un w-full sobre el ancho que pide la página. */
  className: string;
  /** Cambiar solo si hay dos localizadores en la misma página. */
  clipId?: string;
};

/**
 * Colombia con el Chocó resaltado. SVG en el servidor, sin JavaScript.
 */
export function ColombiaLocator({ className, clipId = "recorte-colombia" }: Props) {
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
      <path d={CHOCO_IN_COLOMBIA_PATH} className="fill-amber" clipPath={`url(#${clipId})`} />
    </svg>
  );
}
