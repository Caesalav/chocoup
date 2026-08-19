import { formatCOP } from "@/lib/format";
import type { BudgetProgress } from "@/lib/budget";

/**
 * Cuánto se ha donado a una causa, en una sola barra.
 *
 * Es la pieza de los listados: en la ficha completa sigue viviendo
 * `CaseProgressBar`, que enseña lo comprado y lo declarado por separado. Aquí
 * solo cabe una cifra, y es la que Charlie pidió para las listas: lo donado.
 * El relleno es donado / meta. Si todavía no hay meta, no se dibuja nada —
 * un 0 % fingido diría que no se ha hecho nada cuando lo que pasa es que
 * todavía no se ha anotado el plan.
 *
 * El importe va a 15 px y en negrita. La descripción de la tarjeta, al lado,
 * tiene que ser más pequeña que esta línea.
 */
export function DonationMeter({ budget }: { budget: BudgetProgress }) {
  if (budget.goal === 0) return null;

  const ratio = Math.min(1, Math.max(0, budget.donated / budget.goal));
  const percent = Math.round(ratio * 100);

  return (
    <div className="mt-2">
      <div
        className="h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`Donado ${formatCOP(budget.donated)} de ${formatCOP(budget.goal)}`}
      >
        <div
          className="h-full rounded-full bg-selva"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1.5 text-[15px] font-medium leading-none tabular-nums text-ink">
        Donado {formatCOP(budget.donated)}
        <span className="font-normal text-muted"> de {formatCOP(budget.goal)}</span>
      </p>
    </div>
  );
}
