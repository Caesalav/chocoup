import Link from "next/link";
import { CaseProgressBar } from "@/components/case/CaseProgressBar";
import { card } from "@/components/ui/styles";
import { campaignHref, type ResolvedCampaign } from "@/lib/campaign";
import { progressPercent } from "@/lib/case-progress";

/**
 * El recado largo: a dónde ir ahora, y por qué.
 *
 * En el inicio basta una línea junto al mapa. Aquí, al lado de /mapa en
 * escritorio, hay sitio para el porcentaje, la barra y el enlace.
 */
export function CampaignCard({ campaign }: { campaign: ResolvedCampaign }) {
  const { city, source, caseName, note } = campaign;
  const href = campaignHref(campaign);
  const percent = progressPercent(city.progress.ratio);

  return (
    <article className={`${card} p-5`}>
      <p className="text-[12px] text-accent-strong">
        {source === "editorial" ? "Foco ahora" : "Donde más falta"}
      </p>
      <h2 className="mt-1.5 font-display text-[26px] leading-none text-ink">
        {caseName ?? city.name}
        {caseName && (
          <span className="text-faint">
            , {city.name}
          </span>
        )}
      </h2>
      <p className="mt-2.5 text-[14px] leading-relaxed text-muted">
        {note ||
          (city.progress.total > 0
            ? `Va al ${percent} %. ${
                source === "editorial"
                  ? "Coordinación pidió concentrar la ayuda aquí."
                  : "Es el pueblo documentado donde más queda por cubrir."
              }`
            : "Todavía no hay necesidades anotadas; el equipo ya documentó el municipio.")}
      </p>
      {city.progress.total > 0 && (
        <div className="mt-4">
          <CaseProgressBar needs={city.needs} compact />
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={href}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 text-[14px] font-medium text-paper transition-[background-color,scale] duration-150 hover:bg-accent-strong active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {caseName ? "Ver la causa" : `Ir a ${city.name}`}
        </Link>
      </div>
    </article>
  );
}
