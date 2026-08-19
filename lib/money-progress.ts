import type { BudgetProgress } from "./budget";

/**
 * Qué enseña la barra de donaciones de una causa, y SOBRE QUÉ CIFRA lo enseña.
 *
 * Las dos cosas van en el mismo valor por el mismo motivo que en
 * `caseDonation()`: no se puede pintar un porcentaje sin decir qué mide. Con un
 * `number` a secas, olvidarse de rotularlo compila; así no, porque el estado
 * viene con la palabra pegada.
 *
 * ---------------------------------------------------------------------------
 * LAS DOS CIFRAS, Y QUÉ ENSEÑA CADA SITIO
 *
 * ESTO NO ESTÁ CERRADO. Hoy la pantalla dice las dos cosas en dos registros
 * distintos, y quedó así porque la forma y la cifra se decidieron por separado:
 *
 *   - EL PORCENTAJE (`percent`) mide lo ENTREGADO. Es lo que se pinta como tramo
 *     oscuro de la pista y lo que dicen la cabecera de un municipio y la tarjeta
 *     de una campaña.
 *   - LA CIFRA GRANDE de la ficha y de la barra fija es lo RECIBIDO cuando hay
 *     algo recibido, y lo entregado solo cuando no. Está escrita en
 *     `CaseMoneyTrack` y en `CaseActions`, no aquí.
 *
 * O sea que la misma pista lleva un número grande que cuenta una cosa y un
 * relleno que cuenta otra. Se sostiene porque la pista enseña los dos tramos con
 * su leyenda, así que nada queda sin rotular; pero es una decisión pendiente y no
 * un diseño, y lo que sigue es el argumento de por qué el porcentaje —lo que se
 * lee sin leer— mide lo entregado.
 *
 * Una causa tiene dos cifras de avance y no son la misma clase de dato:
 *
 *   - LO ENTREGADO (`used`): la suma de los ítems del presupuesto que el equipo
 *     ya compró. Cada uno lleva título, precio y fecha de compra. Se puede
 *     auditar línea a línea en la misma ficha.
 *
 *   - LO RECIBIDO (`donated`): el dinero que ha entrado. Sale de las donaciones
 *     confirmadas, y esas solo entran por el webhook de pagos: el disparador
 *     `donations_are_webhook_only` (0017) impide que un importe llegue desde
 *     cualquier otra puerta, y 0021 lo repite. Hoy no hay webhook escrito, así
 *     que en producción esta cifra es cero en todas las causas.
 *
 * Un porcentaje es lo único de esta pantalla que se lee sin leer, y por tanto lo
 * que el portal afirma. Se le da a la cifra que el portal puede defender.
 *
 * Tiene tres consecuencias buenas y una mala, y la mala se paga a gusto:
 *
 *   1. Significa lo mismo en todas las causas y seguirá significando lo mismo el
 *      día que la pasarela cobre. Midiendo lo recibido, ese día el mismo
 *      porcentaje pasaría de un cero universal a otra cosa sin que nada en
 *      pantalla marcara el cambio.
 *   2. Hoy sería un 0 % en el portal entero, que es el estado que menos ayuda.
 *   3. Deja de existir el 0 % ambiguo: cero entregado es «todavía no se ha
 *      comprado nada», que es una frase, no un porcentaje.
 *
 *   - Lo malo: se queda corto respecto al dinero que sí ha llegado. Una causa con
 *     un tercio del dinero dentro y una sola compra hecha marca poco. Eso lo dice
 *     el renglón de lo recibido, que va al lado y remite al registro donde ese
 *     dinero está fila por fila.
 *
 * Y una corrección de vocabulario que sale sola de aquí: **lo entregado no puede
 * pasar de la meta**, porque la meta es la suma de todos los ítems y lo entregado
 * es la suma de los comprados. «Meta superada» no es un estado del avance; es un
 * estado de lo recibido, y por eso vive en `funded` y no en `state`.
 * ---------------------------------------------------------------------------
 */

export type MoneyState =
  /** Sin presupuesto anotado. No hay pista: no hay denominador. */
  | "sin-meta"
  /** Hay meta y todavía no se ha comprado nada. El estado delicado. */
  | "sin-entregar"
  /** Algo comprado, algo pendiente. */
  | "en-marcha"
  /** Todos los ítems comprados. */
  | "cumplida";

/** Si lo recibido llega a la meta. Lo entregado no puede pasarse; esto sí. */
export type MoneyFunding = "no" | "justo" | "de-sobra";

export type MoneyProgress = {
  state: MoneyState;
  goal: number;
  /** Comprado y en manos de la familia. Es lo que mide `percent`. */
  delivered: number;
  /**
   * Lo que ha entrado: donaciones confirmadas. Cero mientras no haya pasarela,
   * y cada peso de esta cifra es una fila del registro público (`donation_log`).
   */
  raised: number;
  /** Lo que falta para la meta contando lo recibido, que es lo que se pide. */
  missing: number;
  /** 0–100 sobre lo entregado. Nulo cuando no hay porcentaje que dar. */
  percent: number | null;
  funded: MoneyFunding;
};

