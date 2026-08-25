import { moneyTrack, moneyTrackOnPhoto } from "@/components/ui/styles";
import { formatCOP } from "@/lib/format";
import { shortCOP, type MoneyProgress } from "@/lib/money-progress";

export function moneyTrackLabel(progress: MoneyProgress): string {
  return `Utilizado ${formatCOP(progress.delivered)}, donado ${formatCOP(progress.raised)}, objetivo ${formatCOP(progress.goal)}`;
}

/**
 * Los dos rellenos de la pista: donado debajo, utilizado encima.
 *
 * Es la ÚNICA pista de dinero del portal. La misma en la ficha, en la barra fija,
 * en las tarjetas de un caso y en la cabecera de un municipio, y solo cambia de
 * alto y de tono. Los colores viven en `moneyTrack`: lima lo donado, lavanda lo
 * utilizado.
 *
 * Los dos tramos se apilan y no se suman: lo donado sale desde el cero y lo
 * utilizado se pinta encima, así que el segundo nunca puede pasar del primero y
 * no hay que cuadrar anchos. `Math.max` es lo que sostiene eso cuando llega una
 * causa con más gastado que recibido —ocurre: el equipo compra y el aporte se
 * confirma después— y sin él el tramo de utilizado sobresaldría del de donado.
 */
export function MoneyTrackFill({
  progress,
  className = "h-3",
  tone = "paper",
}: {
  progress: MoneyProgress;
  className?: string;
  /** Sobre una foto de portada la pista va en pesos del papel, no en verdes. */
  tone?: "paper" | "photo";
}) {
  if (progress.goal === 0) return null;

  const used = Math.min(100, (progress.delivered / progress.goal) * 100);
  const donated = Math.max(used, Math.min(100, (progress.raised / progress.goal) * 100));
  const skin = tone === "photo" ? moneyTrackOnPhoto : moneyTrack;

  return (
    <div
      role="img"
      aria-label={moneyTrackLabel(progress)}
      className={`relative overflow-hidden rounded-full ${skin.rest} ${className}`}
    >
      {/* El filo del extremo es lo que separa un tramo del otro: lima y lavanda
          están cerca en luminancia y sin él se leen como uno solo. Los colores
          viven en `moneyTrack`. */}
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 border-r-2 ${skin.edge} ${skin.donated}`}
        style={{ width: `${donated}%` }}
      />
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 border-r-2 ${skin.edge} ${skin.used}`}
        style={{ width: `${used}%` }}
      />
    </div>
  );
}

/**
 * Cuántas aportaciones se dibujan como tramos, como mucho.
 *
 * Con más que esto los tramos dejan de distinguirse —a 390 px de ancho, treinta
 * segmentos son treinta filos y ninguna forma— y la pista pasa de contar algo a
 * ser una textura. Se dibujan las más recientes, que son las que la lista de
 * abajo enseña.
 */
const OPEN_SEGMENTS = 24;

/**
 * La pista de una causa SIN META: no un porcentaje, una composición.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTA PISTA NO MIDE NADA, Y POR QUÉ ESTÁ BIEN
 *
 * Una causa sin presupuesto anotado no tiene denominador, así que aquí no puede
 * haber porcentaje: cualquier número que se pintara estaría dividido por una
 * cifra inventada. Antes eso se resolvía no dibujando nada —`goal === 0`
 * devolvía null en las cuatro pantallas—, y el resultado era que una causa a la
 * que sí había entrado dinero se veía exactamente igual que una a la que no.
 * Con $400.000 dentro, la ficha no lo decía en ninguna parte.
 *
 * Lo que se dibuja ahora es de qué está hecho lo que hay: un tramo por
 * aportación, del ancho que le toca dentro del total. La pista sale llena
 * siempre, y eso es correcto porque no representa «cuánto falta» sino «quiénes
 * pusieron». Cada filo es una persona. Que entre una donación más no llena más
 * la barra: la reparte, y aparece un tramo nuevo.
 *
 * La cifra grande al lado es lo recibido, y es la única que se afirma. La pista
 * no dice ni que sobre ni que falte, porque no hay contra qué.
 * ---------------------------------------------------------------------------
 */
