import "server-only";

import type { OutgoingEmail } from "./email";
import { SITE_NAME } from "./constants";
import { formatCOP, formatDateTime } from "./format";
import type { DonationDestination } from "./types";

/**
 * Los dos correos que salen cuando una donación se confirma.
 *
 * Están juntos y separados del transporte a propósito: son texto, no red. Se
 * pueden leer enteros sin saber quién los manda, y quien cambie una frase no
 * tiene que pasar cerca de una clave de API.
 *
 * Los dos se arman con los mismos hechos y dicen cosas distintas, porque los
 * destinatarios no son comparables. A quien donó se le agradece y se le dice a
 * dónde fue su dinero: no lleva la referencia del pago, ni el estado interno,
 * ni nada que solo le sirva al equipo. Al equipo se le cuenta lo que hace falta
 * para reconocer el movimiento en el extracto y para poder responder.
 *
 * El HTML va con estilos en línea y una tabla de un solo lado. No es descuido:
 * los clientes de correo no cargan hojas de estilo y muchos recortan lo que no
 * entienden, así que la paleta se escribe a mano aquí, en hexadecimal, y no se
 * importa de app/globals.css. Si la marca cambia de verde, este archivo no se
 * entera solo.
 */

const PAPER = "#f4f7f2";
const INK = "#0e1a15";
const SELVA = "#0f352d";
const BROTE = "#a5ed69";
const LAND = "#dfe5da";
const MUTED = "#5b6b62";

