import Link from "next/link";
import { campaignHref, type ResolvedCampaign } from "@/lib/campaign";
import { progressPercent } from "@/lib/case-progress";

/**
 * El recado en una línea: a dónde ir ahora, sin comerse el mapa.
 *
 * El tablero ya pinta el pueblo; aquí solo hace falta el nombre, el % y el
 * enlace. La tarjeta larga vive al lado de /mapa en escritorio, donde sí hay
 * sitio para el porqué.
 */
export function CampaignStrip({
  campaign,
  className = "text-[13px] leading-snug text-muted",
}: {
  campaign: ResolvedCampaign;
  className?: string;
}) {
  const { city, source, caseName } = campaign;
  const percent = progressPercent(city.progress.ratio);
  const name = caseName ?? city.name;

  return (
    <p className={className}>
      <span className="text-accent-strong">
        {source === "editorial" ? "Foco ahora" : "Donde más falta"}
      </span>
      <span aria-hidden> · </span>
      <Link
        href={campaignHref(campaign)}
        className="font-medium text-ink underline-offset-2 hover:underline"
      >
        {name}
      </Link>
      {caseName && <span className="text-faint">, {city.name}</span>}
      {city.progress.total > 0 && (
        <>
          <span aria-hidden> · </span>
          <span className="tabular-nums">{percent} % cubierto</span>
        </>
      )}
    </p>
  );
}
