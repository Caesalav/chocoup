import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  donationStatus,
  isMercadoPagoLive,
  readDonationReference,
  searchPayments,
  type MercadoPagoPayment,
} from "./mercadopago";

/**
 * La conciliación: qué pagos tiene Mercado Pago que el portal no tenga.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ EXISTE, Y POR QUÉ NO ROMPE LA REGLA DE 0017
 *
 * El 23 de agosto había ocho pagos cobrados —$1.125.000— y `public.donations`
 * vacía. El webhook rechazaba los avisos y no quedaba rastro, así que el dinero
 * estaba en la pasarela y no en el portal, y no había ninguna pantalla capaz de
 * enseñar esa diferencia. Arreglar el webhook impide que vuelva a pasar; no
 * devuelve lo ya perdido. Esto lo devuelve.
 *
 * Y no es una puerta nueva para escribir importes. 0017 prohíbe que un importe
 * entre desde un navegador, y esa regla sigue entera: aquí el importe lo sigue
 * diciendo Mercado Pago. Coordinación no teclea una cifra, pulsa «buscar»; el
 * servidor pregunta a la API con el token, y lo que se escribe es la respuesta.
 * La diferencia con el webhook no es de confianza, es de quién empieza la
 * conversación: allí avisa la pasarela, aquí se le pregunta. Por eso las filas
 * que salen de aquí llevan `source = 'conciliacion'` (0025) y no otra cosa.
 *
 * LO QUE NO HACE: no manda correos. Los agradecimientos los manda el webhook
 * cuando un pago se confirma (0024), y esta herramienta se usa sobre pagos que
 * pueden ser de hace días o semanas: dar las gracias en lote por dinero antiguo
 * llena ocho buzones a la vez con un aviso que llega tarde y que ya nadie pidió.
 * Si hay que escribirle a alguien, se decide mirando esta lista, que es
 * justamente lo que la lista sirve para poder hacer.
 * ---------------------------------------------------------------------------
 */

/** Qué se hizo con un pago de la pasarela. */
export type ReconcileState =
  /** Ya estaba escrito, con el mismo estado. No se toca. */
  | "ya-estaba"
  /** No estaba y se escribió. */
  | "importada"
  /** Estaba con otro estado —se reembolsó, se aprobó— y se actualizó. */
  | "actualizada"
  /** El pago no dice a qué causa fue. Necesita una persona. */
  | "sin-destino"
  /** Mercado Pago manda un estado que el portal no sabe traducir. */
  | "estado-desconocido"
  /** Un pago de la caja de arena en un portal de producción. */
  | "de-prueba"
  /** Se intentó escribir y la base dijo no. */
  | "no-se-pudo-escribir";

export type ReconcileRow = {
  paymentRef: string;
  amountCop: number;
  /** El estado tal como lo llama Mercado Pago: 'approved', 'pending'… */
  rawStatus: string;
  /** Cómo lo llama el portal, o null si no se sabe traducir. */
  status: string | null;
  /** 'causa', 'fondo', o null cuando la referencia no dice nada. */
  destination: string | null;
  caseId: string | null;
  donorName: string;
  createdAt: string;
  settledAt: string | null;
  state: ReconcileState;
  detail: string;
};

export type ReconcileReport = {
  days: number;
  /** Cuántos pagos tenía Mercado Pago en la ventana. */
  found: number;
  imported: number;
  updated: number;
  alreadyThere: number;
  /** Los que necesitan que alguien los mire. */
  pending: number;
  /** Lo que se acaba de escribir, en pesos. */
  importedCop: number;
  rows: ReconcileRow[];
  /**
   * Si Mercado Pago devolvió la lista llena hasta el techo. Con más de
   * cincuenta pagos en la ventana hay que estrecharla, porque los más antiguos
   * no se han mirado.
   */
  truncated: boolean;
  error: "sin-token" | "mercadopago-no-contesta" | null;
};

const EMPTY = {
  found: 0,
  imported: 0,
  updated: 0,
  alreadyThere: 0,
  pending: 0,
  importedCop: 0,
  rows: [] as ReconcileRow[],
  truncated: false,
};

/**
 * Compara y escribe lo que falte.
 *
 * `admin` tiene que ser el cliente de servicio: es el único al que la base le
 * deja escribir en `donations` (0017). Con el cliente normal esto no falla a
 * medias, falla entero, y es lo correcto.
 */
