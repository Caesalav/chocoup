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

/** Solo rutas internas, para volver de Mercado Pago sin abrir otro sitio. */
function returnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/donaciones";
  }
  return value;
}

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
  const back = await absoluteUrl(returnPath(text(formData, "return_to")));
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
