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
  tone = "paper",
}: {
  needs: Pick<Need, "status">[];
  compact?: boolean;
  /** Sobre una foto de portada el texto y el canal tienen que ser papel. */
  tone?: "paper" | "photo";
}) {
  const progress = caseProgress(needs);
  if (progress.total === 0) return null;

  const percent = Math.round(progress.ratio * 100);
  const label = `${progress.covered} de ${progress.total} ${
    progress.total === 1 ? "necesidad cubierta" : "necesidades cubiertas"
  }`;
  const onPhoto = tone === "photo";

  return (
    <div>
      {!compact && (
        <div className="flex items-baseline justify-between gap-3">
          <p
            className={`font-display text-[22px] leading-none tabular-nums ${
              onPhoto ? "text-paper" : "text-ink"
            }`}
          >
            {percent}
            <span className={`text-[15px] ${onPhoto ? "text-paper/55" : "text-faint"}`}> %</span>
          </p>
          <p className={`text-[13px] ${onPhoto ? "text-paper/75" : "text-muted"}`}>{label}</p>
        </div>
      )}

      <div
        role="img"
        aria-label={label}
        className={`overflow-hidden rounded-full ${onPhoto ? "bg-paper/25" : "bg-canvas"} ${
          compact ? "h-1.5" : "mt-3 h-2"
        }`}
      >
        <div
          className={`h-full rounded-full ${onPhoto ? "bg-paper" : "bg-accent"}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {compact && (
        <p className={`mt-1.5 text-[12px] ${onPhoto ? "text-paper/70" : "text-faint"}`}>
          {percent} % cubierto
          {progress.partial > 0 &&
            ` · ${progress.partial === 1 ? "1 a medias" : `${progress.partial} a medias`}`}
        </p>
      )}

      {!compact && progress.partial > 0 && (
        <p className={`mt-2 text-[12px] ${onPhoto ? "text-paper/60" : "text-faint"}`}>
          {progress.partial === 1 ? "1 va a medias" : `${progress.partial} van a medias`}, y cuenta
          a la mitad.
        </p>
      )}
    </div>
  );
}
