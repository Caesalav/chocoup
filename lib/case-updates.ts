import type { CaseUpdate } from "./types";

/**
 * Cuándo se supo algo nuevo de una causa, escrito una sola vez.
 *
 * Existe por lo mismo que lib/needs.ts y lib/contributions.ts: una cuenta que se
 * hace en dos sitios acaba siendo dos cuentas. Y esta ya estaba mal en el único
 * sitio donde se hacía.
 *
 * ═══ QUÉ ESTABA MAL ═══
 *
 * La ficha escribía «Actualizado el …» con `cases.updated_at`, que es la columna
 * que la base de datos mueve en CUALQUIER escritura de la fila. Corregir una tilde
 * en la historia, marcar el retrato, cambiar el nombre con el que alguien acepta
 * aparecer: las tres dejaban la ficha afirmando que había noticias de esa familia
 * ese día. En un portal que se abre desde un WhatsApp y donde la gente vuelve a ver
 * si algo se movió, eso es la peor clase de dato falso: el que se lee como buena
 * noticia.
 *
 * Lo que quien lee quiere saber es cuándo PASÓ algo, y eso lo dice el diario de
 * avances: `max(case_updates.happened_on)`. Es un cambio de consulta y no de
 * esquema, porque el dato ya estaba escrito; lo que faltaba era preguntarlo.
 *
 * ═══ POR QUÉ EL ÚLTIMO Y NO UN `max` ═══
 *
 * Las dos consultas que traen los avances —la de verdad y la de muestra— los piden
 * ya ordenados por `happened_on` ascendente, que es el orden con el que se pinta el
 * diario. Leer el último elemento ata el rótulo a la lista: no puede decir una fecha
 * que no sea la de la última entrada que se ve debajo. Un `Math.max` sobre el array
 * sí podría separarse de ella el día que alguien cambie el `order`.
 *
 * ═══ NULO ES UNA RESPUESTA ═══
 *
 * Una causa recién documentada no tiene diario, y eso es normal. No se rellena con
 * `updated_at` para tapar el hueco, que sería volver al error con otro nombre: la
 * ficha dice entonces cuándo se documentó, que es cierto y es otra frase.
 */
export function lastUpdateOn(updates: Pick<CaseUpdate, "happened_on">[]): string | null {
  return updates.at(-1)?.happened_on ?? null;
}