export type DonationFacts = {
  amountCop: number;
  destination: DonationDestination;
  /** El nombre de la causa, o null si la donación fue al fondo general. */
  caseName: string | null;
  /** La ficha de la causa, absoluta, o null si fue al fondo. */
  caseUrl: string | null;
  /** Lo que quien donó escribió, si autorizó publicarlo. Vacío si es anónima. */
  donorName: string;
  publishName: boolean;
  /** El identificador del pago en Mercado Pago, para cuadrar el extracto. */
  paymentRef: string;
  donatedAt: string;
  /** El correo con el que se pagó. Solo va al equipo, y no se guarda. */
  payerEmail: string;
  /** La raíz del portal, para que los enlaces funcionen fuera de él. */
  siteUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A dónde fue el dinero, en una frase, que es como se dice en los dos correos. */
function destinationLabel(facts: DonationFacts): string {
  if (facts.destination === "fondo") return "el fondo general";
  return facts.caseName ?? "una causa del portal";
}

/**
 * El envoltorio: la cinta verde arriba, el contenido dentro, el pie con lo que
 * el portal repite en todas partes. Se escribe una vez porque los dos correos
 * tienen que parecer del mismo sitio.
 */
function layout({ heading, body }: { heading: string; body: string }): string {
  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:24px 12px;background:${PAPER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
  <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;width:100%;border-collapse:collapse;">
    <tr>
      <td style="background:${SELVA};border-radius:16px 16px 0 0;padding:22px 28px;">
        <span style="color:${BROTE};font-size:19px;font-weight:700;letter-spacing:-0.01em;">${SITE_NAME}</span>
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff;border:1px solid ${LAND};border-top:0;border-radius:0 0 16px 16px;padding:28px;">
        <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:${INK};">${heading}</h1>
        ${body}
      </td>
    </tr>
    <tr>
      <td style="padding:18px 28px;color:${MUTED};font-size:12px;line-height:1.6;">
        ${SITE_NAME} publica los casos con el consentimiento de cada persona.
        Las donaciones se cobran por Mercado Pago: nada del dinero pasa por el portal.
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** La fila «etiqueta / valor» de la que están hechos los dos correos. */
function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:7px 0;color:${MUTED};font-size:14px;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:7px 0 7px 16px;color:${INK};font-size:14px;vertical-align:top;">${value}</td>
  </tr>`;
}

/**
 * El agradecimiento a quien donó.
 *
 * Devuelve null cuando Mercado Pago no dio un correo con el que responder, que
 * pasa con algunos medios de pago en efectivo. No es un error: es una donación
 * a la que no se le puede dar las gracias por escrito, y quien llama tiene que
 * poder distinguirla de un envío fallido para no reintentarla eternamente.
 *
 * No pide permiso para escribir porque no es una lista de correo: es el acuse
 * de un pago que esa persona acaba de hacer, al correo con el que lo hizo, una
 * sola vez. Por eso tampoco lleva baja: no hay a qué darse de baja.
 */
export function donationThanksEmail(facts: DonationFacts): OutgoingEmail | null {
  const to = facts.payerEmail.trim();
  if (!to) return null;

  const amount = formatCOP(facts.amountCop);
  const where = destinationLabel(facts);
  const greeting = facts.donorName.trim() ? `Hola, ${facts.donorName.trim()}` : "Hola";

  const nameNote = facts.publishName
    ? "Como nos autorizaste, tu nombre aparece junto a tu donación en el registro público."
    : "Tu donación aparece en el registro público con su valor y su fecha, pero sin tu nombre: no nos autorizaste a publicarlo y no lo guardamos.";

  const destinationHtml =
    facts.caseUrl && facts.caseName
      ? `<a href="${escapeHtml(facts.caseUrl)}" style="color:${SELVA};">${escapeHtml(facts.caseName)}</a>`
      : escapeHtml(where);

  const text = [
    `${greeting},`,
    "",
    `Gracias por tu donación de ${amount} a ${where}.`,
    "",
    `Valor: ${amount}`,
    `Destino: ${where}`,
    `Fecha: ${formatDateTime(facts.donatedAt)}`,
    "",
    nameNote,
    "",
    `Puedes ver el registro de donaciones en ${facts.siteUrl}/#donaciones`,
    "",
    `— El equipo de ${SITE_NAME}`,
  ].join("\n");

  const html = layout({
    heading: "Gracias por tu donación",
    body: `
      <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:${INK};">
        ${escapeHtml(greeting)}: gracias de verdad. Tu aporte llega completo a ${destinationHtml}.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border-top:1px solid ${LAND};border-bottom:1px solid ${LAND};margin:0 0 18px;">
        ${row("Valor", `<strong style="font-size:17px;">${escapeHtml(amount)}</strong>`)}
        ${row("Destino", destinationHtml)}
        ${row("Fecha", escapeHtml(formatDateTime(facts.donatedAt)))}
      </table>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.65;color:${MUTED};">${escapeHtml(nameNote)}</p>
      <a href="${escapeHtml(facts.siteUrl)}/#donaciones" style="display:inline-block;background:${SELVA};color:${BROTE};text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:999px;">Ver el registro de donaciones</a>
    `,
  });

  return {
    to,
    subject: `Gracias por tu donación de ${amount} — ${SITE_NAME}`,
    text,
    html,
  };
}

/**
 * El aviso al equipo: entró dinero, de quién, cuánto y a qué.
 *
 * Lleva el correo con el que se pagó y la referencia del pago, que son las dos
 * cosas que no salen del registro público. No es una contradicción con la
 * casilla del formulario: esa casilla decide si un nombre se PUBLICA, y esto no
 * se publica —va a una dirección del equipo, que además ve ese mismo pago en el
 * panel de Mercado Pago—. Lo que la casilla promete es que el nombre no se
 * guarda sin permiso, y no se guarda: ni el nombre ni el correo llegan a la
 * base de datos por este camino.
 */
export function donationAlertEmail(to: string, facts: DonationFacts): OutgoingEmail {
  const amount = formatCOP(facts.amountCop);
  const where = destinationLabel(facts);
  const who = facts.donorName.trim() || "Anónima (no autorizó publicar el nombre)";
  const contact = facts.payerEmail.trim() || "sin correo en el pago";

  const text = [
    `Entró una donación de ${amount}.`,
    "",
    `Quién: ${who}`,
    `Contacto del pago: ${contact}`,
    `Destino: ${where}`,
    `Valor: ${amount}`,
    `Fecha: ${formatDateTime(facts.donatedAt)}`,
    `Referencia Mercado Pago: ${facts.paymentRef}`,
    `Publica el nombre: ${facts.publishName ? "sí" : "no"}`,
    "",
    facts.caseUrl ? `Ficha de la causa: ${facts.caseUrl}` : `Fue al fondo general: ${facts.siteUrl}/donaciones`,
  ].join("\n");

  const html = layout({
    heading: `Entró una donación de ${escapeHtml(amount)}`,
    body: `
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border-top:1px solid ${LAND};border-bottom:1px solid ${LAND};margin:0 0 18px;">
        ${row("Quién", escapeHtml(who))}
        ${row("Contacto", escapeHtml(contact))}
        ${row("Valor", `<strong style="font-size:17px;">${escapeHtml(amount)}</strong>`)}
        ${row(
          "Destino",
          facts.caseUrl && facts.caseName
            ? `<a href="${escapeHtml(facts.caseUrl)}" style="color:${SELVA};">${escapeHtml(facts.caseName)}</a>`
            : escapeHtml(where),
        )}
        ${row("Fecha", escapeHtml(formatDateTime(facts.donatedAt)))}
        ${row("Referencia", `<code style="font-size:13px;">${escapeHtml(facts.paymentRef)}</code>`)}
        ${row("Publica el nombre", facts.publishName ? "sí" : "no")}
      </table>
      <a href="${escapeHtml(facts.caseUrl ?? `${facts.siteUrl}/donaciones`)}" style="display:inline-block;background:${SELVA};color:${BROTE};text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:999px;">Abrir en el portal</a>
    `,
  });

  return {
    to,
    subject: `Nueva donación: ${amount} — ${where}`,
    text,
    html,
  };
}
