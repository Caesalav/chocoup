"use client";

import { usePathname } from "next/navigation";
import { useActionState, useState } from "react";
import { startMercadoPagoCheckout, type DonorFormState } from "@/app/(public)/donaciones/actions";
import { alertBox, button, field } from "@/components/ui/styles";
import { formatCOP } from "@/lib/format";

const PRESETS = [20_000, 50_000, 100_000, 200_000] as const;

/**
 * El recuadro de Mercado Pago: el valor y el botón que abre el cobro.
 *
 * El correo lo pide la pasarela. Aquí solo hace falta cuánto, para no pedir
 * dos veces lo mismo y para que Donar lleve de una al checkout.
 */
export function MercadoPagoCheckout({
  heading,
  caseId,
  note,
  showHeading = true,
}: {
  heading?: string;
  caseId?: string;
  note?: string;
  showHeading?: boolean;
}) {
  const pathname = usePathname();
  const [amount, setAmount] = useState(String(PRESETS[1]));
  const [state, action, pending] = useActionState<DonorFormState, FormData>(
    startMercadoPagoCheckout,
    null,
  );

  const chosen = Number(amount.replace(/\D/g, "")) || 0;

  return (
    <div className={showHeading ? "rounded-2xl border border-line bg-panel p-5" : undefined}>
      {showHeading && heading && (
        <p className="font-display text-[20px] leading-tight text-ink">{heading}</p>
      )}
      {note && <p className="mt-2 text-[14px] leading-relaxed text-body">{note}</p>}

      <form action={action} className={showHeading || note ? "mt-5 space-y-4" : "space-y-4"}>
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] size-0"
        />
        <input type="hidden" name="heading" value={heading ?? "Donación a Chocó Up"} />
        <input type="hidden" name="return_to" value={pathname} />
        {caseId && <input type="hidden" name="case_id" value={caseId} />}

        <div>
          <p className={field.label}>Cuánto quieres donar</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((value) => {
              const selected = chosen === value;
              return (
                <li key={value}>
                  <button
                    type="button"
                    onClick={() => setAmount(String(value))}
                    className={`inline-flex min-h-11 items-center rounded-full px-4 text-[14px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      selected
                        ? "bg-ink font-medium text-paper"
                        : "border border-line-strong bg-panel-high text-body hover:border-ink/40 hover:text-ink"
                    }`}
                  >
                    {formatCOP(value)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <label className="block">
          <span className={field.label}>Otro valor</span>
          <span className="relative mt-2 block">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-body">
              $
            </span>
            <input
              name="amount_cop"
              required
              inputMode="numeric"
              autoComplete="off"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className={`${field.input} mt-0 pl-8`}
              placeholder="50.000"
            />
          </span>
          <span className={field.hint}>En pesos colombianos. Mínimo $ 1.000.</span>
        </label>
        {state && "error" in state && <p className={alertBox}>{state.error}</p>}
        <button type="submit" disabled={pending} className={`${button.invite} w-full`}>
          {pending ? "Abriendo Mercado Pago…" : "Donar"}
        </button>
        <p className="text-[13px] leading-relaxed text-muted">
          {caseId
            ? "El cobro lo confirma Mercado Pago. Queda registrado para esta causa. Nada del dinero pasa por este portal."
            : "El cobro lo confirma Mercado Pago. Nada del dinero pasa por este portal."}
        </p>
      </form>
    </div>
  );
}
