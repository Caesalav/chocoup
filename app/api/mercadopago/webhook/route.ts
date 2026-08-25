import { notifyConfirmedDonation } from "@/lib/donation-notify";
import {
  donationStatus,
  fetchPayment,
  isMercadoPagoConfigured,
  isMercadoPagoLive,
  isSignedByMercadoPago,
  mercadoPagoWebhookSecret,
  readDonationReference,
} from "@/lib/mercadopago";
import { recordNotice, type NoticeSignature } from "@/lib/payment-notices";
import { absoluteUrl } from "@/lib/site";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * El aviso de Mercado Pago: la única puerta por la que un importe entra al
 * portal.
 *
 * ===========================================================================
 * QUÉ ES ESTE ARCHIVO
 *
 * 0017_donaciones_preparadas.sql se escribió hace meses alrededor de una frase:
 * «un importe no puede entrar desde el navegador, ni desde el de quien dona ni
 * desde el de quien coordina; solo desde el webhook del proveedor». Esto es ese
 * webhook. Las tres barreras de esa migración —el permiso de tabla, la ausencia
 * de política de escritura y el disparador que mira el rol de la conexión— están
 * puestas contra todo lo demás y abiertas solo para esta ruta, así que lo que se
 * escriba aquí es lo que el portal va a afirmar en la barra de recaudado de la
 * ficha de una familia.
 *
 *   1. DEL AVISO SOLO SE CREE EL IDENTIFICADOR. El importe, el estado, la causa
 *      y la fecha se leen preguntándole a la API con el token. El cuerpo del
 *      aviso lo escribe quien llama, y aunque venga firmado no es la fuente:
 *      la fuente es la respuesta de Mercado Pago a nuestra pregunta.
 *
 *   2. SIN DESTINO CLARO NO SE GUARDA. Si la referencia externa no dice a qué
 *      causa fue el dinero —o que fue al fondo, dicho así—, la fila no entra.
 *      Es la misma regla que 0023 puso en la base de datos, repetida aquí para
 *      que el error se vea en la bitácora y no como una restricción violada.
 *
 *   3. EL MISMO AVISO DOS VECES ES LA MISMA FILA. Mercado Pago reintenta —por
 *      diseño, cuando algo falla o tarda— y un pago que cambia de estado avisa
 *      varias veces. La identidad del pago es (proveedor, referencia), que es
 *      el índice único de 0017, y esta ruta actualiza en vez de insertar cuando
 *      choca. Sin esto, la primera caída de red se convierte en una cifra de
 *      recaudado que no cuadra con el extracto y que ya no se puede deshacer.
 *
 *   4. TODO AVISO SE APUNTA, salga como salga. La bitácora es 0025 y existe
 *      porque sin ella esta ruta contestaba y se olvidaba.
 * ===========================================================================
 * LA FIRMA YA NO RECHAZA EL AVISO, Y HAY QUE EXPLICARLO
 *
 * Aquí decía «SIN FIRMA NO SE HACE NADA» y la ruta contestaba 401 a lo que
 * llegara sin `x-signature`. Era una decisión razonada y costó dinero: el 23 de
 * agosto entraron dos donaciones, el cobro salió en Mercado Pago y
 * `public.donations` se quedó vacía.
 *
 * El error de fondo era creer que la firma es lo que protege el importe. No lo
 * es: lo que lo protege es la regla 1. Del aviso no se cree NADA salvo el
 * identificador, y con ese identificador se le pregunta a Mercado Pago usando
 * NUESTRO token, que solo puede leer NUESTROS pagos. Así que lo peor que
 * consigue quien golpee esta URL inventando identificadores es:
 *
 *   * uno que no existe, o que es de otra cuenta: la API no lo devuelve y aquí
 *     no se escribe nada;
 *   * uno de nuestros pagos de verdad: se registra un pago que de verdad
 *     ocurrió, con el importe que de verdad tuvo, y el índice único de 0017
 *     hace que repetirlo no lo cuente dos veces.
 *
 * O sea que un aviso sin firma no puede inventar una donación. Y en cambio
 * rechazarlo sí puede perderla, porque el aviso que Mercado Pago manda a la
 * `notification_url` de una preferencia llega SIN `x-signature`: la firma la
 * pone el webhook configurado en el panel, no la preferencia. Rechazar lo no
 * firmado era rechazar la única forma en la que este portal recibe avisos.
 *
 * La firma se sigue comprobando cuando viene, y lo que se hace con el resultado
 * es apuntarlo: 'valida', 'invalida' o 'ausente' en la bitácora. Sirve para
 * saber si el panel está bien configurado y para ver a alguien probando la URL.
 * Lo que no hace es decidir si el dinero de una familia se registra.
 * ===========================================================================
 */

