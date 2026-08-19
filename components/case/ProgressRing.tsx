/**
 * El anillo de avance: el porcentaje dentro de la circunferencia.
 *
 * Es el recurso que se trae de la referencia, y se trae por el motivo por el que
 * ella lo usa y no porque quede bien: un anillo mete el avance en una barra fija
 * sin gastar ancho. Una barra lineal en esa fila obliga a elegir entre la barra y
 * el botón; el anillo cabe al lado de los dos.
 *
 * Se dibuja en el servidor y es SVG plano: sin JavaScript se ve igual, y como no
 * hay ninguna transición no hay nada que `prefers-reduced-motion` tenga que
 * apagar. El arco es un `stroke-dasharray` calculado aquí, no una animación de
 * CSS que empiece en cero —eso, con el movimiento reducido, se queda en el cero—.
 *
 * El radio no es redondo a propósito: 15,9155 deja la circunferencia en 100
 * unidades exactas, así que el arco es `${percent} 100` y el porcentaje entra en
 * el dibujo sin una regla de tres que pueda quedarse desfasada del rótulo.
 *
 * Registro sobrio: el canal va en `canvas` —la superficie hundida que ya usan
 * las barras del portal— y el arco en `accent`, que es el verde que aguanta como
 * palabra (6,13:1 sobre papel). Ni `liana` ni `brote`, que aquí están prohibidos,
 * y ninguno de la escala cálida: esto no es un estado de necesidad, es una
 * medida, y pintarla con los tonos de la escala la metería en esa familia.
 */

const RADIUS = 15.9155;

const SIZES = {
  sm: {
    box: "size-11",
    width: 3.4,
    text: "text-[11px] font-medium",
  },
  lg: {
    box: "size-[68px]",
    width: 3,
    text: "font-display text-[19px]",
  },
} as const;

export function ProgressRing({
  percent,
  label,
  size = "sm",
  tone = "paper",
}: {
  /** 0–100, o nulo cuando no hay nada que medir todavía. */
  percent: number | null;
  /** El nombre accesible: la frase entera con los importes sin abreviar. */
  label: string;
  size?: keyof typeof SIZES;
  tone?: "paper" | "photo";
}) {
  const { box, width, text } = SIZES[size];
  const onPhoto = tone === "photo";
  const track = onPhoto ? "text-paper/30" : "text-canvas";
  const arc = onPhoto ? "text-paper" : "text-accent";
  const ink = onPhoto ? "text-paper" : "text-ink";

  return (
    <div role="img" aria-label={label} className={`relative shrink-0 ${box}`}>
      <svg viewBox="0 0 36 36" className="size-full -rotate-90" aria-hidden focusable="false">
        <circle
          cx="18"
          cy="18"
          r={RADIUS}
          fill="none"
          strokeWidth={width}
          className={track}
          stroke="currentColor"
        />
        {percent !== null && percent > 0 && (
          <circle
            cx="18"
            cy="18"
            r={RADIUS}
            fill="none"
            strokeWidth={width}
            strokeDasharray={`${percent} 100`}
            strokeLinecap="round"
            className={arc}
            stroke="currentColor"
          />
        )}
      </svg>

      {/* El número va en HTML y no en un `<text>` del SVG para que le lleguen la
          tipografía de titulares y `tabular-nums`: dentro del SVG habría que
          repetir la fuente a mano y se quedaría atrás en cuanto cambie.

          Con el anillo vacío va una raya y no un «0 %». Es la diferencia entre
          «esto no ha empezado» y «esto va por cero», que es lo que se lee como
          fracaso; lo que ha pasado de verdad lo dice la frase de al lado. */}
      <span
        aria-hidden
        className={`absolute inset-0 flex items-center justify-center tabular-nums ${text} ${
          percent === null ? (onPhoto ? "text-paper/60" : "text-faint") : ink
        }`}
      >
        {percent === null ? "–" : `${percent}%`}
      </span>
    </div>
  );
}
