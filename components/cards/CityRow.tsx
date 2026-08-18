import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { cardLink } from "@/components/ui/styles";
import { plural } from "@/lib/format";
import { needsTier, TIER_DOT } from "@/lib/needs-scale";
import type { CityCardData } from "@/lib/types";

/**
 * El municipio en una fila, para la lista y para los resultados de búsqueda.
 *
 * Lleva el punto de color de su tramo, el mismo que pinta su forma en el mapa:
 * quien llegue aquí desde el mapa reconoce el municipio por el color antes que
 * por el nombre.
 */
export function CityRow({ city }: { city: CityCardData }) {
  return (
    <Link
      href={`/ciudades/${city.slug}`}
      className={`${cardLink} flex h-full items-center gap-3.5 p-3`}
    >
      <Photo
        path={city.coverPath}
        frame={city.coverFrame}
        alt=""
        className="size-[76px] shrink-0 rounded-2xl"
        emptyLabel="Sin foto"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className={`size-2.5 shrink-0 rounded-full ${TIER_DOT[needsTier(city.openNeeds)]}`}
          />
          <h3 className="min-w-0 truncate font-display text-[18px] leading-tight text-ink">
            {city.name}
          </h3>
        </div>

        <p className="mt-1.5 text-[13px] text-muted">
          {plural(city.openNeeds, "necesidad abierta", "necesidades abiertas")}
        </p>
        <p className="mt-0.5 text-[12px] text-faint">
          {plural(city.caseCount, "caso documentado", "casos documentados")}
        </p>
      </div>
    </Link>
  );
}
