/**
 * Checkout Pro de Mercado Pago: una preferencia, una URL, el cobro allá.
 *
 * El portal no recauda. Crea el pedido con el importe y manda a quien dona a
 * la pasarela; el dinero no pasa por aquí. La clave vive solo en el servidor.
 */

const PREFERENCES_URL = "https://api.mercadopago.com/checkout/preferences";

export function mercadoPagoAccessToken(): string {
  return process.env.MP_ACCESS_TOKEN?.trim() ?? "";
}

export function isMercadoPagoConfigured(): boolean {
  return mercadoPagoAccessToken().length > 0;
}

type PreferenceInput = {
  title: string;
  amountCop: number;
  externalReference: string;
  backUrl: string;
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
      statement_descriptor: "CHOCO UP",
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
