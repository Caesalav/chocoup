import { createNeed, deleteNeed, updateNeed } from "@/app/admin/actions";
import { DangerSubmitButton, SubmitButton } from "./SubmitButton";
import { CategoryChip, NeedStatusChip, UrgentChip } from "@/components/ui/Chip";
import { field } from "@/components/ui/styles";
import { NEED_CATEGORIES, NEED_STATUSES } from "@/lib/constants";
import type { Need } from "@/lib/types";

export function NeedsManager({
  cityId,
  caseId = null,
  needs,
}: {
  cityId: string;
  caseId?: string | null;
  needs: Need[];
}) {
  return (
    <div>
      <form action={createNeed} className="rounded-xl border border-line bg-panel/60 p-4">
        <input type="hidden" name="city_id" value={cityId} />
        {caseId && <input type="hidden" name="case_id" value={caseId} />}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={field.label}>Qué falta</span>
            <input
              name="title"
              required
              className={field.input}
              placeholder="Ej.: Tejas de zinc para 12 casas"
            />
          </label>

          <label className="block">
            <span className={field.label}>Categoría</span>
            <select name="category" className={field.select} defaultValue="otro">
              {NEED_CATEGORIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={field.label}>Cantidad</span>
            <input name="quantity" className={field.input} placeholder="Ej.: 200 unidades" />
          </label>

          <label className="block sm:col-span-2">
            <span className={field.label}>Detalles</span>
            <textarea
              name="details"
              rows={2}
              className={field.textarea}
              placeholder="Dónde entregarlo, a quién, plazos"
            />
          </label>
        </div>

        <label className={`${field.checkboxRow} mt-3`}>
          <input type="checkbox" name="urgent" className={field.checkbox} />
          <span>Urgente</span>
        </label>

        <div className="mt-3">
          <SubmitButton pendingLabel="Añadiendo…">Añadir necesidad</SubmitButton>
        </div>
      </form>

      {needs.length > 0 && (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-panel/60">
          {needs.map((need) => (
            <li key={need.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryChip category={need.category} />
                <NeedStatusChip status={need.status} />
                {need.urgent && need.status !== "cubierta" && <UrgentChip />}
              </div>

              <h4 className="mt-2 font-display text-lg leading-tight text-ink">{need.title}</h4>
              {need.quantity && <p className="text-sm text-muted">{need.quantity}</p>}
              {need.details && <p className="mt-1 text-sm text-muted">{need.details}</p>}

              <div className="mt-3 flex flex-wrap items-end gap-2">
                <form action={updateNeed} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={need.id} />
                  <label>
                    <span className={field.label}>Estado</span>
                    <select name="status" defaultValue={need.status} className={field.select}>
                      {NEED_STATUSES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <SubmitButton variant="secondary">Actualizar</SubmitButton>
                </form>

                <form action={deleteNeed}>
                  <input type="hidden" name="id" value={need.id} />
                  <DangerSubmitButton confirmText="¿Borrar esta necesidad?">
                    Borrar
                  </DangerSubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
