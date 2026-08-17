import Link from "next/link";
import { excerpt, photoUrl, plural } from "@/lib/format";
import type { CityCardData } from "@/lib/types";

/**
 * Tarjeta flotante de detalle, con la foto sangrando por el lado izquierdo y la
 * llamada a la acción ocupando todo el pie, como en la referencia.
 *
 * Muestra el municipio con más necesidades abiertas: quien llega al portal ve
 * primero dónde aprieta más.
 */
export function FeatureCard({
  city,
  matchingNeeds,
}: {
  city: CityCardData;
  matchingNeeds: number;
}) {
  return (
    <article className="w-[320px] overflow-hidden rounded-xl border border-line-strong bg-panel-high/80 backdrop-blur-md sm:w-[380px]">
      <div className="flex gap-4">
        {city.coverPath ? (
          <img
            src={photoUrl(city.coverPath)}
            alt=""
            className="h-[124px] w-[104px] shrink-0 object-cover"
          />
        ) : (
          <div className="h-[124px] w-[104px] shrink-0 bg-land" />
        )}

        <div className="min-w-0 flex-1 py-3.5 pr-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-amber">Más necesidades</p>
          <h2 className="mt-1 font-display text-xl leading-tight text-ink">{city.name}</h2>
          {city.summary && (
            <p className="mt-1.5 text-[12px] leading-snug text-muted">
              {excerpt(city.summary, 72)}
            </p>
          )}
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-body">
            <span className="size-1.5 rounded-full bg-amber" />
            {plural(matchingNeeds, "necesidad abierta", "necesidades abiertas")}
            {city.caseCount > 0 && (
              <span className="text-faint">· {plural(city.caseCount, "caso", "casos")}</span>
            )}
          </p>
        </div>
      </div>

      <Link
        href={`/ciudades/${city.slug}`}
        className="block border-t border-line py-3 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-body transition-colors hover:bg-amber hover:text-base"
      >
        Ver el municipio
      </Link>
    </article>
  );
}
