import Link from "next/link";
import { excerpt, photoUrl, plural } from "@/lib/format";
import type { CityCardData } from "@/lib/types";

export function CityCard({ city }: { city: CityCardData }) {
  return (
    <li>
      <Link
        href={`/ciudades/${city.slug}`}
        className="group flex gap-4 rounded-xl border border-line bg-panel/50 p-3 transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:bg-panel/80 active:translate-y-0"
      >
        <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-land sm:size-24">
          {city.coverPath ? (
            <img
              src={photoUrl(city.coverPath)}
              alt=""
              loading="lazy"
              className="size-full object-cover opacity-90 transition-[opacity,transform] duration-300 group-hover:scale-[1.04] group-hover:opacity-100"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-[11px] text-faint">
              Sin fotos
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl leading-tight text-ink">{city.name}</h3>
          {city.summary && (
            <p className="mt-1 text-sm leading-snug text-muted">{excerpt(city.summary, 110)}</p>
          )}
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[11px] text-faint">
            {city.openNeeds > 0 ? (
              <span className="flex items-center gap-1.5 text-amber">
                <span className="size-1.5 rounded-full bg-amber" />
                {plural(city.openNeeds, "necesidad abierta", "necesidades abiertas")}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-teal-light">
                <span className="size-1.5 rounded-full bg-teal" />
                Sin necesidades abiertas
              </span>
            )}
            {city.caseCount > 0 && <span>· {plural(city.caseCount, "caso", "casos")}</span>}
          </p>
        </div>
      </Link>
    </li>
  );
}
