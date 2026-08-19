/**
 * El registro público de donaciones confirmadas.
 *
 * Existe por lo mismo que lib/contributions.ts: es un conjunto que hay que
 * filtrar —lo pendiente no cuenta, una causa sin publicar tampoco, el nombre
 * solo sale con autorización— y si cada pantalla se escribiera su propio
 * recorte el inicio diría una cosa y la ficha de la familia otra. El recorte
 * lo hace la vista `public.donation_log` (0021) y aquí solo se recoge.
 *
 * La tabla `public.donations` no se lee desde el portal. El público no tiene
 * permiso sobre ella, y esta constante es lo que impide que una segunda
 * consulta se invente otra puerta. La regla `no-restricted-syntax` de
 * eslint.config.mjs lo mantiene así.
 *
 * El sondeo cada quince segundos es lo que actualiza las tres listas cuando
 * entra una donación nueva: el público no puede suscribirse a la tabla
 * (0017 se lo niega) y esta es la vía que sí puede usar.
 */

export const DONATION_LOG_VIEW = "donation_log";

/** Cada cuánto las listas preguntan si ha entrado una donación nueva. */
export const DONATION_LOG_POLL_MS = 15_000;

/** Cuántas filas caben en una lista antes de que deje de ser un registro. */
export const DONATION_LOG_LIMIT = 20;

/** Recientes es el orden del registro; generosas es el de quién más puso. */
export type DonationLogSort = "recientes" | "generosas";

export function parseDonationLogSort(value: string | null | undefined): DonationLogSort {
  return value === "generosas" ? "generosas" : "recientes";
}
