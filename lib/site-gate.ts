/**
 * El portal todavía no es público: quien llega ve la landing, no el tablero.
 *
 * Abierto de verdad: `SITE_OPEN=1` en el entorno. El equipo entra por /entrar
 * (la sesión salta el cerrojo). Quien no es del equipo abre el tablero de
 * muestra con la clave de la landing, o con `SITE_PREVIEW_SECRET` y `/?abrir=…`.
 *
 * Cerrado es el valor por omisión a propósito: olvidarse de una variable no
 * puede publicar fichas de familias. Abrir exige una decisión.
 */

export const GATE_PREVIEW_COOKIE = "chocoup_preview";

/**
 * Donde avisa Mercado Pago cuando un pago cambia de estado.
 *
 * Vive aquí, y no junto al webhook, por una limitación que conviene saber: el
 * cerrojo corre en el proxy, y el proxy no puede importar nada del código del
 * servidor —ni `server-only`, ni `node:crypto`—, que es de lo que está hecho
 * lib/mercadopago.ts. Así que la dirección se escribe una vez en el único
 * archivo que las dos partes pueden leer.
 */
export const PAYMENT_WEBHOOK_PATH = "/api/mercadopago/webhook";

export function isSiteOpen(): boolean {
  const value = process.env.SITE_OPEN?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

/**
 * Rutas que el cerrojo deja pasar aunque el portal esté cerrado.
 *
 * EL WEBHOOK DE PAGOS ES UNA DE ELLAS, y hay que dejar escrito por qué, porque
 * parece la excepción menos justificada de la lista y es la que más caro sale
 * olvidar. El cerrojo no responde un 403 ni un 404: reescribe la petición a la
 * landing y contesta 200. A un navegador eso le dice «esto todavía no está»; a
 * Mercado Pago le dice «recibido», y entonces no reintenta nunca más. Cada
 * donación que entrara con el portal cerrado se cobraría en la pasarela y no
 * dejaría ni una fila en el portal, sin error en ningún registro y sin forma de
 * recuperarla después salvo a mano contra el extracto.
 *
 * Y no es un caso raro: el portal nace cerrado a propósito, así que ese es
 * exactamente el estado en el que va a llegar el primer pago de verdad.
 *
 * Las otras rutas de `/api` NO pasan. Sirven a las pantallas del portal —el
 * registro de donaciones, el buscador— y mientras el tablero está dentro, sus
 * datos también. Lo que pasa el cerrojo es una puerta por la que entra un
 * aviso, no una por la que sale información.
 */
/**
 * La ficha de una causa: `/ciudades/<municipio>/casos/<uuid>`.
 *
 * Pasa el cerrojo, y hay que dejar escrito por qué, porque parece lo contrario
 * de tener el portal cerrado.
 *
 * El correo de agradecimiento que recibe quien dona enlaza a la ficha de la
 * familia a la que fue su dinero: «tu aporte llega completo a ‹nombre›», con el
 * nombre enlazado. Ese correo lo manda el webhook en el momento del pago, o
 * sea, EXACTAMENTE mientras el portal está cerrado, que es su estado normal.
 * Sin esta excepción, el portal le promete a alguien que acaba de dar dinero
 * que puede comprobar a dónde fue, y el enlace le contesta que esto todavía no
 * es público. Es la misma clase de fallo silencioso que el del webhook: nada
 * falla, y la promesa no se cumple.
 *
 * Lo que se abre es UNA ficha por enlace, no el tablero. El identificador es un
 * UUID que no se adivina, y desde la ficha no se llega a ninguna otra: los
 * enlaces de la cabecera y del pie vuelven a caer en el cerrojo. Quien tiene el
 * enlace es quien pagó por esa causa.
 */
const CASE_PATH =
  /^\/ciudades\/[a-z0-9-]+\/casos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isGatePublicPath(pathname: string): boolean {
  return (
    pathname === "/proximamente" ||
    pathname === "/entrar" ||
    pathname === PAYMENT_WEBHOOK_PATH ||
    pathname.startsWith("/auth/") ||
    CASE_PATH.test(pathname)
  );
}
