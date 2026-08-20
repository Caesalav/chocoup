import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { DonationDestination } from "./types";

/**
 * Checkout Pro de Mercado Pago: una preferencia, una URL, el cobro allá.
 *
 * El portal no recauda. Crea el pedido con el importe y manda a quien dona a
 * la pasarela; el dinero no pasa por aquí. La clave vive solo en el servidor.
 *
 * Y vuelve por una sola puerta, que es el webhook: `/api/mercadopago/webhook`.
 * Lo que el portal sabe de un pago no es lo que diga el navegador al volver de
 * la pasarela —eso es una redirección y se puede escribir a mano en la barra de
 * direcciones— sino lo que responde esta API cuando se le pregunta por el pago
 * con el token. Ver `fetchPayment()`.
 */

const PREFERENCES_URL = "https://api.mercadopago.com/checkout/preferences";
const PAYMENTS_URL = "https://api.mercadopago.com/v1/payments";

export function mercadoPagoAccessToken(): string {
  return process.env.MP_ACCESS_TOKEN?.trim() ?? "";
}

export function isMercadoPagoConfigured(): boolean {
  return mercadoPagoAccessToken().length > 0;
}

/**
 * La «clave secreta» del webhook, del panel de Mercado Pago: Tus integraciones
 * -> la aplicación -> Webhooks. Sin ella el webhook no acepta ningún aviso, y
 * eso está explicado en la ruta.
 */
export function mercadoPagoWebhookSecret(): string {
  return process.env.MP_WEBHOOK_SECRET?.trim() ?? "";
}

/** Producción es lo que da un token `APP_USR-`; `TEST-` es la caja de arena. */
export function isMercadoPagoLive(): boolean {
  return mercadoPagoAccessToken().startsWith("APP_USR-");
}

// ---------------------------------------------------------------------------
// A dónde va el dinero, escrito de ida y leído de vuelta
//
// Va en `external_reference` y no en `metadata`, y la diferencia importa: la
// referencia externa es un campo de primera clase de Mercado Pago —viaja al
// pago, sale en su panel y en el extracto, y sirve para conciliar a mano— y
// `metadata` es un saco de datos nuestros. Si algún día `metadata` llegara
// vacío, el dinero seguiría cayendo en la causa correcta; solo se perdería el
// nombre de quien donó, que degrada a «anónima» y no a «dinero sin dueño».
//
// El formato es de una línea a propósito. Nada de JSON aquí: esta cadena la va
// a leer una persona en el panel de Mercado Pago mientras cuadra el extracto.
// ---------------------------------------------------------------------------

const CASE_REFERENCE = /^caso:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export function donationReference(caseId: string | null): string {
  return caseId ? `caso:${caseId}` : "fondo";
}

/**
 * De vuelta: qué causa pagó este pago, o el fondo general.
 *
 * Devuelve null cuando la referencia no es ninguna de las dos formas que este
 * portal escribe. Null NO es «el fondo»: es «no sé de quién es este dinero», y
 * quien llama tiene que negarse a registrarlo. Confundir las dos cosas es
 * exactamente lo que 0023_donacion_al_fondo.sql existe para impedir.
 */
export function readDonationReference(
  reference: string | null | undefined,
): { destination: DonationDestination; caseId: string | null } | null {
  const value = reference?.trim() ?? "";
  if (value === "fondo") return { destination: "fondo", caseId: null };

  const match = CASE_REFERENCE.exec(value);
  if (match) return { destination: "causa", caseId: match[1].toLowerCase() };

  return null;
}

// ---------------------------------------------------------------------------
// Crear el cobro
// ---------------------------------------------------------------------------

type PreferenceInput = {
  title: string;
  amountCop: number;
  /** `caso:<uuid>` o `fondo`. Ver `donationReference()`. */
  externalReference: string;
  /** A dónde vuelve quien dona cuando la pasarela termina. */
  backUrl: string;
  /**
   * Si la pasarela puede devolver sola al portal al aprobar el pago. Falso
   * cuando `backUrl` no es pública: Mercado Pago no acepta una preferencia que
   * le pida devolver a un `localhost` —rechaza la preferencia entera, no solo
   * el retorno— y entonces donar dejaría de funcionar en local.
   */
  autoReturn: boolean;
  /**
   * A dónde avisa Mercado Pago cuando el pago cambia de estado. Null cuando el
   * portal no está en una URL pública —en local, sin más— y entonces la
   * preferencia se crea sin aviso: el cobro funciona y la donación no se
   * registra, que es lo que se puede prometer desde un `localhost`.
   */
  notificationUrl: string | null;
  /** Lo que quien dona escribió de sí mismo, si escribió algo. */
  donorName: string;
  publishName: boolean;
};

type PreferenceResponse = {
  init_point?: string;
  sandbox_init_point?: string;
  message?: string;
  error?: string;
};