export function moneyProgress(budget: BudgetProgress): MoneyProgress {
  const goal = Math.max(0, budget.goal);
  const delivered = Math.min(goal, Math.max(0, budget.used));
  const raised = Math.max(0, budget.donated);
  const missing = Math.max(0, goal - raised);

  const funded: MoneyFunding =
    goal === 0 || raised < goal ? "no" : raised > goal ? "de-sobra" : "justo";

  const state: MoneyState =
    goal === 0
      ? "sin-meta"
      : delivered === 0
        ? "sin-entregar"
        : delivered >= goal
          ? "cumplida"
          : "en-marcha";

  return {
    state,
    goal,
    delivered,
    raised,
    missing,
    // Sin meta no hay denominador, y con cero entregado el número sería un 0 %
    // que desanima diciendo menos que la frase que lo sustituye. En los dos
    // casos la pista se dibuja vacía y quien la pinta escribe otra cosa al lado.
    percent:
      state === "sin-meta" || state === "sin-entregar"
        ? null
        : Math.round((delivered / goal) * 100),
    funded,
  };
}

/**
 * Cuánto ha entrado y DE DÓNDE SALE ESA CIFRA, o nulo si no hay ninguna que
 * explicar.
 *
 * Nulo es el estado normal en producción: sin pasarela conectada no ha entrado
 * nada, y entonces esta línea no existe. Callar es lo correcto —lo que no se
 * puede hacer es escribir «$0 recaudados», que suena a fracaso cuando lo que
 * pasa es que todavía no hay por dónde recaudar—.
 *
 * La procedencia es lo importante de la frase, y se dice remitiendo al registro y
 * no al mecanismo. La cifra es exactamente la suma de las filas de
 * `donation_log`, así que «está fila por fila ahí abajo» es comprobable por
 * quien lo lee, en la misma pantalla, sin creerse nada. Un rótulo sobre el
 * mecanismo —«lo confirmó la pasarela», «lo comprobó el equipo»— dice más de lo
 * que esta pantalla puede demostrar, y además caduca: cambia el día que cambie
 * cómo entra el dinero, y entonces hay que acordarse de venir a cambiarlo.
 *
 * Y en ningún caso «recaudado por el portal»: el dinero no pasa por aquí.
 */
export function raisedNote(progress: MoneyProgress): string | null {
  if (progress.raised === 0) return null;

  const amount = formatCOPLong(progress.raised);
  const source = "Cada donación está en el registro de esta ficha.";

  if (progress.funded === "de-sobra") {
    return `${amount} recibidos, por encima de la meta. ${source}`;
  }
  if (progress.funded === "justo") {
    return `${amount} recibidos: la meta ya está cubierta. ${source}`;
  }
  return `${amount} recibidos. ${source}`;
}

/**
 * Qué ofrece la acción principal, según el avance.
 *
 * Con el presupuesto ya comprado entero, pedir más dinero contra una meta
 * cumplida es lo que convertiría esto en un embudo. Lo útil ahí es abrir el
 * gasto. En cualquier otro estado, Donar abre Mercado Pago a nombre de esta
 * causa: no hay destinos distintos por ficha.
 */
export type MoneyAction = { kind: "gasto"; label: string } | { kind: "donar"; label: string };

export function moneyAction(progress: MoneyProgress): MoneyAction {
  if (progress.state === "cumplida") return { kind: "gasto", label: "Ver el gasto" };
  return { kind: "donar", label: "Donar" };
}

// ---------------------------------------------------------------------------
// Importes abreviados
//
// La referencia escribe «of $15K» y no «of $15,000», y es lo que le deja meter
// la meta en una barra fija sin gastar ancho. En pesos el problema es mayor que
// en dólares: una meta de reconstrucción son nueve dígitos —$ 9.300.000— y
// puesta entera al lado de un nombre saca la fila de la pantalla. Ya pasó, y es
// lo que se ve en la cabecera de una ficha en un móvil de 390 px.
//
// La abreviatura NO sustituye a la cifra: es la versión para donde no cabe la
// buena. El importe exacto sigue estando en la sección del dinero y en el
// nombre accesible de la pista, así que nadie decide nada leyendo solo el
// redondeo. Esa es la condición para poder redondear.
// ---------------------------------------------------------------------------

const longFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** El importe entero: `$ 9.300.000`. */
function formatCOPLong(amount: number): string {
  return longFormatter.format(Math.max(0, Math.round(amount)));
}

/**
 * El importe corto: `$9,3 M`, `$480 mil`, `$800`.
 *
 * Un decimal en los millones y ninguno en los miles, que es donde el redondeo
 * empieza a mentir de verdad: `$1,2 M` se aparta como mucho de cincuenta mil
 * pesos de la cifra buena, y `$480 mil` no se aparta de nada.
 */
export function shortCOP(amount: number): string {
  const value = Math.max(0, Math.round(amount));

  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    // Un solo decimal, y sin el «,0» de los redondos: `$5 M`, no `$5,0 M`.
    const text = millions.toFixed(1).replace(/\.0$/, "").replace(".", ",");
    return `$${text} M`;
  }

  if (value >= 1_000) return `$${Math.round(value / 1_000)} mil`;

  return `$${value}`;
}
