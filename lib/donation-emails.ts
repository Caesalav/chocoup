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
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTE HTML NO SE PARECE AL DEL PORTAL
 *
 * Un correo no es una página, y casi nada de lo que sostiene el diseño del
 * portal existe aquí. Las reglas que se siguen, todas obligadas:
 *
 *   * ESTILOS EN LÍNEA, uno por elemento. Gmail borra el `<style>` de la
 *     cabecera en algunos clientes, así que la paleta se escribe a mano en
 *     hexadecimal y no se importa de app/globals.css. Si la marca cambia de
 *     verde, este archivo no se entera solo: es el precio de que el correo se
 *     vea igual en Outlook que en el móvil.
 *   * MAQUETADO CON TABLAS. `flex` y `grid` no existen en Outlook, que sigue
 *     pintando con el motor de Word. Una tabla anidada es fea de escribir y es
 *     lo único que se ve igual en todas partes.
 *   * EL BOTÓN ES UNA CELDA CON FONDO, no un `<a>` con `padding`. Un enlace con
 *     relleno se queda sin fondo en Outlook y el botón principal desaparece.
 *   * LA TIPOGRAFÍA ES LA DEL SISTEMA. La `font-display` del portal es una
 *     fuente web, y una fuente web en un correo no carga: se sustituye por
 *     Times y el titular queda peor que si se hubiera pedido la del sistema.
 *   * SIN IMÁGENES. Muchos clientes las bloquean por omisión, y un correo cuyo
 *     encabezado es una imagen bloqueada empieza con un hueco gris. El nombre
 *     va escrito con texto sobre el verde, que se ve siempre.
 * ---------------------------------------------------------------------------
 */

const PAPER = "#f4f7f2";
const INK = "#0e1a15";
const SELVA = "#0f352d";
const BROTE = "#a5ed69";
const LUZ = "#f0fee5";
const LAND = "#dfe5da";
const MUTED = "#5b6b62";
const FAINT = "#8a9990";

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

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

/** El destino como se pinta: enlazado si la causa tiene ficha publicada. */
function destinationHtml(facts: DonationFacts): string {
  if (facts.caseUrl && facts.caseName) {
    return `<a href="${escapeHtml(facts.caseUrl)}" style="color:${SELVA};text-decoration:underline;">${escapeHtml(facts.caseName)}</a>`;
  }
  return escapeHtml(destinationLabel(facts));
}

/**
 * La línea que los clientes enseñan en la bandeja, detrás del asunto.
 *
 * Si no se pone, ahí se cuela lo primero del cuerpo, que es el nombre de la
 * marca y no dice nada. Va oculta con las tres declaraciones que hacen falta
 * juntas: sin altura, sin opacidad y fuera de pantalla, porque cada cliente
 * ignora una distinta.
 */
