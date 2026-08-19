import { MoneyTrackFill, MoneyTrackLegend } from "@/components/case/CaseMoneyTrack";
import type { BudgetProgress } from "@/lib/budget";
import { moneyProgress } from "@/lib/money-progress";

/**
 * La pista de dinero de una causa, en la fila de una lista.
 *
 * Es la misma de la ficha: mismos tramos, mismos colores, mismo alto. En las
 * tarjetas iba más fina y de un solo relleno, y al abrir el caso la barra
 * hablaba otro idioma —otro grosor, otro verde para «donado»—. Aquí no.
 */
export function DonationMeter({ budget }: { budget: BudgetProgress }) {
  if (budget.goal === 0) return null;

  const progress = moneyProgress(budget);

  return (
    <div className="mt-2">
      <MoneyTrackFill progress={progress} className="h-3" />
      <MoneyTrackLegend progress={progress} className="mt-2" />
    </div>
  );
}
