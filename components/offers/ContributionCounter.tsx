import { card } from "@/components/ui/styles";
import {
  contributionHeadline,
  contributionNote,
  type ContributionTally,
} from "@/lib/contributions";

/**
 * Cuántos aportes se han hecho desde este formulario.
 *
 * Va arriba de «Quiero ayudar» y antes de la primera pregunta porque contesta lo
 * que se piensa al llegar: si esto lo usa alguien. Un formulario de ayuda sin
 * ninguna señal de que otras personas lo han usado se parece demasiado a un
 * buzón vacío.
 *
 * Y la señal tiene que ser comprobable, que es lo contrario de un contador de
 * marketing. Los dos números salen de la misma vista y el segundo se puede
 * verificar contando el registro de /ayudas; qué cuenta cada uno está escrito en
 * lib/contributions.ts y en supabase/migrations/0015_canal_general.sql. Aquí no
 * se cuenta nada: solo se pinta.
 *
 * El cero no se esconde. Un contador que solo aparece cuando el número queda bien
 * deja de ser un dato y pasa a ser un adorno, y en un portal que documenta un
 * terremoto eso se nota. La frase de `contributionNote` dice entonces lo que hay.
 */
export function ContributionCounter({ tally }: { tally: ContributionTally }) {
  return (
    <div className={`${card} mt-6 flex items-start gap-4 p-4`}>
      <p className="shrink-0 font-display text-[34px] leading-none tabular-nums text-accent-strong">
        {tally.ofrecidos}
      </p>
      <div className="min-w-0">
        <p className="font-display text-[16px] leading-tight text-ink">
          {contributionHeadline(tally)}
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          {contributionNote(tally)}
        </p>
      </div>
    </div>
  );
}