function preheader(text: string): string {
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(text)}</div>`;
}

/** El botón: una celda con fondo, que es lo único que Outlook pinta entero. */
function cta(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
    <tr>
      <td style="background:${SELVA};border-radius:999px;">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:15px;font-weight:600;line-height:1;color:${BROTE};text-decoration:none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

/** La fila «etiqueta / valor» de la que están hechos los dos correos. */
function row(label: string, value: string, last = false): string {
  const border = last ? "" : `border-bottom:1px solid ${LAND};`;
  return `<tr>
    <td style="padding:11px 0;${border}font-family:${FONT};font-size:14px;color:${MUTED};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:11px 0 11px 20px;${border}font-family:${FONT};font-size:14px;color:${INK};text-align:right;vertical-align:top;">${value}</td>
  </tr>`;
}

/**
 * El envoltorio: cabecera de selva con el nombre, tarjeta blanca con el
 * contenido, pie con lo que el portal repite en todas partes. Se escribe una
 * vez porque los dos correos tienen que parecer del mismo sitio.
 */
function layout({
  preview,
  eyebrow,
  heading,
  body,
}: {
  preview: string;
  eyebrow: string;
  heading: string;
  body: string;
}): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};">
${preheader(preview)}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PAPER};">
  <tr>
    <td align="center" style="padding:28px 12px 36px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;border-collapse:collapse;">

        <tr>
          <td style="background:${SELVA};border-radius:20px 20px 0 0;padding:26px 32px;">
            <span style="font-family:${FONT};font-size:20px;font-weight:700;letter-spacing:-0.01em;color:${BROTE};">${SITE_NAME}</span>
            <span style="font-family:${FONT};font-size:13px;color:#9fb3a8;padding-left:10px;">${escapeHtml(eyebrow)}</span>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;border-left:1px solid ${LAND};border-right:1px solid ${LAND};border-bottom:1px solid ${LAND};border-radius:0 0 20px 20px;padding:32px;">
            <h1 style="margin:0 0 20px;font-family:${FONT};font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.01em;color:${INK};">${escapeHtml(heading)}</h1>
            ${body}
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px 0;font-family:${FONT};font-size:12px;line-height:1.7;color:${FAINT};">
            ${SITE_NAME} publica los casos con el consentimiento de cada persona.
            Las donaciones se cobran por Mercado Pago: nada del dinero pasa por el portal.
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/**
 * El bloque del importe: lo primero que se busca al abrir cualquiera de los
 * dos correos, así que se pinta grande y sobre el lavado verde en vez de
 * quedarse como una fila más de la tabla.
 */
function amountBlock(amount: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 24px;">
    <tr>
      <td style="background:${LUZ};border-radius:14px;padding:20px 24px;">
        <p style="margin:0 0 4px;font-family:${FONT};font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">${escapeHtml(label)}</p>
        <p style="margin:0;font-family:${FONT};font-size:34px;line-height:1.1;font-weight:700;letter-spacing:-0.02em;color:${SELVA};">${escapeHtml(amount)}</p>
      </td>
    </tr>
  </table>`;
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
  const named = facts.donorName.trim();
  const greeting = named ? `Hola, ${named}` : "Hola";

  const nameNote = facts.publishName
    ? "Como nos autorizaste, tu nombre aparece junto a tu donación en el registro público."
    : "Tu donación aparece en el registro público con su valor y su fecha, pero sin tu nombre: no nos autorizaste a publicarlo y no lo guardamos.";

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
    "Si tienes cualquier duda, responde a este correo y te contestamos.",
    "",
    `— El equipo de ${SITE_NAME}`,
  ].join("\n");

  const html = layout({
    preview: `Recibimos tu donación de ${amount} para ${where}.`,
    eyebrow: "Donación recibida",
    heading: "Gracias por tu donación",
    body: `
      <p style="margin:0 0 22px;font-family:${FONT};font-size:16px;line-height:1.65;color:${INK};">
        ${escapeHtml(greeting)}: gracias de verdad. Tu aporte llega completo a ${destinationHtml(facts)}.
      </p>

      ${amountBlock(amount, "Tu donación")}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border-top:1px solid ${LAND};margin:0 0 24px;">
        ${row("Destino", destinationHtml(facts))}
        ${row("Fecha", escapeHtml(formatDateTime(facts.donatedAt)), true)}
      </table>

      <p style="margin:0 0 26px;font-family:${FONT};font-size:14px;line-height:1.7;color:${MUTED};">
        ${escapeHtml(nameNote)}
      </p>

      ${cta(`${facts.siteUrl}/#donaciones`, "Ver el registro de donaciones")}

      <p style="margin:26px 0 0;font-family:${FONT};font-size:14px;line-height:1.7;color:${MUTED};">
        Si tienes cualquier duda, responde a este correo y te contestamos.
      </p>
    `,
  });

  return {
    to,
    subject: `Gracias por tu donación de ${amount}`,
    text,
    html,
    // Quien responda a esto está preguntando algo concreto: va a una persona.
    answerable: true,
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
  const who = facts.donorName.trim() || "Anónima";
  const contact = facts.payerEmail.trim() || "sin correo en el pago";
  const link = facts.caseUrl ?? `${facts.siteUrl}/donaciones`;

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

  const contactHtml = facts.payerEmail.trim()
    ? `<a href="mailto:${escapeHtml(facts.payerEmail.trim())}" style="color:${SELVA};text-decoration:underline;">${escapeHtml(facts.payerEmail.trim())}</a>`
    : escapeHtml(contact);

  const html = layout({
    preview: `${who} · ${amount} · ${where}`,
    eyebrow: "Aviso interno",
    heading: "Entró una donación",
    body: `
      ${amountBlock(amount, "Importe")}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border-top:1px solid ${LAND};margin:0 0 24px;">
        ${row("Quién", escapeHtml(who))}
        ${row("Contacto", contactHtml)}
        ${row("Destino", destinationHtml(facts))}
        ${row("Fecha", escapeHtml(formatDateTime(facts.donatedAt)))}
        ${row("Publica el nombre", facts.publishName ? "sí" : "no")}
        ${row(
          "Referencia",
          `<span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:${MUTED};">${escapeHtml(facts.paymentRef)}</span>`,
          true,
        )}
      </table>

      ${cta(link, "Abrir en el portal")}
    `,
  });

  return {
    to,
    subject: `Nueva donación: ${amount} — ${where}`,
    text,
    html,
  };
}
