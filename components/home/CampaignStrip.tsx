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

/**
 * Las dos versiones de la misma frase, según la superficie que le toque debajo.
 *
 * Hacen falta dos porque esta pieza vive en los dos sitios: sobre el papel de la
 * cabecera de /mapa y dentro del bloque de `selva` de la portada. Con un solo
 * juego de colores, el de papel desaparecía sobre el verde oscuro —`ink` sobre
 * `selva` es 1,5:1— y el de verde oscuro desaparecía sobre el papel.
 *
 * No es una preferencia de estilo con dos opciones abiertas: son exactamente dos
 * superficies posibles, y cada tinta está medida contra la suya. Sobre `selva`:
 * `brote` 9,52:1, `luz` 12,77:1, `luz/70` 7,06:1. Sobre papel son las de
 * siempre. Y sobre `selva` los valores aguantan también cuando debajo pasa una
 * cinta, que es el motivo de que las cintas vayan al 35 %.
 */
const TONOS = {
  claro: {
    wrap: "text-muted",
    label: "text-accent-strong",
    link: "text-ink",
    city: "text-faint",
  },
  oscuro: {
    wrap: "text-luz/85",
    label: "text-brote",
    link: "text-luz",
    city: "text-luz/70",
  },
} as const;

export function CampaignStrip({
  campaign,
  tone = "claro",
  className = "text-[13px] leading-snug",
}: {
  campaign: ResolvedCampaign;
  tone?: keyof typeof TONOS;
  className?: string;
}) {
  const { city, source, caseName } = campaign;
  const percent = progressPercent(city.progress.ratio);
  const name = caseName ?? city.name;
  const t = TONOS[tone];

  return (
    <p className={`${t.wrap} ${className}`}>
      <span className={t.label}>
        {source === "editorial" ? "Foco ahora" : "Donde más falta"}
      </span>
      <span aria-hidden> · </span>
      <Link
        href={campaignHref(campaign)}
        className={`font-medium underline-offset-2 hover:underline ${t.link}`}
      >
        {name}
      </Link>
      {caseName && <span className={t.city}>, {city.name}</span>}
      {city.progress.total > 0 && (
        <>
          <span aria-hidden> · </span>
          <span className="tabular-nums">{percent} % cubierto</span>
        </>
      )}
    </p>
  );
}
