import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * La bitácora de los avisos de pago (0025).
 *
 * Existe porque el 23 de agosto entró dinero y no quedó nada: la ruta del
 * webhook contestaba y se olvidaba, así que las cuatro formas de perder una
 * donación —no llegó el aviso, llegó sin firma, llegó con un estado
 * desconocido, falló la escritura— dejaban el mismo rastro, que era ninguno.
 *
 * Escribir aquí NO PUEDE FALLAR HACIA AFUERA, y de eso se encarga este archivo.
 * Una bitácora que rompe la ruta que vigila es peor que no tenerla: convertiría
 * un fallo al apuntar en una donación perdida, que es exactamente el daño que
 * vino a evitar. Por eso `recordNotice` se come sus errores y los deja en el
 * registro del servidor.
 */

/** Qué hizo la ruta con el aviso. Se lee en el panel cuando algo no cuadra. */
export type NoticeOutcome =
  /** Se escribió una donación nueva. */
  | "registrada"
  /** El pago ya estaba y cambió de estado. */
  | "actualizada"
  /** El aviso no era de un pago (una orden de compra, por ejemplo). */
  | "ignorada"
  /** El aviso no traía identificador de pago. */
  | "sin-identificador"
  /** Mercado Pago no contestó a la pregunta por el pago. */
  | "pago-ilegible"
  /** Un pago de la caja de arena contra el portal de producción. */
  | "descartada-por-prueba"
  /** Mercado Pago mandó un estado que el portal no sabe traducir. */
  | "estado-desconocido"
  /** El pago no dice a qué causa fue, ni que fuera al fondo. */
  | "sin-destino"
  /** Se leyó el pago y no se pudo escribir la fila. */
  | "no-se-pudo-escribir";

export type NoticeSignature = "valida" | "invalida" | "ausente";

type Notice = {
  paymentRef: string;
  kind: string;
  requestId: string;
  signature: NoticeSignature;
  outcome: NoticeOutcome;
  detail?: string;
  donationId?: string | null;
};

/**
 * Apunta un aviso. Devuelve siempre, pase lo que pase.
 *
 * El detalle se recorta a 500 caracteres porque la columna lo exige (0025) y
 * porque un mensaje de error de Postgres entero no cabe y tampoco aporta: lo
 * que hace falta es la primera línea.
 */
export async function recordNotice(
  admin: SupabaseClient,
  notice: Notice,
): Promise<void> {
  try {
    const { error } = await admin.from("payment_notices").insert({
      provider: "mercadopago",
      payment_ref: notice.paymentRef.slice(0, 120),
      kind: notice.kind.slice(0, 60),
      request_id: notice.requestId.slice(0, 120),
      signature: notice.signature,
      outcome: notice.outcome,
      detail: (notice.detail ?? "").slice(0, 500),
      donation_id: notice.donationId ?? null,
    });

    if (error) {
      console.error("bitacora de avisos: no se pudo apuntar", notice.outcome, error.message);
    }
  } catch (cause) {
    console.error("bitacora de avisos: no se pudo apuntar", notice.outcome, cause);
  }
}