export async function reconcileDonations({
  admin,
  days = 15,
}: {
  admin: SupabaseClient;
  days?: number;
}): Promise<ReconcileReport> {
  const payments = await searchPayments(days);

  if (payments === null) {
    return { ...EMPTY, days, error: "mercadopago-no-contesta" };
  }

  // Lo que ya está escrito, por referencia de pago. Se lee de una vez y no una
  // consulta por pago: son cincuenta como mucho y la comparación es en memoria.
  const { data: existing } = await admin
    .from("donations")
    .select("payment_ref, status")
    .eq("provider", "mercadopago");

  const known = new Map<string, string>();
  for (const row of (existing ?? []) as { payment_ref: string; status: string }[]) {
    if (row.payment_ref) known.set(row.payment_ref, row.status);
  }

  const rows: ReconcileRow[] = [];
  let imported = 0;
  let updated = 0;
  let alreadyThere = 0;
  let pending = 0;
  let importedCop = 0;

  for (const payment of payments) {
    const result = await reconcileOne({ admin, payment, known });
    rows.push(result);

    if (result.state === "importada") {
      imported += 1;
      importedCop += result.amountCop;
    } else if (result.state === "actualizada") {
      updated += 1;
    } else if (result.state === "ya-estaba") {
      alreadyThere += 1;
    } else {
      pending += 1;
    }
  }

  return {
    days,
    found: payments.length,
    imported,
    updated,
    alreadyThere,
    pending,
    importedCop,
    rows,
    truncated: payments.length >= 50,
    error: null,
  };
}

async function reconcileOne({
  admin,
  payment,
  known,
}: {
  admin: SupabaseClient;
  payment: MercadoPagoPayment;
  known: Map<string, string>;
}): Promise<ReconcileRow> {
  const paymentRef = String(payment.id);
  const amountCop = Math.round(payment.transaction_amount);
  const status = donationStatus(payment.status);
  const target = readDonationReference(payment.external_reference);
  const donorName = readDonorName(payment.metadata);

  const base = {
    paymentRef,
    amountCop,
    rawStatus: payment.status,
    status,
    destination: target?.destination ?? null,
    caseId: target?.caseId ?? null,
    donorName,
    createdAt: payment.date_created ?? "",
    settledAt: payment.date_approved ?? null,
  };

  // Las mismas negativas que el webhook, en el mismo orden y por lo mismo. Un
  // pago que la ruta no habría escrito no se escribe aquí tampoco: si las dos
  // puertas no aplican la misma regla, la conciliación se convierte en la forma
  // de meter lo que la otra rechaza.
  if (isMercadoPagoLive() && payment.live_mode === false) {
    return { ...base, state: "de-prueba", detail: "Pago de prueba." };
  }

  if (!status) {
    return {
      ...base,
      state: "estado-desconocido",
      detail: `Mercado Pago lo llama "${payment.status}" y el portal no sabe traducirlo.`,
    };
  }

  if (!target) {
    return {
      ...base,
      state: "sin-destino",
      detail: payment.external_reference
        ? `Referencia "${payment.external_reference}": no es una causa ni el fondo.`
        : "El pago no trae referencia: no se creó desde el portal.",
    };
  }

  const already = known.get(paymentRef);

  if (already !== undefined) {
    if (already === status) {
      return { ...base, state: "ya-estaba", detail: `Registrada como ${status}.` };
    }

    const { error } = await admin
      .from("donations")
      .update({
        status,
        settled_at: status === "confirmada" ? (payment.date_approved ?? null) : null,
      })
      .eq("provider", "mercadopago")
      .eq("payment_ref", paymentRef);

    if (error) {
      return { ...base, state: "no-se-pudo-escribir", detail: error.message };
    }

    return { ...base, state: "actualizada", detail: `De ${already} a ${status}.` };
  }

  const { error } = await admin.from("donations").insert({
    destination: target.destination,
    case_id: target.caseId,
    amount_cop: amountCop,
    status,
    provider: "mercadopago",
    payment_ref: paymentRef,
    donor_name: donorName,
    publish_name: readPublishName(payment.metadata),
    source: "conciliacion",
    settled_at: status === "confirmada" ? (payment.date_approved ?? null) : null,
  });

  if (error) {
    // 23505 aquí significa que el webhook la escribió entre la lectura y este
    // insert. No es un fallo: es la carrera resolviéndose a favor de la puerta
    // que debía ganarla.
    if (error.code === "23505") {
      return { ...base, state: "ya-estaba", detail: "La escribió el webhook mientras se miraba." };
    }
    return { ...base, state: "no-se-pudo-escribir", detail: error.message };
  }

  return { ...base, state: "importada", detail: `Escrita como ${status}.` };
}

/**
 * El nombre, con la misma regla que el webhook: lo que no sea una cadena es
 * una donación anónima, nunca un nombre inventado.
 */
function readDonorName(metadata: Record<string, unknown> | null): string {
  const name = metadata?.donor_name;
  return typeof name === "string" ? name.trim().slice(0, 120) : "";
}

function readPublishName(metadata: Record<string, unknown> | null): boolean {
  const publish = metadata?.publish_name;
  return publish === true || publish === "true";
}
