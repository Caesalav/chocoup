import Link from "next/link";
import { IndexBadge } from "@/components/ui/Chip";
import { formatDate, photoUrl, plural } from "@/lib/format";
import type { CityCardData } from "@/lib/types";

type BarCity = CityCardData & { matchingNeeds: number };

/**
 * Barra inferior del lienzo: a la izquierda el dato grande, a la derecha el
 * carrusel de municipios numerados igual que los pines del mapa.
 *
 * Donde la referencia pone el clima, aquí va lo que de verdad importa mirar de
 * un vistazo: cuántas necesidades siguen abiertas y de cuándo es el último dato.
 */
export function CanvasBottomBar({
  openNeeds,
  updatedAt,
  cities,
  contextLabel,
}: {
  openNeeds: number;
  updatedAt: string | null;
  cities: BarCity[];
  contextLabel: string;
}) {
  return (
    <div className="flex items-stretch gap-5 rounded-xl border border-line bg-panel/60 px-4 py-3.5 backdrop-blur-md sm:gap-7 sm:px-6">
      <div className="flex shrink-0 items-center gap-3.5">
        <span className="block size-2 rounded-full bg-amber" />
        <div>
          <p className="font-display text-3xl leading-none text-ink sm:text-4xl">{openNeeds}</p>
          <p className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-faint">
            {contextLabel}
          </p>
          {updatedAt && (
            <p className="mt-0.5 text-[11px] text-faint">Actualizado {formatDate(updatedAt)}</p>
          )}
        </div>
      </div>

      {cities.length > 0 && (
        <>
          <p className="hidden shrink-0 self-center text-[10px] uppercase tracking-[0.14em] text-faint lg:block">
            <span className="rail-label">Municipios {cities.length}</span>
          </p>

          <ul className="no-scrollbar flex flex-1 items-center gap-5 overflow-x-auto border-l border-line pl-5 sm:gap-7 sm:pl-7">
            {cities.map((city, index) => (
              <li key={city.id} className="shrink-0">
                <Link href={`/ciudades/${city.slug}`} className="group flex items-center gap-3">
                  <span className="relative">
                    {city.coverPath ? (
                      <img
                        src={photoUrl(city.coverPath)}
                        alt=""
                        loading="lazy"
                        className="size-11 rounded-lg object-cover opacity-85 transition-opacity group-hover:opacity-100"
                      />
                    ) : (
                      <span className="block size-11 rounded-lg bg-land" />
                    )}
                    <IndexBadge
                      index={index + 1}
                      tone={index === 0 ? "amber" : "teal"}
                      className="absolute -bottom-1.5 -right-1.5 size-6 border-2 border-panel text-[10px]"
                    />
                  </span>
                  <span className="block">
                    <span className="block whitespace-nowrap font-display text-[17px] leading-tight text-ink">
                      {city.name}
                    </span>
                    <span className="block whitespace-nowrap text-[11px] text-faint">
                      {plural(city.matchingNeeds, "necesidad abierta", "necesidades abiertas")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
