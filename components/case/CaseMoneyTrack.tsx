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
 * La barra de tres estados: utilizado, donado y objetivo.
 *
 * Es una sola pista, de izquierda a derecha, en el orden en que se llena: lo
 * ya comprado, lo que ha entrado, y el resto de la meta. La leyenda sigue ese
 * mismo orden, con el objetivo a la derecha, debajo del tramo que falta.
 */
export function CaseMoneyTrack({
  progress,
  nextUp,
}: {
  progress: MoneyProgress;
  /**
   * Lo primero que falta del presupuesto. Solo se usa cuando no ha entrado ni
   * salido nada: es lo que ocupa el sitio del cero.
   */
  nextUp?: { title: string; amount_cop: number } | null;
}) {
  if (progress.goal === 0) return null;

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
