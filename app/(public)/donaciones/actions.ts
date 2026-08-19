"use server";

import { redirect } from "next/navigation";
import { createCheckoutPreference, isMercadoPagoConfigured } from "@/lib/mercadopago";
import { absoluteUrl } from "@/lib/site";

export type DonorFormState = { error: string } | null;

const CASE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MIN_COP = 1_000;
const MAX_COP = 50_000_000;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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

  const heading = text(formData, "heading") || "Donación a Chocó Up";
  const back = await absoluteUrl(returnPath(text(formData, "return_to")));

  if (!isMercadoPagoConfigured()) {
    console.error("mercadopago", "falta MP_ACCESS_TOKEN");
    return { error: "Mercado Pago no está conectado todavía." };
  }

  let initPoint: string;
  try {
    ({ initPoint } = await createCheckoutPreference({
      title: heading,
      amountCop: amount,
      externalReference: caseId ? `caso:${caseId}` : "fondo",
      backUrl: back,
    }));
  } catch {
    return { error: "Mercado Pago no pudo abrir el cobro. Inténtalo de nuevo." };
  }

  redirect(initPoint);
}