/** Lo que Mercado Pago manda en el cuerpo del aviso. */
type Notification = {
  type?: string;
  topic?: string;
  action?: string;
  data?: { id?: string | number };
};

/**
 * Mercado Pago reintenta lo que no responda 200, así que el código de salida es
 * una instrucción y no un adorno:
 *
 *   * 200 — atendido, o descartado a propósito. No vuelvas: volver daría lo
 *     mismo, y lo que quedó pendiente lo recoge la conciliación.
 *   * 503 — falta configuración de nuestro lado. Vuelve: puede estar puesta
 *     dentro de un minuto, y mientras tanto la donación no se pierde.
 *   * 500 — no se pudo leer el pago o no se pudo escribir. Vuelve, por lo mismo.
 *
 * Ya no hay 401. Un aviso sin firma se atiende igual, por lo que está escrito
 * arriba.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);

  // Sin token no hay a quién preguntarle, y preguntar es lo único que da
  // autoridad a esta ruta. Se contesta 503 para que Mercado Pago vuelva.
  if (!isMercadoPagoConfigured()) {
    console.error("mercadopago webhook: sin MP_ACCESS_TOKEN, el aviso no se puede comprobar");
    return Response.json({ error: "sin-configurar" }, { status: 503 });
  }

  // La bitácora se necesita desde la primera línea, así que el cliente de
  // servicio se pide antes de nada: sin él no se puede escribir ni la donación
  // ni el rastro de que el aviso llegó.
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    console.error(
      "mercadopago webhook: falta SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY): no hay con qué escribir la donación",
    );
    return Response.json({ error: "sin-configurar" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as Notification;

  // El identificador se toma de la URL porque es lo que Mercado Pago firma. El
  // cuerpo es el respaldo para las formas antiguas del aviso, que traen el
  // identificador en `data.id` y no en la cadena de consulta.
  const dataId = (
    url.searchParams.get("data.id") ??
    url.searchParams.get("id") ??
    (body.data?.id !== undefined ? String(body.data.id) : "")
  ).slice(0, 64);

  const kind =
    body.type ??
    body.topic ??
    url.searchParams.get("type") ??
    url.searchParams.get("topic") ??
    "";
  const requestId = request.headers.get("x-request-id") ?? "";
  const signature = signatureState({
    signature: request.headers.get("x-signature"),
    requestId: requestId || null,
    dataId,
  });

  /** Apunta el aviso con lo que ya se sabe de él, y contesta. */
  const answer = async (
    outcome: Parameters<typeof recordNotice>[1]["outcome"],
    payload: Record<string, string>,
    init?: { status: number },
    extra?: { detail?: string; donationId?: string | null },
  ) => {
    await recordNotice(supabase, {
      paymentRef: dataId,
      kind,
      requestId,
      signature,
      outcome,
      detail: extra?.detail,
      donationId: extra?.donationId,
    });
    return Response.json(payload, init);
  };

  if (!dataId) {
    return answer("sin-identificador", { ignorado: "sin-identificador" });
  }

  // Un pago y nada más. Mercado Pago avisa también de órdenes de compra y de
  // otros asuntos que aquí no cuentan nada: se contestan con un 200 para que no
  // se reintenten, y se apuntan para poder ver qué manda de verdad.
  if (kind && kind !== "payment") {
    return answer("ignorada", { ignorado: kind });
  }

  const payment = await fetchPayment(dataId);
  if (!payment) {
    console.error("mercadopago webhook: no se pudo leer el pago", dataId);
    return answer("pago-ilegible", { error: "pago-ilegible" }, { status: 500 });
  }

  // Un pago de la caja de arena no puede tocar el registro de un portal en
  // producción. No debería llegar —el token de producción no ve los pagos de
  // prueba— y si llega, es que alguien está probando contra el sitio de verdad.
  if (isMercadoPagoLive() && payment.live_mode === false) {
    console.error("mercadopago webhook: pago de prueba contra el portal en producción", dataId);
    return answer("descartada-por-prueba", { ok: "descartado-por-ser-de-prueba" });
  }

  const status = donationStatus(payment.status);
  if (!status) {
    // Se contesta 200 y no 500: reintentar trae el mismo estado que ya no se
    // sabe traducir. Lo que resuelve esto es añadir el estado a
    // `donationStatus`, y lo que hace que alguien se entere es esta fila.
    console.error("mercadopago webhook: estado desconocido", payment.status, dataId);
    return answer("estado-desconocido", { ok: "estado-desconocido" }, undefined, {
      detail: `Mercado Pago mandó el estado "${payment.status}"`,
    });
  }

  const target = readDonationReference(payment.external_reference);
  if (!target) {
    // Un pago nuestro que no dice a dónde va: pasa cuando el cobro no se creó
    // desde el portal —un enlace hecho a mano en el panel—. No se reparte por
    // omisión (0023), se apunta para que la conciliación lo enseñe.
    console.error(
      "mercadopago webhook: referencia que no dice a dónde va el dinero",
      payment.external_reference,
      dataId,
    );
    return answer("sin-destino", { ok: "sin-destino" }, undefined, {
      detail: `external_reference: "${payment.external_reference ?? ""}"`,
    });
  }

  const donation = {
    destination: target.destination,
    case_id: target.caseId,
    amount_cop: Math.round(payment.transaction_amount),
    status,
    provider: "mercadopago",
    payment_ref: String(payment.id),
    source: "webhook",
    ...readDonor(payment.metadata),
    // La fecha de confirmación, que no es la de la fila: entre el intento y la
    // confirmación pueden pasar días con una transferencia o con un pago en
    // efectivo. Solo cuando está confirmada, y siempre la del proveedor.
    settled_at: status === "confirmada" ? (payment.date_approved ?? new Date().toISOString()) : null,
  };

  const { data: inserted, error } = await supabase
    .from("donations")
    .insert(donation)
    .select("id")
    .single();

  let donationId = inserted?.id as string | undefined;
  let outcome: "registrada" | "actualizada" = "registrada";

  // 23505 es el índice único de 0017 diciendo que este pago ya está escrito, o
  // sea, que este aviso es el segundo. Entonces no es una fila nueva: es la
  // misma cambiando de estado —de pendiente a confirmada, de confirmada a
  // reembolsada— y lo que hay que hacer es actualizarla.
  if (error?.code === "23505") {
    const { data: updated, error: updateError } = await supabase
      .from("donations")
      .update({ status: donation.status, settled_at: donation.settled_at })
      .eq("provider", donation.provider)
      .eq("payment_ref", donation.payment_ref)
      .select("id")
      .single();

    if (updateError) {
      console.error("mercadopago webhook: no se pudo actualizar el pago", dataId, updateError.message);
      return answer(
        "no-se-pudo-escribir",
        { error: "no-se-pudo-actualizar" },
        { status: 500 },
        { detail: updateError.message },
      );
    }

    donationId = updated?.id as string | undefined;
    outcome = "actualizada";
  } else if (error) {
    console.error("mercadopago webhook: no se pudo registrar el pago", dataId, error.message);
    return answer(
      "no-se-pudo-escribir",
      { error: "no-se-pudo-registrar" },
      { status: 500 },
      { detail: error.message },
    );
  }

  await recordNotice(supabase, {
    paymentRef: dataId,
    kind,
    requestId,
    signature,
    outcome,
    detail: `${donation.status} · ${donation.amount_cop} COP`,
    donationId: donationId ?? null,
  });

  /**
   * Los dos correos, y solo cuando el dinero está confirmado.
   *
   * Va después de escribir la fila y de apuntar el aviso: cuando esto corre, el
   * registro del portal ya es correcto. Por eso el envío no puede cambiar lo
   * que se le contesta a Mercado Pago —un buzón lleno no es motivo para que
   * reintente un pago bien anotado— y por eso `notifyConfirmedDonation` no
   * lanza: lleva su propia cuenta de lo enviado (0024) y sus propios reintentos.
   *
   * Una donación pendiente no manda nada. Con una transferencia o un pago en
   * efectivo pueden pasar días hasta que se aprueba, y dar las gracias por un
   * dinero que todavía puede no llegar es prometer algo que no ha pasado.
   * Cuando se apruebe entrará otro aviso por aquí y ese sí las dará.
   */
  if (donationId && donation.status === "confirmada") {
    await notifyConfirmedDonation({
      admin: supabase,
      donationId,
      destination: donation.destination,
      caseId: donation.case_id,
      amountCop: donation.amount_cop,
      donorName: donation.donor_name,
      publishName: donation.publish_name,
      paymentRef: donation.payment_ref,
      payerEmail: payment.payer?.email?.trim() ?? "",
      donatedAt: donation.settled_at ?? new Date().toISOString(),
      siteUrl: (await absoluteUrl("/")).replace(/\/+$/, ""),
    });
  }

  return Response.json({ ok: outcome });
}

