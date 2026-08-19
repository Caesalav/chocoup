import type { Need, NeedStatus } from "./types";

/**
 * Qué cuenta como necesidad abierta, y de quién son las de un municipio.
 *
 * Existe por un fallo que estuvo publicado: la ficha de Quibdó decía «0
 * necesidades abiertas» en la cabecera mientras /municipios y el mapa decían
 * diez del mismo municipio y el mismo día. Ninguno de los tres números estaba
 * mal calculado; cada pantalla se había escrito su propio `filter` y cada uno
 * contaba un conjunto distinto sin decir cuál. Un cero en la cabecera de un
 * municipio con diez necesidades sin cubrir no es un descuadre: es el portal
 * diciéndole a quien quiere ayudar que ahí no falta nada.
 *
 * Así que la definición se escribe una vez, aquí, y son dos decisiones:
 *
 *   * ABIERTA ES `abierta` O `parcial`. A una familia a la que le llegó la
 *     mitad de las tejas le sigue faltando la otra mitad, así que `parcial`
 *     cuenta. Y se escribe en positivo —la lista de lo que está abierto— y no
 *     como «distinto de cubierta»: un cuarto estado que alguien añadiera mañana
 *     nace entonces fuera de la cuenta, y hay que venir aquí a decidir de qué
 *     lado cae, en vez de colarse dentro por la puerta de atrás. Que hoy sean
 *     tres palabras y no cuatro lo garantiza `needs_status_valid`
 *     (supabase/migrations/0001_init.sql) y lo comprueba supabase/verify.mjs.
 *
 *   * LAS DE UN MUNICIPIO SON LAS DE LA ZONA MÁS LAS DE SUS CASOS. La pregunta
 *     que contesta ese número es «¿aquí falta algo?», no «¿falta algo que no
 *     sea de nadie en particular?». En Quibdó —el único municipio real
 *     publicado— todo lo que falta está dentro de casos, así que contar solo la
 *     zona da cero. `getCityPage` las sirve separadas porque el panel edita las
 *     de la zona en su propio formulario, no porque se cuenten aparte.
 *
 * Lo que no decide este archivo es quién entra en la lista: eso lo hacen las
 * RLS (`needs_public_read`, 0001), que esconden del público las necesidades de
 * un caso sin publicar o sin consentimiento. Aquí solo se cuenta lo que llega,
 * que es por lo que el mismo código sirve para el portal y para el panel.
 */

/** Los dos estados que dejan una necesidad sin resolver. */
export const OPEN_STATUSES: readonly NeedStatus[] = ["abierta", "parcial"];

export function isOpenNeed(need: Pick<Need, "status">): boolean {
  return OPEN_STATUSES.includes(need.status);
}

/**
 * Cubierta se nombra en positivo y no como «no abierta» por lo mismo que
 * arriba: son complementarias hoy porque el vocabulario tiene tres palabras, y
 * el día que tenga cuatro conviene que la que sobre no acabe contada como
 * resuelta sin que nadie lo haya decidido.
 */
export function isCoveredNeed(need: Pick<Need, "status">): boolean {
  return need.status === "cubierta";
}

export function countOpenNeeds(needs: Pick<Need, "status">[]): number {
  return needs.filter(isOpenNeed).length;
}

export function countCoveredNeeds(needs: Pick<Need, "status">[]): number {
  return needs.filter(isCoveredNeed).length;
}

/**
 * Cuántos CASOS de un municipio tienen algo sin cubrir.
 *
 * Es el número que el mapa enseña al lado del color, y contesta otra pregunta:
 * el color dice cuánto falta en ese pueblo y esto dice a cuánta gente. Diez
 * necesidades pueden ser de una familia o de diez, y en un mapa que se mira para
 * decidir a dónde ir esa diferencia es la decisión entera.
 *
 * Vive aquí y no en la pantalla del mapa por el mismo motivo que todo lo de
 * arriba: en cuanto un segundo sitio lo cuente a su manera, habrá dos cifras del
 * mismo municipio el mismo día. Se cuentan casos distintos y no necesidades, así
 * que va por `case_id` y sin repetir.
 *
 * LO QUE ESTE NÚMERO NO DICE, y hay que saberlo antes de escribirlo en una
 * pantalla: un caso recién documentado al que todavía nadie le ha anotado una
 * necesidad no cuenta como abierto. No es un descuido, es la única definición que
 * se puede sostener con lo que hay en la base de datos —«abierto» no es una
 * columna del caso, es una propiedad de lo que le falta— y es coherente con el
 * color, que se calcula sobre el mismo conjunto. Cuántos casos hay en total es
 * otra cifra distinta (`caseCount`) y se enseña en la ficha del municipio.
 */
export function countOpenCases(needs: Pick<Need, "status" | "case_id">[]): number {
  const cases = new Set<string>();
  for (const need of needs) {
    if (need.case_id && isOpenNeed(need)) cases.add(need.case_id);
  }
  return cases.size;
}
