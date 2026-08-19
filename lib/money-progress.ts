import type { BudgetProgress } from "./budget";
import type { CaseDonation } from "./donation-channel";

/**
 * Qué enseña la barra de donaciones de una causa, y SOBRE QUÉ CIFRA lo enseña.
 *
 * Las dos cosas van en el mismo valor por el mismo motivo que en
 * `caseDonation()`: no se puede pintar un porcentaje sin decir qué mide. Con un
 * `number` a secas, olvidarse de rotularlo compila; así no, porque el estado
 * viene con la palabra pegada.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ EL ANILLO MIDE LO ENTREGADO Y NO LO RECIBIDO
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
 * El anillo es lo único de esta pantalla que se lee sin leer, y por tanto lo que
 * el portal afirma. Se le da a la cifra que el portal puede defender.
 *
 * Tiene tres consecuencias buenas y una mala, y la mala se paga a gusto:
 *
 *   1. El anillo significa lo mismo en todas las causas y seguirá significando
 *      lo mismo el día que la pasarela cobre. Midiendo lo recibido, ese día el
 *      mismo anillo pasaría de un cero universal a otra cosa sin que nada en
 *      pantalla marcara el cambio.
 *   2. Hoy sería un 0 % en el portal entero, que es el estado que menos ayuda.
 *   3. Deja de existir el 0 % ambiguo: cero entregado es «todavía no se ha
 *      comprado nada», que es una frase, no un porcentaje.
 *
 *   - Lo malo: el anillo se queda corto respecto al dinero que sí ha llegado.
 *     Una causa con un tercio del dinero dentro y una sola compra hecha marca
 *     poco. Eso lo dice el renglón de lo recibido, que va al lado y remite al
 *     registro donde ese dinero está fila por fila.
 *
 * Y una corrección de vocabulario que sale sola de aquí: **lo entregado no puede
 * pasar de la meta**, porque la meta es la suma de todos los ítems y lo entregado
 * es la suma de los comprados. «Meta superada» no es un estado del anillo; es un
 * estado de lo recibido, y por eso vive en `funded` y no en `state`.
 * ---------------------------------------------------------------------------
 */

export type MoneyState =
  /** Sin presupuesto anotado. No hay anillo: no hay denominador. */
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
  /** Comprado y en manos de la familia. Es lo que mide el anillo. */
  delivered: number;
  /**
   * Lo que ha entrado: donaciones confirmadas. Cero mientras no haya pasarela,
   * y cada peso de esta cifra es una fila del registro público (`donation_log`).
   */
  raised: number;
  /** Lo que falta para la meta contando lo recibido, que es lo que se pide. */
  missing: number;
  /** 0–100 sobre lo entregado. Nulo cuando no hay anillo que dibujar. */
  percent: number | null;
  funded: MoneyFunding;
  /** Qué mide el porcentaje, en una palabra. Va pegado al anillo siempre. */
  measures: string;
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
    // casos el anillo se dibuja vacío y quien lo pinta escribe otra cosa al lado.
    percent:
      state === "sin-meta" || state === "sin-entregar"
        ? null
        : Math.round((delivered / goal) * 100),
    funded,
    measures: "entregado",
  };
}

/**
 * La frase que acompaña al anillo: qué se ha entregado de qué meta.
 *
 * Se escribe aquí y no en la plantilla porque la dicen la ficha, la tarjeta de
 * una causa y la barra fija, y con tres redacciones la de la barra acabaría
 * siendo la optimista.
 */
export function moneyRingLabel(progress: MoneyProgress): string {
  if (progress.state === "sin-meta") return "Todavía no hay presupuesto anotado";
  if (progress.state === "sin-entregar") {
    return `Todavía no se ha comprado nada de la meta de ${formatCOPLong(progress.goal)}`;
  }
  return `${progress.percent} % entregado: ${formatCOPLong(progress.delivered)} comprados de una meta de ${formatCOPLong(progress.goal)}`;
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
  const source = "Cada aporte está en el registro de donaciones de esta ficha.";

  if (progress.funded === "de-sobra") {
    return `${amount} recibidos, por encima de la meta. ${source}`;
  }
  if (progress.funded === "justo") {
    return `${amount} recibidos: la meta ya está cubierta. ${source}`;
  }
  return `${amount} recibidos. ${source}`;
}

/**
 * Qué ofrece la acción principal, según el destino del dinero y el avance.
 *
 * Es la pieza que traduce los estados a un solo botón, y el orden de las ramas
 * es lo único importante:
 *
 *   - Con el presupuesto ya comprado entero, pedir más dinero contra una meta
 *     cumplida es lo que convertiría esto en un embudo. Lo útil ahí es abrir el
 *     gasto, que es la parte auditable.
 *   - Sin canal —ni propio ni general— no hay a dónde transferir, así que el
 *     botón no puede decir «Donar». Dice lo que esta página sí puede cumplir.
 *     Lo decide este valor y no un `if` de la plantilla, igual que antes.
 */
export type MoneyAction =
  | { kind: "gasto"; label: string }
  | { kind: "ofrecer"; label: string }
  | { kind: "donar"; label: string };

export function moneyAction(
  progress: MoneyProgress,
  donation: CaseDonation,
): MoneyAction {
  if (progress.state === "cumplida") return { kind: "gasto", label: "Ver el gasto" };
  if (donation.source === "ninguno") return { kind: "ofrecer", label: "Ofrecer ayuda" };
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
// nombre accesible del anillo, así que nadie decide nada leyendo solo el
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
