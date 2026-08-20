import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { donationAlertEmail, donationThanksEmail, type DonationFacts } from "./donation-emails";
import { donationAlertRecipient, sendEmail } from "./email";
import { DONATION_LOG_VIEW } from "./donation-log";
import { createSupabaseServerClient } from "./supabase/server";
import type { DonationDestination } from "./types";

/**
 * Avisar de una donación confirmada: gracias a quien donó, aviso al equipo.
 *
 * ===========================================================================
 * POR QUÉ ESTO NO ES «MANDAR DOS CORREOS»
 *
 * Lo llama el webhook de pagos, y el webhook se ejecuta varias veces por el
 * mismo pago: Mercado Pago reintenta lo que no responde 200, y un pago que
 * cambia de estado avisa de nuevo. La tabla ya sabe que eso es una sola
 * donación —el índice único de 0017—, pero un correo enviado no se puede
 * retirar, así que hace falta una segunda cuenta, y esa es 0024.
 *
 * El turno se coge ANTES de enviar, con un `update ... is null` que la base
 * resuelve para uno solo aunque entren dos avisos a la vez. Si el envío falla,
 * se suelta la marca y el siguiente reintento lo recoge. Está explicado entero
 * en 0024_avisos_de_donacion.sql; aquí se cumple.
 *
 * NADA DE ESTO PUEDE TUMBAR EL REGISTRO DEL PAGO. Cuando esta función corre, el
 * dinero ya está anotado. Por eso no lanza nunca y no devuelve nada que el
 * webhook tenga que mirar: un buzón lleno no es motivo para que Mercado Pago
 * reintente un pago que ya quedó bien escrito, ni para responderle un 500.
 * ===========================================================================
 */

type Admin = SupabaseClient;

type NotifyInput = {
  admin: Admin;
  donationId: string;
  destination: DonationDestination;
  caseId: string | null;
  amountCop: number;
  donorName: string;
  publishName: boolean;
  paymentRef: string;
  payerEmail: string;
  donatedAt: string;
  /** La raíz del portal, absoluta, para los enlaces de los correos. */
  siteUrl: string;
};

/**
 * Cómo se llama la causa y dónde está su ficha.
 *
 * Se lee de `donation_log` y no de `cases` por la regla 3 de
 * lib/supabase/admin.ts: la llave de servicio no lee, porque una consulta hecha
 * con ella sale sin pasar por las RLS. La vista es la lectura pública de esta
 * misma donación —ya está escrita cuando esto corre— y trae justo el nombre y
 * el municipio.
 *
 * Si la donación no aparece en la vista, la causa no está publicada. Entonces
 * no hay ficha a la que enlazar y los correos salen sin enlace: es correcto,
 * porque enlazar a una ficha despublicada sería mandar a quien donó a un 404.
 */
async function findCase(
  donationId: string,
): Promise<{ caseName: string | null; caseUrl: string | null; citySlug: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from(DONATION_LOG_VIEW)
      .select("case_id, case_name, city_slug")
      .eq("id", donationId)
      .maybeSingle();

    const row = data as { case_id?: string; case_name?: string; city_slug?: string } | null;
    if (!row?.case_id || !row.city_slug) {
      return { caseName: row?.case_name ?? null, caseUrl: null, citySlug: null };
    }

    return {
      caseName: row.case_name ?? null,
      caseUrl: `/ciudades/${row.city_slug}/casos/${row.case_id}`,
      citySlug: row.city_slug,
    };
  } catch {
    return { caseName: null, caseUrl: null, citySlug: null };
  }
}

/**
 * Coge el turno de un envío. Devuelve true solo para quien se lo quedó.
 *
 * Es un `update` condicional y no un `select` seguido de un `update`: entre
 * leer que está vacío y escribir la marca cabe el otro aviso, y ahí es
 * exactamente donde se cuelan los correos repetidos.
 */
async function claim(admin: Admin, donationId: string, column: "thanked_at" | "alerted_at") {
  const { data, error } = await admin
    .from("donations")
    .update({ [column]: new Date().toISOString() })
    .eq("id", donationId)
    .is(column, null)
    .select("id");

  if (error) {
    console.error("aviso de donación: no se pudo coger el turno", column, error.message);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/** Suelta el turno cuando el envío falló, para que el reintento lo recoja. */
async function release(admin: Admin, donationId: string, column: "thanked_at" | "alerted_at") {
  const { error } = await admin
    .from("donations")
    .update({ [column]: null })
    .eq("id", donationId);

  if (error) {
    console.error("aviso de donación: no se pudo soltar el turno", column, error.message);
  }
}

export async function notifyConfirmedDonation(input: NotifyInput): Promise<void> {
  const place = await findCase(input.donationId);

  const facts: DonationFacts = {
    amountCop: input.amountCop,
    destination: input.destination,
    caseName: place.caseName,
    caseUrl: place.caseUrl ? `${input.siteUrl}${place.caseUrl}` : null,
    donorName: input.donorName,
    publishName: input.publishName,
    paymentRef: input.paymentRef,
    donatedAt: input.donatedAt,
    payerEmail: input.payerEmail,
    siteUrl: input.siteUrl,
  };

  // El agradecimiento. Sin correo en el pago no hay a quién escribir, y esa
  // donación se marca igual: no es un fallo que reintentar, es que no lo tiene.
  const thanks = donationThanksEmail(facts);
  if (await claim(input.admin, input.donationId, "thanked_at")) {
    if (thanks && !(await sendEmail(thanks))) {
      await release(input.admin, input.donationId, "thanked_at");
    }
  }

  // El aviso al equipo, con su propia cuenta: que el correo de quien donó
  // rebote no puede dejar al equipo sin enterarse de un dinero que sí entró.
  if (await claim(input.admin, input.donationId, "alerted_at")) {
    const alert = donationAlertEmail(donationAlertRecipient(), facts);
    if (!(await sendEmail(alert))) {
      await release(input.admin, input.donationId, "alerted_at");
    }
  }
}
