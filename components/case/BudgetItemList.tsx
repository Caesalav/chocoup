import { CheckIcon } from "@/components/ui/icons";
import { formatCOP, formatDay } from "@/lib/format";
import type { BudgetItem } from "@/lib/budget";

/**
 * Las líneas del presupuesto, con precio y visto si ya se compraron.
 *
 * El equipo marca cada ítem cuando lo paga con lo donado. Lo pendiente sigue
 * a la vista, con su precio, para que se sepa en qué se va a gastar el resto.
 */
export function BudgetItemList({
  items,
  emptyLabel = "Todavía no hay un presupuesto anotado para esta causa.",
  framed = true,
}: {
  items: BudgetItem[];
  emptyLabel?: string;
  /** Sin marco, para meter la lista dentro de un `<details>`. */
  framed?: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-[14px] leading-relaxed text-muted">{emptyLabel}</p>;
  }

  const ordered = [...items].sort(
    (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
  );

  return (
    <ul
      className={
        framed ? "divide-y divide-line rounded-2xl border border-line bg-panel-high" : "divide-y divide-line"
      }
    >
      {ordered.map((item) => (
        <li key={item.id} className="flex items-start gap-3 px-4 py-3.5">
          <span
            aria-hidden
            /* El visto va en el lavado de `accent` y no en un campo de `brote`:
               esto es la ficha de una persona y ahí `brote` está prohibido —lo
               comprueba el `lint`—. Es además la receta que ya usa la pastilla
               «Cubierta», que es la forma de «hecho» que tiene el sistema:
               `accent-strong` sobre este relleno da 7,10:1. */
            className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border ${
              item.purchased
                ? "border-accent bg-accent-soft text-accent-strong"
                : "border-line-strong bg-panel text-transparent"
            }`}
          >
            <CheckIcon className="size-3.5 stroke-[2.5]" />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={`text-[15px] leading-snug ${
                item.purchased ? "text-muted line-through" : "text-ink"
              }`}
            >
              {item.title}
            </p>
            {/* La fecha de la compra va aquí, pegada a lo comprado. Es la prueba
                de esta línea: es lo que se compara con una factura, y sin ella
                «Comprado» es una afirmación sin fecha. El resumen de arriba no la
                lleva justamente para que solo esté en un sitio. */}
            <p className="mt-0.5 text-[12px] text-faint">
              {item.purchased
                ? item.purchased_on
                  ? `Comprado el ${formatDay(item.purchased_on)}`
                  : "Comprado"
                : "Pendiente"}
            </p>
          </div>
          <p
            className={`shrink-0 text-[14px] tabular-nums ${
              item.purchased ? "text-faint" : "text-ink"
            }`}
          >
            {formatCOP(item.amount_cop)}
          </p>
        </li>
      ))}
    </ul>
  );
}
