"use server";

import { revalidatePath } from "next/cache";
import { reconcileDonations, type ReconcileReport } from "@/lib/donation-reconcile";
import { isMercadoPagoConfigured } from "@/lib/mercadopago";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { currentTeam } from "@/lib/team";

/**
 * Preguntarle a Mercado Pago qué pagos tiene, y escribir los que falten.
 *
 * Está en su propio archivo y no en `app/admin/actions.ts` por lo que hace: es
 * la única acción del panel que usa el cliente de servicio, o sea la única que
 * escribe saltándose las RLS. Tenerla suelta hace que se vea, y hace que el
 * `import` de `createSupabaseAdminClient` no aparezca en el archivo que
 * contiene todo lo demás, donde sería un ejemplo a copiar.
 *
 * Las dos barreras de siempre siguen puestas y en el mismo orden: el rol se
 * comprueba aquí contra la base de datos, y lo que se escribe lo dicta la
 * respuesta de Mercado Pago. Coordinación decide CUÁNDO se pregunta; no decide
 * la respuesta.
 */

export type ReconcileState =
  | { ok: true; report: ReconcileReport }
  | { ok: false; error: string };

export async function reconcileMercadoPago(
  _previous: ReconcileState | null,
  formData: FormData,
): Promise<ReconcileState> {
  const team = await currentTeam();
  if (team?.role !== "coordinacion") {
    return { ok: false, error: "Esto lo hace coordinación." };
  }

  if (!isMercadoPagoConfigured()) {
    return { ok: false, error: "Falta MP_ACCESS_TOKEN: no hay a quién preguntarle." };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      ok: false,
      error:
        "Falta la clave secreta de Supabase (SUPABASE_SECRET_KEY) en el entorno. Sin ella el servidor no puede escribir una donación, y es también lo que impide que el webhook registre los pagos.",
    };
  }

  const raw = Number(formData.get("dias"));
  const days = Number.isFinite(raw) && raw > 0 ? Math.min(Math.trunc(raw), 365) : 15;

  const report = await reconcileDonations({ admin, days });

  if (report.error === "mercadopago-no-contesta") {
    return { ok: false, error: "Mercado Pago no contestó a la consulta. Inténtalo de nuevo." };
  }

  // Se revalida siempre, no solo cuando entró algo: un estado que cambió de
  // confirmada a reembolsada también mueve las cifras de las fichas.
  revalidatePath("/admin/casos/donantes");
  revalidatePath("/");

  return { ok: true, report };
}
