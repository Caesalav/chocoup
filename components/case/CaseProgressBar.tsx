import { caseProgress } from "@/lib/case-progress";
import type { Need } from "@/lib/types";

/**
 * Barra de avance de un caso, según sus necesidades.
 *
 * Cubierta llena, parcial a la mitad. Sin necesidades no se dibuja: un 0 %
 * fingido diría que no se ha hecho nada cuando lo que pasa es que todavía no
 * se ha anotado qué falta.
 */
export function CaseProgressBar({
  needs,
  compact = false,
}: {
  needs: Pick<Need, "status">[];
  compact?: boolean;
}) {
  const progress = caseProgress(needs);
  if (progress.total === 0) return null;

  const percent = Math.round(progress.ratio * 100);
  const label = `${progress.covered} de ${progress.total} ${
    progress.total === 1 ? "necesidad cubierta" : "necesidades cubiertas"
  }`;

  return (
    <div>
      {!compact && (
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-[22px] leading-none tabular-nums text-ink">
            {percent}
            <span className="text-[15px] text-faint"> %</span>
          </p>
          <p className="text-[13px] text-muted">{label}</p>
        </div>
      )}

      <div
        role="img"
        aria-label={label}
        className={`overflow-hidden rounded-full bg-canvas ${compact ? "h-1.5" : "mt-3 h-2"}`}
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
      </div>

      {compact && (
        <p className="mt-1.5 text-[12px] text-faint">
          {progress.covered}/{progress.total} cubiertas
          {progress.partial > 0 && ` · ${progress.partial} a medias`}
        </p>
      )}

      {!compact && progress.partial > 0 && (
        <p className="mt-2 text-[12px] text-faint">
          {progress.partial === 1 ? "1 va a medias" : `${progress.partial} van a medias`}, y cuenta
          a la mitad.
        </p>
      )}
    </div>
  );
}
