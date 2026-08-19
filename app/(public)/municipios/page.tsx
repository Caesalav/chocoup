import Link from "next/link";
import type { Metadata } from "next";
import { CityRow } from "@/components/cards/CityRow";
import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { card, cardGrid, shell } from "@/components/ui/styles";
import { getCityCards } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Municipios",
  description: "Los municipios del Chocó documentados tras el terremoto.",
};

export default async function CitiesPage() {
  const cities = await getCityCards();

  return (
    <>
      <div className={`${shell} pt-4 lg:pt-10`}>
        <ScreenHeader
          title="Municipios"
          subtitle="Donde el equipo ha estado. En el mapa, gris es sin visitar; verde es sin casos reportados."
          backHref="/"
          backLabel="Volver al inicio"
          count={cities.length}
        />

        {cities.length === 0 ? (
          <p className={`${card} mt-6 p-5 text-[14px] leading-relaxed text-muted`}>
            Todavía no hay ningún municipio publicado.
          </p>
        ) : (
          <ul className={`enters enters-1 mt-6 ${cardGrid}`}>
            {cities.map((city) => (
              <li key={city.id}>
                <CityRow city={city} />
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/mapa"
          className="mt-6 flex min-h-12 items-center justify-center rounded-full border border-line-strong bg-panel-high px-5 text-[14px] font-medium text-body transition-[border-color,color,scale] duration-150 hover:border-ink/40 hover:text-ink active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-fit sm:px-8"
        >
          Verlos en el mapa
        </Link>
      </div>

      <SiteFooter />
    </>
  );
}