export function OpenMoneyTrack({
  amounts,
  className = "h-3",
  tone = "paper",
}: {
  /** Lo que puso cada persona, de más reciente a más antiguo. */
  amounts: number[];
  className?: string;
  tone?: "paper" | "photo";
}) {
  const skin = tone === "photo" ? moneyTrackOnPhoto : moneyTrack;
  const shown = amounts.filter((amount) => amount > 0).slice(0, OPEN_SEGMENTS);
  const total = shown.reduce((sum, amount) => sum + amount, 0);

  // Sin aportaciones la pista se dibuja vacía en vez de desaparecer: es lo que
  // dice «aquí se puede poner algo» y lo que hace que la ficha no cambie de
  // forma cuando entre la primera.
  if (total === 0) {
    return (
      <div
        role="img"
        aria-label="Todavía sin donaciones. Esta causa no tiene meta definida."
        className={`overflow-hidden rounded-full ${skin.rest} ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`${shown.length} ${shown.length === 1 ? "donación" : "donaciones"} que suman ${formatCOP(total)}. Esta causa no tiene meta definida.`}
      className={`flex overflow-hidden rounded-full ${skin.rest} ${className}`}
    >
      {shown.map((amount, index) => (
        <span
          key={index}
          aria-hidden
          // El filo separa una aportación de la siguiente, igual que separa los
          // dos tramos en la pista con meta. El último no lo lleva: un borde
          // contra el final de la pista se lee como un tramo que falta.
          className={`${skin.donated} ${index < shown.length - 1 ? `border-r-2 ${skin.edge}` : ""}`}
          style={{ width: `${(amount / total) * 100}%` }}
        />
      ))}
    </div>
  );
}

/**
 * La barra de tres estados: utilizado, donado y objetivo.
 *
 * Es una sola pista, de izquierda a derecha, en el orden en que se llena: lo
 * ya comprado, lo que ha entrado, y el resto de la meta. La leyenda sigue ese
 * mismo orden, con el objetivo a la derecha, debajo del tramo que falta.
 *
 * Sin meta cambia de forma entera —ver `OpenMoneyTrack`—: se dice que está
 * abierta, se dice cuánto ha entrado, y no se dice ningún porcentaje.
 */
export function CaseMoneyTrack({
  progress,
  nextUp,
  amounts = [],
}: {
  progress: MoneyProgress;
  /**
   * Lo primero que falta del presupuesto. Solo se usa cuando no ha entrado ni
   * salido nada: es lo que ocupa el sitio del cero.
   */
  nextUp?: { title: string; amount_cop: number } | null;
  /**
   * Lo que puso cada persona. Solo hace falta sin meta, que es cuando la pista
   * se dibuja con un tramo por aportación.
   */
  amounts?: number[];
}) {
  if (progress.goal === 0) {
    return <OpenCaseMoney progress={progress} amounts={amounts} />;
  }

  // Ni donado ni comprado: el estado delicado. No es lo mismo que «va por cero».
  const sinEmpezar = progress.raised === 0 && progress.delivered === 0;

  return (
    <div>
      {/* Con la meta puesta y nada dentro, aquí salía «$ 0 entregados de
          $ 1.600.000». Es cierto y es lo peor que se puede escribir en esta
          línea: un cero grande en la tipografía de titulares, encima de una barra
          vacía, se lee como que esta causa no le importa a nadie —y en producción,
          sin pasarela conectada, sería el estado de TODAS—. Lo que hace la
          referencia en su cero es dejar de contar y pedir: enseña la meta y el
          botón, no el cero.

          Aquí se puede pedir mejor que ella, porque hay presupuesto: lo que
          sustituye al cero es el primer ítem con su precio. Convierte una barra
          vacía en un encargo concreto y alcanzable, que es lo contrario de
          desanimar. La barra sigue debajo, vacía y sin fingir nada. */}
      {sinEmpezar ? (
        <div>
          <p className="text-[15px] leading-snug text-muted">
            <span className="font-medium text-ink">Todavía sin donaciones</span>
            <span className="text-faint"> de una meta de {formatCOP(progress.goal)}</span>
          </p>
          {nextUp && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              Lo primero: {nextUp.title} ·{" "}
              <span className="tabular-nums text-ink">{formatCOP(nextUp.amount_cop)}</span>
            </p>
          )}
        </div>
      ) : (
        <p className="text-[15px] leading-snug text-muted">
          <span className="font-display text-[24px] leading-none tabular-nums text-ink lg:text-[28px]">
            {formatCOP(progress.raised > 0 ? progress.raised : progress.delivered)}
          </span>
          <span className="text-faint">
            {" "}
            {progress.raised > 0 ? "donados" : "entregados"} de {formatCOP(progress.goal)}
          </span>
        </p>
      )}

      <MoneyTrackFill progress={progress} className="mt-3 h-3" />

      <MoneyTrackLegend progress={progress} />
    </div>
  );
}

/**
 * La sección de dinero de una causa sin meta.
 *
 * Dice tres cosas y ninguna de ellas es un porcentaje: que está abierta, cuánto
 * ha entrado, y de cuántas aportaciones está hecho. La palabra «meta» sale una
 * vez, para decir que no hay: callarlo dejaría a quien mira preguntándose si la
 * cifra que ve es mucho o poco, que es la pregunta que no se puede contestar
 * aquí y que por eso hay que retirar.
 */
function OpenCaseMoney({
  progress,
  amounts,
}: {
  progress: MoneyProgress;
  amounts: number[];
}) {
  const given = amounts.filter((amount) => amount > 0);

  return (
    <div>
      {progress.raised > 0 ? (
        <p className="text-[15px] leading-snug text-muted">
          <span className="font-display text-[24px] leading-none tabular-nums text-ink lg:text-[28px]">
            {formatCOP(progress.raised)}
          </span>
          <span className="text-faint"> recibidos, sin meta definida</span>
        </p>
      ) : (
        <p className="text-[15px] leading-snug text-muted">
          <span className="font-medium text-ink">Abierta a donaciones</span>
          <span className="text-faint"> · todavía sin meta definida</span>
        </p>
      )}

      <OpenMoneyTrack amounts={given} className="mt-3 h-3" />

      <p className="mt-3 text-[12px] leading-relaxed text-faint">
        {given.length > 0 ? (
          <>
            {given.length === 1
              ? "Una aportación"
              : `${given.length} aportaciones`}
            , cada una un tramo de la barra. El equipo todavía está cerrando
            precios, así que no hay objetivo que alcanzar.
          </>
        ) : (
          <>
            El equipo todavía está cerrando precios. Se puede donar: cada
            aportación aparece aquí como un tramo.
          </>
        )}
      </p>
    </div>
  );
}

/** Los tres tramos, con el mismo orden y los mismos colores que la pista. */
export function MoneyTrackLegend({
  progress,
  className = "mt-3",
}: {
  progress: MoneyProgress;
  className?: string;
}) {
  return (
    <ul className={`${className} grid grid-cols-3 gap-2 text-[12px] leading-snug`}>
      <li>
        <p className="flex items-center gap-1.5 text-faint">
          <span aria-hidden className={`size-2 rounded-full ${moneyTrack.used}`} />
          Utilizado
        </p>
        <p className="mt-0.5 font-medium tabular-nums text-ink">
          {shortCOP(progress.delivered)}
        </p>
      </li>
      <li>
        <p className="flex items-center justify-center gap-1.5 text-faint">
          <span aria-hidden className={`size-2 rounded-full ${moneyTrack.donated}`} />
          Donado
        </p>
        <p className="mt-0.5 text-center font-medium tabular-nums text-ink">
          {shortCOP(progress.raised)}
        </p>
      </li>
      <li>
        <p className="flex items-center justify-end gap-1.5 text-faint">
          <span
            aria-hidden
            className={`size-2 rounded-full ring-1 ring-line ${moneyTrack.rest}`}
          />
          Objetivo
        </p>
        <p className="mt-0.5 text-right font-medium tabular-nums text-ink">
          {shortCOP(progress.goal)}
        </p>
      </li>
    </ul>
  );
}
