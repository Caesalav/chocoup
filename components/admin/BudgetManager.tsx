import { createBudgetItem, deleteBudgetItem, toggleBudgetItem } from "@/app/admin/actions";
import { CaseProgressBar } from "@/components/case/CaseProgressBar";
import { DangerSubmitButton, SubmitButton } from "./SubmitButton";
import { field } from "@/components/ui/styles";
import { budgetProgress } from "@/lib/budget";
import { formatCOP } from "@/lib/format";
import type { BudgetItem } from "@/lib/budget";

export function BudgetManager({
  cityId,
  caseId,
  items,
  donated,
}: {
  cityId: string;
  caseId: string;
  items: BudgetItem[];
  donated: number;
}) {
  const budget = budgetProgress(items, donated);
  const ordered = [...items].sort(
    (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
  );

  return (
    <div>
      <div className="rounded-xl border border-line bg-panel p-5">
        {budget.goal === 0 ? (
          <p className="text-sm text-muted">
            Añade las líneas del presupuesto. La barra aparece cuando hay al menos un precio.
          </p>
        ) : (
          <CaseProgressBar budget={budget} />
        )}
        <p className="mt-3 text-[12px] leading-relaxed text-faint">
          Lo donado lo confirma Mercado Pago cuando esté conectado. Aquí se marca lo ya comprado.
        </p>
      </div>

      <form action={createBudgetItem} className="mt-4 rounded-xl border border-line bg-panel p-5 sm:p-6">
        <input type="hidden" name="city_id" value={cityId} />
        <input type="hidden" name="case_id" value={caseId} />
        <h3 className="font-display text-[18px] leading-tight text-ink">Añadir un ítem</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          El nombre de lo que hay que comprar y su precio en pesos.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={field.label}>Qué hay que comprar</span>
            <input name="title" required className={field.input} placeholder="Ej.: 40 tejas de zinc de 2,44 m" />
          </label>
          <label className="block">
            <span className={field.label}>Precio, en pesos</span>
            <input name="amount_cop" required inputMode="numeric" className={field.input} placeholder="1600000" />
          </label>
        </div>
        <div className="mt-4">
          <SubmitButton pendingLabel="Añadiendo…">Añadir al presupuesto</SubmitButton>
        </div>
      </form>

      {ordered.length > 0 && (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-panel">
          {ordered.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <form action={toggleBudgetItem} className="flex min-w-0 flex-1 items-center gap-3">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="purchased" value={item.purchased ? "" : "on"} />
                <button
                  type="submit"
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${
                    item.purchased
                      ? "border-selva bg-brote text-selva"
                      : "border-line-strong bg-panel text-transparent"
                  }`}
                  aria-label={item.purchased ? "Marcar como pendiente" : "Marcar como comprado"}
                >
                  ✓
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${item.purchased ? "text-muted line-through" : "text-ink"}`}>
                    {item.title}
                  </p>
                  <p className="text-[12px] tabular-nums text-faint">{formatCOP(item.amount_cop)}</p>
                </div>
              </form>
              <form action={deleteBudgetItem}>
                <input type="hidden" name="id" value={item.id} />
                <DangerSubmitButton confirmText={`¿Borrar «${item.title}» del presupuesto?`}>
                  Borrar
                </DangerSubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