export async function createCheckoutPreference({
  title,
  amountCop,
  externalReference,
  backUrl,
  autoReturn,
  notificationUrl,
  donorName,
  publishName,
}: PreferenceInput): Promise<{ initPoint: string }> {
  const token = mercadoPagoAccessToken();
  if (!token) {
    throw new Error("missing-token");
  }

  const response = await fetch(PREFERENCES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          id: externalReference,
          title: title.slice(0, 256),
          quantity: 1,
          currency_id: "COP",
          unit_price: amountCop,
        },
      ],
      external_reference: externalReference,
      back_urls: {
        success: backUrl,
        failure: backUrl,
        pending: backUrl,
      },
      // Que la pasarela devuelva sola al portal cuando el pago se aprueba, en
      // vez de dejar a quien acaba de donar delante de un botón «volver al
      // sitio» que parece el final de otro trámite.
      ...(autoReturn ? { auto_return: "approved" } : {}),
      statement_descriptor: "CHOCO UP",
      // El nombre y la autorización viajan aquí porque no hay dónde más: entre
      // el clic en Donar y el aviso del pago no queda nada nuestro en pie. Lo
      // que el webhook haga con ellos está escrito allí; lo que importa de este
      // lado es que son lo único que puede faltar sin que se pierda el destino
      // del dinero.
      metadata: {
        donor_name: donorName.slice(0, 120),
        publish_name: publishName,
      },
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    }),
  });

  const body = (await response.json().catch(() => ({}))) as PreferenceResponse;
  const initPoint = body.init_point ?? body.sandbox_init_point;

  if (!response.ok || !initPoint) {
    console.error("mercadopago preference", response.status, body.message ?? body.error);
    throw new Error("preference-failed");
  }

  return { initPoint };
}

// ---------------------------------------------------------------------------
// Preguntar por un pago
// ---------------------------------------------------------------------------

export type MercadoPagoPayment = {
  id: number;
  status: string;
  transaction_amount: number;
  external_reference: string | null;
  date_approved: string | null;
  live_mode: boolean;
  metadata: Record<string, unknown> | null;
  /**
   * Quien pagó, según la pasarela. De aquí sale una sola cosa: el correo al que
   * se manda el agradecimiento.
   *
   * No sale el nombre, y no es un olvido. `payer.first_name` es el titular del
   * medio de pago —que a veces es la mamá, o la empresa— y el portal ya
   * pregunta el nombre en su propio formulario justamente para no confundir las
   * dos cosas; está explicado en components/donations/MercadoPagoCheckout.tsx.
   *
   * Puede llegar vacío: con algunos medios en efectivo no hay correo. Quien lo
   * use tiene que aguantar que no esté.
   */
  payer: { email?: string | null } | null;
};

/**
 * Qué dice Mercado Pago de este pago, preguntando con el token.
 *
 * El aviso del webhook trae un identificador y nada más que merezca crédito.
 * El importe, el estado y la causa se leen de aquí: es la única fuente que un
 * tercero no puede escribir.
 */
export async function fetchPayment(paymentId: string): Promise<MercadoPagoPayment | null> {
  const token = mercadoPagoAccessToken();
  if (!token) return null;

  const response = await fetch(`${PAYMENTS_URL}/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("mercadopago payment", paymentId, response.status);
    return null;
  }

  return (await response.json()) as MercadoPagoPayment;
}

/**
 * El estado del pago traducido al vocabulario de `public.donations` (0017), o
 * null si Mercado Pago manda uno que no conocemos.
 *
 * Null se registra y no se guarda: un estado nuevo del proveedor no puede
 * caer por omisión en «confirmada» —eso es dinero inventado— ni en «fallida»
 * —eso es dinero borrado—. Se queda fuera y alguien lo mira.
 */
export function donationStatus(paymentStatus: string): string | null {
  switch (paymentStatus) {
    case "approved":
      return "confirmada";
    case "pending":
    case "in_process":
    case "authorized":
      return "pendiente";
    case "rejected":
    case "cancelled":
      return "fallida";
    case "refunded":
    case "charged_back":
      return "reembolsada";
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// La firma del aviso
//
// Mercado Pago manda dos cabeceras: `x-signature`, que trae la marca de tiempo
// y el resumen, y `x-request-id`. Con el secreto del panel se rehace la misma
// plantilla y los dos resúmenes tienen que coincidir.
//
// Esto es lo que separa un aviso del proveedor de una petición cualquiera a una
// URL pública. Sin firma comprobada, cualquiera que adivine un identificador de
// pago podría hacer que el portal escribiera en el registro de donaciones; con
// ella, hace falta el secreto, que no sale del entorno.
//
// No se comprueba que la marca de tiempo sea reciente, y es una decisión: el
// mismo aviso repetido no puede hacer daño —el índice único de 0017 lo convierte
// en la misma fila— y una ventana estrecha se cierra sola con el reloj de un
// servidor desajustado, tirando donaciones de verdad. Se prefiere el reintento
// tardío a la donación perdida.
// ---------------------------------------------------------------------------

export function isSignedByMercadoPago({
  signature,
  requestId,
  dataId,
  secret,
}: {
  signature: string | null;
  requestId: string | null;
  dataId: string;
  secret: string;
}): boolean {
  if (!signature || !secret || !dataId) return false;

  const parts = new Map<string, string>();
  for (const piece of signature.split(",")) {
    const [key, ...rest] = piece.split("=");
    if (key && rest.length > 0) parts.set(key.trim(), rest.join("=").trim());
  }

  const ts = parts.get("ts");
  const received = parts.get("v1");
  if (!ts || !received) return false;

  // La plantilla es literal, incluido el punto y coma final, y las piezas que
  // no llegan se omiten enteras en vez de dejar su hueco vacío. El
  // identificador va en minúsculas: es lo que firma Mercado Pago cuando trae
  // letras.
  const manifest =
    `id:${dataId.toLowerCase()};` +
    (requestId ? `request-id:${requestId};` : "") +
    `ts:${ts};`;

  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  // Comparación de tiempo constante: comparar con `===` filtra el secreto por
  // el tiempo que tarda en decir que no.
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
