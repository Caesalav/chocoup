import Link from "next/link";
import { CampaignStrip } from "@/components/home/CampaignStrip";
import { ChocoMap } from "@/components/map/ChocoMap";
import { NeedsLegend } from "@/components/map/NeedsLegend";
import { card } from "@/components/ui/styles";
import type { ResolvedCampaign } from "@/lib/campaign";
import type { CityCardData } from "@/lib/types";

/**
 * El tablero en la portada: el recado y el mapa, juntos.
 *
 * /mapa sigue siendo la vista a pantalla, con Colombia, la leyenda al pie y
 * las tarjetas al lado. Aquí el oficio es otro: abrir el portal y ver de un
 * vistazo dónde falta, como se abre el juego y se ve la galaxia. El mapa no
 * ocupa la pantalla entera —se comería municipios, casos y el estado del
 * registro— pero sí es lo primero que se mira después de la marca.
 */
export function HomeBoard({
  cities,
  campaign,
}: {
  cities: CityCardData[];
  campaign: ResolvedCampaign | null;
}) {
  const pins = cities.map((city) => ({
    id: city.id,
    name: city.name,
    slug: city.slug,
    lat: city.lat,
    lng: city.lng,
    progress: city.progress,
  }));

  return (
    <section className={`${card} p-4 sm:p-5`} aria-label="Tablero del Chocó">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="font-display text-[18px] leading-none text-ink">El Chocó ahora</h2>
          {campaign ? (
            <div className="mt-2">
              <CampaignStrip campaign={campaign} />
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-muted">
              Los pueblos en color son los documentados. Gris es que todavía nadie ha llegado.
            </p>
          )}
        </div>
        <Link
          href="/mapa"
          className="shrink-0 text-[13px] text-accent-strong hover:text-accent"
        >
          Ver el mapa entero
        </Link>
      </div>

      <div className="relative mt-4 h-[min(52svh,32rem)] min-h-[16rem]">
        <ChocoMap
          pins={pins}
          hrefFor={(pin) => `/ciudades/${pin.slug}`}
          activeSlug={campaign?.city.slug}
          className="size-full"
        />
      </div>

      <div className="mt-3">
        <NeedsLegend />
      </div>
    </section>
  );
}
