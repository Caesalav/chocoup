import { NEEDS_LEGEND, TIER_DOT, type NeedsTier } from "@/lib/needs-scale";

/**
 * Leyenda del mapa.
 *
 * Dice "cuánto falta" y no "gravedad" a propósito: el color es el resto de
 * cubrir las necesidades de ese pueblo. Un municipio en gris no está bien,
 * está sin visitar. Uno documentado sin casos abiertos va en verde: se fue,
 * y ahora mismo no hay nada que reportar.
 *
 * Cada tramo es una pastilla: al pasar por encima, el tablero (`.map-board`)
 * apaga los pueblos de otro color. Es la misma lección que el mosaico, dicha
 * con palabras, y no hace falta JavaScript.
 */
export function NeedsLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
      <p className="text-[11px] text-faint">Cuánto falta</p>
      <ul className="flex flex-wrap items-center gap-1">
        {NEEDS_LEGEND.map((step) => (
          <li key={step.tier}>
            <LegendStep tier={step.tier} label={step.label} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegendStep({ tier, label }: { tier: NeedsTier; label: string }) {
  return (
    <span
      data-tier={tier}
      tabIndex={0}
      className="legend-step inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-transparent px-2 py-1 text-[12px] text-muted transition-[border-color,background-color,color] duration-150 hover:border-line hover:bg-panel-high hover:text-ink focus-visible:border-ink/30 focus-visible:bg-panel-high focus-visible:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span
        className={`size-2.5 shrink-0 rounded-full border border-line ${TIER_DOT[tier]}`}
      />
      <span className="tabular-nums">{label}</span>
    </span>
  );
}
