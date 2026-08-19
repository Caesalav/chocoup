import Link from "next/link";
import { card, moneyTrack } from "@/components/ui/styles";
import { plural, relativeDays } from "@/lib/format";
import { shortCOP } from "@/lib/money-progress";
import type { PortalTotals } from "@/lib/types";

/**
 * El estado del registro, en una cifra: qué parte del problema ya tiene dinero.
 *
 * La referencia celebra; esto documenta un terremoto: un porcentaje, una barra
 * y ni un adjetivo. La barra crece con lo donado sobre la meta de todas las
 * causas, que es el denominador del portal entero. No cuenta causas cerradas:
 * una causa con la mitad del dinero no está «medio solucionada» como fila, y
 * sí mueve el problema.
 *
 * Los números salen de la misma consulta (`getPortalTotals`) para que no puedan
 * contradecirse en la misma pantalla.
 */
export function ProgressCard({ totals }: { totals: PortalTotals }) {
  const { goal, donated } = totals.budget;
  const hasGoal = goal > 0;
  const percent = hasGoal ? Math.min(100, Math.round((donated / goal) * 100)) : 0;

  return (
    <div className={`${card} p-4`}>
      <div className="flex items-start justify-between gap-4">
        <p className="font-display text-[26px] leading-none tabular-nums text-ink">
          {hasGoal ? (
            <>
              {percent}
              <span className="text-faint"> %</span>{" "}
              <span className="font-sans text-[15px] font-normal text-muted">resuelto</span>
            </>
          ) : (
            <span className="font-sans text-[15px] font-normal text-muted">Sin meta aún</span>
          )}
        </p>

        <Link
          href="/donaciones"
          className="shrink-0 rounded-full border border-line-strong px-4 py-2 text-[13px] font-medium text-body transition-[border-color,color,scale] duration-150 hover:border-ink/40 hover:text-ink active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Ver
        </Link>
      </div>

      {/* El canal va en `canvas`, una superficie por debajo del papel: sobre una
          tarjeta blanca es el único hueco que se ve sin dibujarle un borde. Lo
          donado es lima, el mismo tramo que en las pistas de cada causa. */}
      <div
        role="img"
        aria-label={
          hasGoal
            ? `${percent} por ciento del problema resuelto`
            : "Todavía no hay una meta en dinero"
        }
        className={`mt-4 h-2 overflow-hidden rounded-full ${moneyTrack.rest}`}
      >
        <div
          className={`h-full rounded-full ${moneyTrack.donated}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2.5 text-[12px] text-faint">
        {!hasGoal
          ? "Todavía no hay una meta en dinero"
          : `${shortCOP(donated)} donados de ${shortCOP(goal)} · ${plural(totals.cities, "municipio", "municipios")}`}
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
