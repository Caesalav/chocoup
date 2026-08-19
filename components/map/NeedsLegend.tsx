import { NEEDS_LEGEND, TIER_DOT } from "@/lib/needs-scale";

/**
 * Leyenda del mapa.
 *
 * Dice "cuánto falta" y no "gravedad" a propósito: el color es el resto de
 * cubrir las necesidades de ese pueblo. Un municipio en gris no está bien,
 * está sin visitar. Uno documentado sin casos abiertos va en verde: se fue,
 * y ahora mismo no hay nada que reportar.
 */
export function NeedsLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
      <p className="text-[11px] text-faint">Cuánto falta</p>
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {NEEDS_LEGEND.map((step) => (
          <li key={step.tier} className="flex items-center gap-1.5 text-[12px] text-muted">
            <span
              className={`size-2.5 shrink-0 rounded-[3px] border border-line ${TIER_DOT[step.tier]}`}
            />
            <span className="tabular-nums">{step.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
