import {
  donationStatus,
  fetchPayment,
  isMercadoPagoConfigured,
  isMercadoPagoLive,
  isSignedByMercadoPago,
  mercadoPagoWebhookSecret,
  readDonationReference,
} from "@/lib/mercadopago";
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
 * De ahí las cuatro reglas de abajo. Ninguna es defensiva por costumbre.
 *
 *   1. SIN FIRMA NO SE HACE NADA. La URL es pública: la conoce cualquiera que
 *      mire el HTML de una preferencia o que pruebe rutas. Lo que distingue un
 *      aviso del proveedor de una petición inventada es la firma con el secreto
 *      del panel, y sin secreto configurado esta ruta se declara no lista en vez
 *      de aceptar a ciegas. Un webhook abierto es un formulario para escribir
 *      donaciones falsas en un portal de donaciones.
 *
 *   2. DEL AVISO SOLO SE CREE EL IDENTIFICADOR. El importe, el estado, la causa
 *      y la fecha se leen preguntándole a la API con el token. El cuerpo del
 *      aviso lo escribe quien llama, y aunque venga firmado no es la fuente:
 *      la fuente es la respuesta de Mercado Pago a nuestra pregunta.
 *
 *   3. SIN DESTINO CLARO NO SE GUARDA. Si la referencia externa no dice a qué
 *      causa fue el dinero —o que fue al fondo, dicho así—, la fila no entra.
 *      Es la misma regla que 0022 puso en la base de datos, repetida aquí para
 *      que el error se vea en el registro y no como una restricción violada.
 *
 *   4. EL MISMO AVISO DOS VECES ES LA MISMA FILA. Mercado Pago reintenta —por
 *      diseño, cuando algo falla o tarda— y un pago que cambia de estado avisa
 *      varias veces. La identidad del pago es (proveedor, referencia), que es
 *      el índice único de 0017, y esta ruta actualiza en vez de insertar cuando
 *      choca. Sin esto, la primera caída de red se convierte en una cifra de
 *      recaudado que no cuadra con el extracto y que ya no se puede deshacer.
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
 *   * 200 con `ok` — registrado, o descartado a propósito. No vuelvas.
 *   * 200 con `ignorado` — un aviso que no es de un pago. Tampoco vuelvas.
 *   * 401 — no venía firmado. Que reintente no lo va a arreglar, pero el código
 *     tiene que decir la verdad de por qué no se atendió.
 *   * 503 — falta configuración de nuestro lado. Vuelve: puede estar puesta
 *     dentro de un minuto, y mientras tanto la donación no se pierde.
 *   * 500 — no se pudo escribir. Vuelve, por lo mismo.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const secret = mercadoPagoWebhookSecret();

  if (!secret || !isMercadoPagoConfigured()) {
    console.error(
      "mercadopago webhook: sin MP_WEBHOOK_SECRET o sin MP_ACCESS_TOKEN, el aviso no se atiende",
    );
    return Response.json({ error: "sin-configurar" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as Notification;

  // El identificador se toma de la URL porque es lo que Mercado Pago firma. El
  // cuerpo es el respaldo para las formas antiguas del aviso, que traen el
  // identificador en `data.id` y no en la cadena de consulta.
  const dataId =
    url.searchParams.get("data.id") ??
    url.searchParams.get("id") ??
    (body.data?.id !== undefined ? String(body.data.id) : null);

  if (!dataId) {
    return Response.json({ ignorado: "sin-identificador" });
  }

  if (
    !isSignedByMercadoPago({
      signature: request.headers.get("x-signature"),
      requestId: request.headers.get("x-request-id"),
      dataId,
      secret,
    })
  ) {
    console.error("mercadopago webhook: firma inválida", dataId);
    return Response.json({ error: "firma-invalida" }, { status: 401 });
  }

  // Un pago y nada más. Mercado Pago avisa también de órdenes de compra y de
  // otros asuntos que aquí no cuentan nada: se contestan con un 200 para que no
  // se reintenten, y se olvidan.
  const kind = body.type ?? body.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  if (kind && kind !== "payment") {
    return Response.json({ ignorado: kind });
  }

  const payment = await fetchPayment(dataId);
  if (!payment) {
    console.error("mercadopago webhook: no se pudo leer el pago", dataId);
    return Response.json({ error: "pago-ilegible" }, { status: 500 });
  }

  // Un pago de la caja de arena no puede tocar el registro de un portal en
  // producción. No debería llegar —el token de producción no ve los pagos de
  // prueba— y si llega, es que alguien está probando contra el sitio de verdad.
  if (isMercadoPagoLive() && payment.live_mode === false) {
    console.error("mercadopago webhook: pago de prueba contra el portal en producción", dataId);
    return Response.json({ ok: "descartado-por-ser-de-prueba" });
  }

  const status = donationStatus(payment.status);
  if (!status) {
    console.error("mercadopago webhook: estado desconocido", payment.status, dataId);
    return Response.json({ error: "estado-desconocido" }, { status: 500 });
  }

  const target = readDonationReference(payment.external_reference);
  if (!target) {
    console.error(
      "mercadopago webhook: referencia que no dice a dónde va el dinero",
      payment.external_reference,
      dataId,
    );
    return Response.json({ error: "sin-destino" }, { status: 500 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    console.error("mercadopago webhook: falta SUPABASE_SERVICE_ROLE_KEY");
    return Response.json({ error: "sin-configurar" }, { status: 503 });
  }

  const donation = {
    destination: target.destination,
    case_id: target.caseId,
    amount_cop: Math.round(payment.transaction_amount),
    status,
    provider: "mercadopago",
    payment_ref: String(payment.id),
    ...readDonor(payment.metadata),
    // La fecha de confirmación, que no es la de la fila: entre el intento y la
    // confirmación pueden pasar días con una transferencia o con un pago en
    // efectivo. Solo cuando está confirmada, y siempre la del proveedor.
    settled_at: status === "confirmada" ? (payment.date_approved ?? new Date().toISOString()) : null,
  };

  const { error } = await supabase.from("donations").insert(donation);

  // 23505 es el índice único de 0017 diciendo que este pago ya está escrito, o
  // sea, que este aviso es el segundo. Entonces no es una fila nueva: es la
  // misma cambiando de estado —de pendiente a confirmada, de confirmada a
  // reembolsada— y lo que hay que hacer es actualizarla.
  if (error?.code === "23505") {
    const { error: updateError } = await supabase
      .from("donations")
      .update({ status: donation.status, settled_at: donation.settled_at })
      .eq("provider", donation.provider)
      .eq("payment_ref", donation.payment_ref);

    if (updateError) {
      console.error("mercadopago webhook: no se pudo actualizar el pago", dataId, updateError.message);
      return Response.json({ error: "no-se-pudo-actualizar" }, { status: 500 });
    }

    return Response.json({ ok: "actualizada" });
  }

  if (error) {
    console.error("mercadopago webhook: no se pudo registrar el pago", dataId, error.message);
    return Response.json({ error: "no-se-pudo-registrar" }, { status: 500 });
  }

  return Response.json({ ok: "registrada" });
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
