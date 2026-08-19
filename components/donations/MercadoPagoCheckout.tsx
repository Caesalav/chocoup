"use client";

import { useActionState } from "react";
import { saveDonorEmail, type DonorFormState } from "@/app/(public)/donaciones/actions";
import { alertBox, button, field } from "@/components/ui/styles";

/**
 * El recuadro de Mercado Pago: correo obligatorio, luego el cobro.
 *
 * El correo va aquí y no en un bloque de avisos al pie: donar es el gesto, y
 * escribirle a quien dona es parte de ese gesto. La pasarela aún no cobra; el
 * correo sí se guarda, para que el recorrido no pida un segundo formulario.
 */
export function MercadoPagoCheckout({
  heading = "Donar con Mercado Pago",
  note,
}: {
  heading?: string;
  note?: string;
}) {
  const [state, action, pending] = useActionState<DonorFormState, FormData>(saveDonorEmail, null);
  const saved = state && "saved" in state;

  return (
    <div className="rounded-2xl border border-line bg-panel p-5">
      <p className="font-display text-[20px] leading-tight text-ink">{heading}</p>
      <p className="mt-2 text-[14px] leading-relaxed text-body">
        {note ??
          "La pasarela se conecta en los próximos días. El correo ya entra con este envío; te escribimos para completar el aporte."}
      </p>

      {saved ? (
        <p role="status" className="mt-5 rounded-lg bg-accent-soft px-3.5 py-2.5 text-sm text-accent-strong">
          Recibido. Cuando la pasarela esté lista te escribimos a ese correo para completar el
          aporte.
        </p>
      ) : (
        <form action={action} className="mt-5 space-y-4">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute left-[-9999px] size-0"
          />
          <label className="block">
            <span className={field.label}>Tu correo</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={field.input}
              placeholder="nombre@correo.com"
            />
            <span className={field.hint}>Para confirmar el aporte. No se publica.</span>
          </label>
          {state && "error" in state && <p className={alertBox}>{state.error}</p>}
          <button type="submit" disabled={pending} className={`${button.primary} w-full`}>
            {pending ? "Guardando…" : "Dejar el correo"}
          </button>
          <p className="text-[13px] leading-relaxed text-muted">
            Cuando Mercado Pago esté listo, el cobro lo confirma la pasarela. Nada del dinero pasa
            por este portal.
          </p>
        </form>
      )}
    </div>
  );
}
