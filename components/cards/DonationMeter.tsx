import { MoneyTrackFill, MoneyTrackLegend } from "@/components/case/CaseMoneyTrack";
import type { BudgetProgress } from "@/lib/budget";
import { moneyProgress, shortCOP } from "@/lib/money-progress";

/**
 * La pista de dinero de una causa, en la fila de una lista.
 *
 * Es la misma de la ficha: mismos tramos, mismos colores, mismo alto. En las
 * tarjetas iba más fina y de un solo relleno, y al abrir el caso la barra
 * hablaba otro idioma —otro grosor, otro verde para «donado»—. Aquí no.
 */
export function DonationMeter({ budget }: { budget: BudgetProgress }) {
  const progress = moneyProgress(budget);

  /**
   * Sin meta no hay pista, y no es lo mismo que no haber nada que decir.
   *
   * Aquí se devolvía null y se acababa: una causa sin presupuesto con $400.000
   * dentro salía en la lista idéntica a una sin un peso. Lo que no se puede
   * dibujar es la pista —no hay denominador, y una barra llena en una fila de
   * 22 rem se lee como «cumplida»—, así que se escribe la cifra y se dice que
   * está abierta. Los tramos por aportación son de la ficha, que es donde cada
   * uno tiene sitio para verse; ver `OpenMoneyTrack`.
   */
  if (budget.goal === 0) {
    if (progress.raised === 0) return null;

    return (
      <p className="mt-2 text-[12px] leading-snug text-muted">
        <span className="font-medium tabular-nums text-ink">
          {shortCOP(progress.raised)} recibidos
        </span>{" "}
        <span className="text-faint">· abierta, sin meta</span>
      </p>
    );
  }

  return (
    <div className="mt-2">
      <MoneyTrackFill progress={progress} className="h-3" />
      <MoneyTrackLegend progress={progress} className="mt-2" />
    </div>
  );
}
