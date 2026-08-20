import { NEEDS_LEGEND, TIER_DOT, type NeedsTier } from "@/lib/needs-scale";

/**
 * Leyenda del mapa: la escala, y para qué está.
 *
 * Dice "cuánto falta" y no "gravedad" a propósito: el color es el resto de
 * cubrir las necesidades de ese pueblo. Un municipio en gris no está bien,
 * está sin visitar. Uno documentado sin casos abiertos va en verde: se fue,
 * y ahora mismo no hay nada que reportar.
 *
 * De ahí la frase que la abre. La clave de un atlas explica un dibujo y ahí
 * termina; el rojo de este mapa no es un accidente del terreno, es trabajo sin
 * hacer, así que la frase dice qué mide el color y en qué dirección se lee. Los
 * cinco rótulos son los mismos —son las palabras de las pastillas del resto del
 * portal— y lo que cambia es para qué se enseñan.
 *
 * «Sin documentar» va con filete de puntos: no es el tramo blando de la escala
 * sino la ausencia del dato, y el sitio en la fila no puede decirlo por él
 * —según lo ancha que sea la pantalla cae al final de un renglón o al principio
 * del siguiente—.
 *
 * Cada tramo es una pastilla: al pasar por encima —o al llegar con el
 * tabulador—, el tablero (`.map-board`) apaga los pueblos de otro color. Es la
 * misma lección que el mosaico, dicha con palabras, y no hace falta JavaScript.
 *
 * Vale para las dos vistas de /mapa sin saber en cuál está: `.map-board` es el
 * contenedor de la pantalla, no el dibujo, así que el mismo `:has()` alcanza a
 * los treinta municipios del tablero y a los treinta del Chocó dentro de
 * Colombia. Lo único que se les pide es la clase y el tramo del mosaico.
 */
const TONOS = {
  claro: {
    lead: "text-muted",
    step: "text-muted hover:bg-panel-high hover:text-ink focus-visible:bg-panel-high focus-visible:text-ink focus-visible:outline-accent",
    blank: "border-dashed border-line-strong",
    rest: "border-transparent hover:border-line focus-visible:border-ink/30",
  },
  oscuro: {
    lead: "text-luz/70",
    step: "text-luz/75 hover:bg-luz/12 hover:text-luz focus-visible:bg-luz/12 focus-visible:text-luz focus-visible:outline-luz",
    blank: "border-dashed border-luz/35",
    rest: "border-transparent hover:border-luz/25 focus-visible:border-luz/40",
  },
} as const;

export function NeedsLegend({
  tone = "claro",
}: {
  /** `oscuro` es el campo de selva del mapa: la tinta clara es la que se lee. */
  tone?: keyof typeof TONOS;
}) {
  const t = TONOS[tone];

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
      <p className={`text-[11px] ${t.lead}`}>
        El color es lo que falta. El rojo es lo que hay que bajar.
      </p>
      <ul className="flex flex-wrap items-center gap-1">
        {NEEDS_LEGEND.map((step) => (
          <li key={step.tier}>
            <LegendStep tier={step.tier} label={step.label} tone={t} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegendStep({
  tier,
  label,
  tone: t,
}: {
  tier: NeedsTier;
  label: string;
  tone: (typeof TONOS)[keyof typeof TONOS];
}) {
  // El hueco lleva su filete puesto y no lo cambia al tocarlo: el resto de los
  // tramos sacan uno al pasar por encima porque ahí el filete es la respuesta al
  // cursor, y en este es el dato.
  const frame = tier === "blank" ? t.blank : t.rest;

  return (
    <span
      data-tier={tier}
      tabIndex={0}
      className={`legend-step inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2 py-1 text-[12px] transition-[border-color,background-color,color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${t.step} ${frame}`}
    >
      <span
        className={`size-2.5 shrink-0 rounded-full border border-line ${TIER_DOT[tier]}`}
      />
      <span className="tabular-nums">{label}</span>
    </span>
  );
}
