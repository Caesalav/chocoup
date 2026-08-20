"use server";

import { redirect } from "next/navigation";
import {
  createCheckoutPreference,
  donationReference,
  isMercadoPagoConfigured,
} from "@/lib/mercadopago";
import { absoluteUrl, isPublicUrl, publicUrl } from "@/lib/site";
import { PAYMENT_WEBHOOK_PATH } from "@/lib/site-gate";

export type DonorFormState = { error: string } | null;

const CASE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MIN_COP = 1_000;
const MAX_COP = 50_000_000;
/** Lo que aguanta `donations.donor_name` (0017). */
const MAX_NAME = 120;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function checked(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

function copAmount(formData: FormData, key: string): number {
  const digits = text(formData, key).replace(/\D/g, "");
  return Number(digits);
}

/**
 * A dónde devuelve Mercado Pago cuando termina, salga como salga.
 *
 * Es una pantalla fija y no la página de la que se venía, que es lo que se
 * hacía antes. Volver a la ficha de la familia dejaba a quien acababa de pagar
 * delante del mismo botón «Donar» que acababa de pulsar, sin una sola palabra
 * que dijera si el cobro había salido: la única señal era la barra de recaudado,
 * que tarda en moverse porque depende del webhook.
 *
 * La causa no se pierde por fijarla: la pantalla la saca de `external_reference`
 * del propio pago, que es dato comprobado, y no de un parámetro de la
 * dirección. Los tres caminos —aprobado, pendiente y rechazado— caen aquí y la
 * pantalla dice cuál fue.
 */
const THANKS_PATH = "/donaciones/gracias";

/**
 * Abre Mercado Pago con el valor escrito. El cobro ocurre allá; aquí solo se
 * arma el pedido y se redirige.
 *
 * Lo que viaja con el pedido es el destino del dinero —una causa o el fondo— y,
 * si quien dona lo escribió, su nombre y el permiso para publicarlo. Nada de
 * eso se guarda aquí: esta función no escribe en la base de datos y no puede,
 * porque un importe solo entra por el webhook (0017). Vuelve por
 * `/api/mercadopago/webhook`, y solo si Mercado Pago confirma el pago.
 */
export async function startMercadoPagoCheckout(
  _previous: DonorFormState,
  formData: FormData,
): Promise<DonorFormState> {
  if (text(formData, "website")) redirect("/donaciones");

  const amount = copAmount(formData, "amount_cop");
  if (!Number.isFinite(amount) || amount < MIN_COP) {
    return { error: "Escribe un valor de al menos $ 1.000." };
  }
  if (amount > MAX_COP) {
    return { error: "Ese valor es demasiado alto. Escríbelo de nuevo." };
  }

  const caseId = text(formData, "case_id");
  if (caseId && !CASE_ID.test(caseId)) {
    return { error: "No se pudo abrir el cobro. Recarga la página." };
  }

  /**
   * El nombre es opcional y la casilla decide si se publica. Sin casilla no se
   * manda el nombre en absoluto: guardarlo «para el equipo» de quien no
   * autorizó publicarlo sería quedarse un dato que nadie pidió, y el registro
   * de una donación anónima se sostiene sin él.
   */
  const publishName = checked(formData, "publish_name");
  const donorName = publishName ? text(formData, "donor_name").slice(0, MAX_NAME) : "";

  const heading = text(formData, "heading") || "Donación a Chocó Up";
  const back = await absoluteUrl(THANKS_PATH);
  const notificationUrl = await publicUrl(PAYMENT_WEBHOOK_PATH);

  if (!isMercadoPagoConfigured()) {
    console.error("mercadopago", "falta MP_ACCESS_TOKEN");
    return { error: "Mercado Pago no está conectado todavía." };
  }

  let initPoint: string;
  try {
    ({ initPoint } = await createCheckoutPreference({
      title: heading,
      amountCop: amount,
      externalReference: donationReference(caseId || null),
      backUrl: back,
      autoReturn: isPublicUrl(back),
      notificationUrl,
      donorName,
      publishName,
    }));
  } catch {
    return { error: "Mercado Pago no pudo abrir el cobro. Inténtalo de nuevo." };
  }

  redirect(initPoint);
}
