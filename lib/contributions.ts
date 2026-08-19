/**
 * Qué cuenta el contador de aportes, y con qué palabras se dice.
 *
 * Existe por lo mismo que lib/needs.ts, que es el fallo que ya estuvo publicado:
 * tres pantallas contando conjuntos distintos bajo el mismo rótulo. Aquel decía
 * «0 necesidades abiertas» donde faltaban diez. Un contador de aportes con el
 * mismo defecto diría que llegó más ayuda de la que llegó, en la pantalla que
 * existe para pedirla.
 *
 * La diferencia con lib/needs.ts es dónde vive la definición. Allí son filas que
 * el portal ya tiene delante y se cuentan en JavaScript. Aquí no puede ser: el
 * agregado sale de `public.offers`, que el público no puede leer ni por política
 * ni por permiso de tabla, así que la cuenta la hace la vista
 * `public.offer_tally` (supabase/migrations/0015_canal_general.sql) y aquí solo
 * se recoge. LO QUE SE PROTEGE EN ESTE ARCHIVO ES QUE HAYA UNA SOLA PUERTA A ESE
 * NÚMERO Y UNA SOLA FORMA DE ROTULARLO.
 *
 * Los dos números, escritos una vez:
 *
 *   * `ofrecidos`: los aportes que entraron por «Quiero ayudar» y siguen en pie.
 *     No cuenta lo que el equipo rechazó ni lo que retiró del muro —sumar el spam
 *     afirmaría una participación que no existe— ni lo de un municipio sin
 *     publicar, por la cascada. Es acumulado: incluye lo que ya llegó, porque son
 *     aportes hechos, y no caduca a las ocho semanas como el muro de /ofrecido.
 *
 *   * `entregados`: de esos, los que ya llegaron. Es exactamente el largo del
 *     registro público de /ayudas, y el arnés lo comprueba: quien no se fíe puede
 *     contar la lista.
 *
 * Y lo que el número NO es, que es la mitad del trabajo de esta pantalla: no es
 * dinero, no son kilos y no son familias atendidas. Son aportes en materiales,
 * mercados, transporte o manos, que es lo que se ofrece por ese formulario —el
 * dinero no pasa por el portal, va a los canales de donación—. Por eso la frase
 * está aquí y no suelta en una plantilla: es tan parte de la definición como el
 * filtro de la vista.
 *
 * La regla `no-restricted-syntax` de eslint.config.mjs prohíbe leer
 * `offer_tally` fuera de la capa de datos, para que el número no pueda entrar al
 * portal por una segunda consulta con otro filtro. Lo que esa regla no puede
 * demostrar —igual que en lib/needs.ts— es que las pantallas usen estas frases;
 * lo que sí hace es que solo haya un sitio donde cambiarlas.
 */

/** El nombre de la vista, escrito una vez. */
export const CONTRIBUTION_TALLY_VIEW = "offer_tally";

export type ContributionTally = {
  ofrecidos: number;
  entregados: number;
};

/** Ninguno, que es lo que hay que enseñar si la consulta falla. */
export const EMPTY_TALLY: ContributionTally = { ofrecidos: 0, entregados: 0 };

/**
 * El titular del contador. Solo el número y el sustantivo, porque encima de él
 * va la cifra grande y debajo la frase que la explica.
 */
export function contributionHeadline(tally: ContributionTally): string {
  return tally.ofrecidos === 1 ? "ayuda ofrecida" : "ayudas ofrecidas";
}

/**
 * La frase que impide leer el número como lo que no es.
 *
 * Dice tres cosas y las tres hacen falta: de dónde salen los aportes, de qué son
 * —materiales, no dinero— y cuántos han llegado ya. La última es la que sostiene
 * a las otras dos: sin ella, «cuarenta aportes» se lee como cuarenta ayudas
 * entregadas, y son cosas distintas.
 *
 * Con cero no se maquilla. Un portal que acaba de abrir tiene cero y decirlo es
 * más creíble que esconder el contador hasta que haya un número presentable.
 */
export function contributionNote(tally: ContributionTally): string {
  if (tally.ofrecidos === 0) {
    return "Todavía no hay ninguno. El primero se cuenta aquí en cuanto lo envíes.";
  }

  const base =
    tally.ofrecidos === 1
      ? "Es lo que una persona ha ofrecido desde este formulario"
      : `Es lo que ${tally.ofrecidos} personas han ofrecido desde este formulario`;

  const kind = ": materiales, mercados, transporte o manos. El dinero no pasa por el portal.";

  if (tally.entregados === 0) {
    return `${base}${kind} Ninguno ha llegado todavía a su destino.`;
  }

  const delivered =
    tally.entregados === 1
      ? "Uno ya llegó y está anotado en el registro de ayudas."
      : `${tally.entregados} ya llegaron y están anotados en el registro de ayudas.`;

  return `${base}${kind} ${delivered}`;
}
