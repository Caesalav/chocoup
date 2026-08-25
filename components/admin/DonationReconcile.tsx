"use client";

import { useActionState } from "react";
import {
  reconcileMercadoPago,
  type ReconcileState,
} from "@/app/admin/casos/donantes/actions";
import { alertBox, button, field, panel } from "@/components/ui/styles";
import type {
  ReconcileReport,
  ReconcileRow,
  ReconcileState as RowState,
} from "@/lib/donation-reconcile";
import { formatCOP } from "@/lib/format";

/**
 * El botón que le pregunta a Mercado Pago qué pagos tiene.
 *
 * Existe porque el 23 de agosto había ocho pagos cobrados y la tabla vacía, y
 * no había ninguna pantalla capaz de enseñar esa diferencia: el portal solo
 * sabía de un pago si el aviso había llegado, así que un aviso perdido era
 * dinero invisible para siempre.
 *
 * Lo que enseña después no es «listo»: es la lista de lo que hizo con cada
 * pago, incluidos los que no pudo tocar. Un resumen que solo dijera «3
 * importadas» esconde justo lo que hay que mirar —el pago sin referencia, el
 * estado que no se sabe traducir—, que es una persona menos enterada de que le
 * falta dinero por registrar.
 */

const STATE_LABEL: Record<RowState, string> = {
  importada: "Importada",
  actualizada: "Actualizada",
  "ya-estaba": "Ya estaba",
  "sin-destino": "Sin destino",
  "estado-desconocido": "Estado desconocido",
  "de-prueba": "De prueba",
  "no-se-pudo-escribir": "No se pudo escribir",
};

/** Lo que necesita que alguien lo mire va en rojo; lo demás es informativo. */
function toneOf(state: RowState): string {
  if (state === "importada" || state === "actualizada") return "text-accent";
  if (state === "ya-estaba" || state === "de-prueba") return "text-muted";
  return "text-need-high";
}

export function DonationReconcile() {
  const [state, action, pending] = useActionState<ReconcileState | null, FormData>(
    reconcileMercadoPago,
    null,
  );

  return (
    <section className={`${panel} mt-6 p-4 sm:p-5`}>
      <h2 className="font-display text-[20px] leading-tight text-ink">
        Conciliar con Mercado Pago
      </h2>
      <p className="mt-2 max-w-prose text-[14px] leading-relaxed text-muted">
        Pregunta a la pasarela qué pagos tiene y escribe los que falten. Sirve
        cuando un aviso no llegó: el importe lo sigue diciendo Mercado Pago, no
        se teclea aquí. No manda correos.
      </p>

      <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className={field.label}>Últimos días</span>
          <input
            name="dias"
            type="number"
            min={1}
            max={365}
            defaultValue={15}
            inputMode="numeric"
            className={`${field.input} w-28`}
          />
        </label>
        <button type="submit" disabled={pending} className={button.primary}>
          {pending ? "Preguntando…" : "Buscar pagos"}
        </button>
      </form>

      {state && !state.ok && <p className={`${alertBox} mt-4`}>{state.error}</p>}

      {state?.ok && <Report report={state.report} />}
    </section>
  );
}

function Report({ report }: { report: ReconcileReport }) {
  const nothing = report.found === 0;

  return (
    <div className="mt-5 border-t border-line pt-4">
      <p className="text-[14px] leading-relaxed text-body">
        {nothing ? (
          <>
            Mercado Pago no tiene ningún pago en los últimos {report.days} días.
          </>
        ) : (
          <>
            {report.found} {report.found === 1 ? "pago" : "pagos"} en los últimos{" "}
            {report.days} días. {report.imported} importados
            {report.importedCop > 0 && <> ({formatCOP(report.importedCop)})</>},{" "}
            {report.updated} actualizados, {report.alreadyThere} ya estaban.
            {report.pending > 0 && (
              <span className="text-need-high">
                {" "}
                {report.pending} necesitan que alguien los mire.
              </span>
            )}
          </>
        )}
      </p>

      {report.truncated && (
        <p className={`${alertBox} mt-3`}>
          Mercado Pago devolvió el máximo de 50 pagos, así que los más antiguos
          de esta ventana no se han mirado. Repite con menos días.
        </p>
      )}

      {report.rows.length > 0 && (
        <ul className="mt-4 space-y-2">
          {report.rows.map((row) => (
            <Row key={row.paymentRef} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ row }: { row: ReconcileRow }) {
  return (
    <li className="rounded-lg border border-line bg-panel-high p-3">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-[17px] tabular-nums text-ink">
          {formatCOP(row.amountCop)}
        </span>
        <span className={`text-[13px] font-medium ${toneOf(row.state)}`}>
          {STATE_LABEL[row.state]}
        </span>
        <span className="text-[12px] text-faint">pago {row.paymentRef}</span>
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">
        {row.destination === "fondo"
          ? "Al fondo general"
          : row.destination === "causa"
            ? "A una causa"
            : "Sin destino"}
        {row.donorName && <> · {row.donorName}</>} · {row.detail}
      </p>
    </li>
  );
}
