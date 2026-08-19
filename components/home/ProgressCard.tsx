import Link from "next/link";
import { card } from "@/components/ui/styles";
import { plural, relativeDays } from "@/lib/format";
import type { PortalTotals } from "@/lib/types";

/**
 * Donde la referencia tiene la tarjeta de puntos, aquí va el estado real del
 * registro: cuántas necesidades se han anotado y cuántas están cerradas.
 *
 * El tono es lo que decide esta pieza. La referencia celebra —"¡ya casi!", un
 * descuento, una llama—, y esto documenta un terremoto: son dos cifras, una
 * barra y ni un adjetivo. La barra crece con lo cubierto, no con lo que falta,
 * porque lo que falta es la lista entera y no un logro a medias.
 *
 * Los números salen de la misma consulta (getPortalTotals) para que no puedan
 * contradecirse en la misma pantalla.
 */
export function ProgressCard({ totals }: { totals: PortalTotals }) {
  const done = totals.needs > 0 ? Math.round((totals.coveredNeeds / totals.needs) * 100) : 0;

  return (
    <div className={`${card} p-4`}>
      <div className="flex items-start justify-between gap-4">
        <p className="font-display text-[26px] leading-none tabular-nums text-ink">
          {totals.coveredNeeds}
          <span className="text-faint"> /{totals.needs}</span>{" "}
          <span className="font-sans text-[15px] font-normal text-muted">ítems</span>
        </p>

        <Link
          href="/casos"
          className="shrink-0 rounded-full border border-line-strong px-4 py-2 text-[13px] font-medium text-body transition-[border-color,color,scale] duration-150 hover:border-ink/40 hover:text-ink active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Ver
        </Link>
      </div>

      {/* El canal va en `canvas`, una superficie por debajo del papel: sobre una
          tarjeta blanca es el único hueco que se ve sin dibujarle un borde. */}
      <div
        role="img"
        aria-label={`${totals.coveredNeeds} de ${totals.needs} ítems comprados`}
        className="mt-4 h-2 overflow-hidden rounded-full bg-canvas"
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${done}%` }} />
      </div>

      <p className="mt-2.5 text-[12px] text-faint">
        {totals.coveredNeeds} comprados ·{" "}
        {plural(totals.openNeeds, "pendiente", "pendientes")} en{" "}
        {plural(totals.cities, "municipio", "municipios")}
      </p>

      {/* Cuándo se tocó esto por última vez. En el móvil va arriba del inicio,
          en una pastilla al lado de la marca; en escritorio la marca se mudó a
          la cabecera y esa pastilla se quedaba flotando sola, así que el dato
          baja aquí, junto al resto del estado del registro. Nunca se ve dos
          veces: el de arriba se retira a partir de `lg` y este solo existe a
          partir de `lg`. */}
      {totals.updatedAt && (
        <p className="mt-1 hidden items-center gap-2 border-t border-line pt-2.5 text-[12px] text-faint lg:flex">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />
          {relativeDays(totals.updatedAt)}
        </p>
      )}
    </div>
  );
}