/**
 * En qué estado llegó la firma, para apuntarlo. No decide nada: ver la nota de
 * arriba.
 *
 * Sin secreto configurado se dice 'ausente' y no 'invalida': no es que la firma
 * estuviera mal, es que no había con qué comprobarla, y confundir las dos cosas
 * haría que el panel acusara a Mercado Pago de un descuido nuestro.
 */
function signatureState({
  signature,
  requestId,
  dataId,
}: {
  signature: string | null;
  requestId: string | null;
  dataId: string;
}): NoticeSignature {
  if (!signature) return "ausente";

  const secret = mercadoPagoWebhookSecret();
  if (!secret) {
    console.error("mercadopago webhook: llegó un aviso firmado y no hay MP_WEBHOOK_SECRET");
    return "ausente";
  }

  return isSignedByMercadoPago({ signature, requestId, dataId, secret }) ? "valida" : "invalida";
}

/**
 * El nombre de quien donó y si autorizó que aparezca, de lo que se guardó en la
 * preferencia.
 *
 * Los dos van juntos y con el mismo valor por omisión que la tabla: sin nombre,
 * y sin autorización. Es la regla que 0017 escribió en `publish_name` y que
 * 0002 escribió antes para las ofertas: la privacidad no se pide, se conserva.
 * Un `metadata` que llegue vacío o cambiado produce una donación anónima, que
 * es un registro más pobre pero nunca un nombre publicado sin permiso.
 */
function readDonor(metadata: Record<string, unknown> | null): {
  donor_name: string;
  publish_name: boolean;
} {
  const name = metadata?.donor_name;
  const publish = metadata?.publish_name;

  return {
    donor_name: typeof name === "string" ? name.trim().slice(0, 120) : "",
    // `true` a secas y no un valor que se le parezca: Mercado Pago devuelve los
    // booleanos como los recibió, y la cadena "false" es verdadera en
    // JavaScript. Cualquier otra cosa es «no autorizó».
    publish_name: publish === true || publish === "true",
  };
}
