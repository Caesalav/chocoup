import Link from "next/link";
import { CaseProgressBar } from "@/components/case/CaseProgressBar";
import { card } from "@/components/ui/styles";
import { campaignHref, type ResolvedCampaign } from "@/lib/campaign";
import { moneyProgress } from "@/lib/money-progress";

/**
 * El recado largo: a dónde ir ahora, y por qué.
 *
 * En el inicio basta una línea junto al mapa. Aquí, al lado de /mapa en
 * escritorio, hay sitio para el porcentaje, la barra y el enlace.
 */
export function CampaignCard({ campaign }: { campaign: ResolvedCampaign }) {
  const { city, source, caseName, note } = campaign;
  const href = campaignHref(campaign);
  // La misma cuenta que el anillo de la barra que va debajo. Con
  // `city.progress.ratio` esta frase decía un porcentaje y la barra otro.
  const progress = moneyProgress(city.budget);

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
          (city.budget.goal === 0
            ? "Todavía no hay presupuesto anotado; el equipo ya documentó el municipio."
            : `${
                progress.percent === null
                  ? "Todavía no se ha comprado nada."
                  : `Va al ${progress.percent} % de lo entregado.`
              } ${
                source === "editorial"
                  ? "Coordinación pidió concentrar la ayuda aquí."
                  : "Es el pueblo documentado donde más queda por cubrir."
              }`)}
      </p>
      {city.budget.goal > 0 && (
        <div className="mt-4">
          <CaseProgressBar budget={city.budget} compact />
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
