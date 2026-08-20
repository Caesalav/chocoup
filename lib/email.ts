import "server-only";

/**
 * Mandar un correo, que en este portal es siempre consecuencia de un pago.
 *
 * ===========================================================================
 * QUÉ ES ESTE ARCHIVO Y QUÉ NO
 *
 * Se habla con la API de Resend por `fetch`, sin SDK, por lo mismo que
 * lib/mercadopago.ts habla con la suya: son dos llamadas de una sola forma, el
 * cuerpo se lee entero aquí mismo, y una dependencia más es una superficie más
 * que actualizar en un proyecto que se despliega poco.
 *
 * NO es un sistema de notificaciones. Aquí no hay listas, ni plantillas
 * guardadas, ni un registro de envíos. Los dos únicos correos que existen los
 * dispara el webhook de pagos cuando una donación se confirma, y quién no
 * recibe dos veces el mismo lo decide la base de datos (0024), no este archivo.
 *
 * NO GUARDA DIRECCIONES, y es la regla que más fácil se rompe sin querer. La de
 * quien dona llega en la respuesta de Mercado Pago, viaja hasta aquí como
 * argumento y se acaba con la petición. El portal no tiene, ni va a tener por
 * este camino, una lista de correos de gente que donó: quien dio su correo se
 * lo dio a la pasarela para pagar.
 * ===========================================================================
 */

const RESEND_URL = "https://api.resend.com/emails";

function resendApiKey(): string {
  return process.env.RESEND_API_KEY?.trim() ?? "";
}

export function isEmailConfigured(): boolean {
  return resendApiKey().length > 0;
}

/**
 * De quién vienen los correos.
 *
 * El dominio tiene que estar verificado en Resend, y mientras no lo esté la API
 * rechaza el envío. Por eso el valor por omisión es una dirección del dominio
 * propio y no algo genérico que parezca funcionar: si falta la variable, falla
 * en voz alta contra una dirección reconocible en vez de mandar el
 * agradecimiento de una fundación desde un remitente prestado.
 */
function sender(): string {
  return process.env.EMAIL_FROM?.trim() || "ChocóUp <comunidad@chocoup.org>";
}

/**
 * A dónde va la respuesta cuando alguien contesta.
 *
 * No es el remitente y por eso son dos variables. `comunidad@chocoup.org` es un
 * buzón de envío —el que firma los correos y el que da la cara— y quien
 * responde a un agradecimiento suele estar preguntando algo concreto que tiene
 * que llegarle a una persona. Sin esto, esas respuestas caen en un buzón que
 * nadie mira y se pierden calladas, que es la peor forma de perder un mensaje
 * de alguien que acaba de dar dinero.
 */
function replyTo(): string {
  return process.env.EMAIL_REPLY_TO?.trim() || "charlie@browwwn.com";
}

/**
 * A quién se avisa de cada donación que entra.
 *
 * Va en el entorno y no en el código porque es la dirección de una persona, y
 * las personas de un equipo cambian sin que cambie el portal. El valor por
 * omisión es el que se pidió al montar esto, para que el aviso funcione desde
 * el primer despliegue aunque la variable no esté puesta: un aviso que no llega
 * es dinero que entra sin que nadie se entere.
 */
export function donationAlertRecipient(): string {
  return process.env.DONATION_ALERT_EMAIL?.trim() || "charlie@browwwn.com";
}

export type OutgoingEmail = {
  to: string;
  subject: string;
  /** La versión de texto, que es la que se lee si el cliente no pinta HTML. */
  text: string;
  html: string;
  /**
   * Si las respuestas van a una persona en vez de al buzón de envío. Se pone en
   * el correo a quien dona; el aviso al equipo no lo necesita, porque ya llega
   * a la dirección a la que se respondería.
   */
  answerable?: boolean;
};

/**
 * Envía, y dice si salió.
 *
 * Devuelve un booleano en vez de lanzar porque quien llama es un webhook que ya
 * tiene decidido qué hacer con un fallo —soltar la marca de 0024 para que el
 * siguiente reintento lo recoja— y una excepción por un buzón lleno no puede
 * tumbar el registro de un pago que sí entró. El dinero ya está anotado cuando
 * esto se llama; el correo es lo de después.
 */
export async function sendEmail(message: OutgoingEmail): Promise<boolean> {
  const key = resendApiKey();
  if (!key) {
    console.error("email: sin RESEND_API_KEY, no se envía", message.subject);
    return false;
  }

  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender(),
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
        ...(message.answerable ? { reply_to: replyTo() } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("email: Resend rechazó el envío", response.status, body.slice(0, 300));
      return false;
    }

    return true;
  } catch (error) {
    console.error("email: no se pudo llamar a Resend", error);
    return false;
  }
}
