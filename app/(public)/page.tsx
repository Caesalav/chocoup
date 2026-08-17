import Link from "next/link";
import { CanvasBottomBar } from "@/components/canvas/CanvasBottomBar";
import { CategoryList } from "@/components/canvas/CategoryList";
import { FeatureCard } from "@/components/canvas/FeatureCard";
import { ScopeRail } from "@/components/canvas/ScopeRail";
import { CityCard } from "@/components/CityCard";
import { ChocoMap } from "@/components/map/ChocoMap";
import { ColombiaLocator } from "@/components/map/ColombiaLocator";
import { Steps } from "@/components/Steps";
import { button } from "@/components/ui/styles";
import {
  categoryOptions,
  countNeeds,
  filterCities,
  parseCategory,
  parseScope,
} from "@/lib/canvas-filters";
import { getCityCards } from "@/lib/data";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ ambito?: string; necesidad?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const scope = parseScope(params.ambito);
  const category = parseCategory(params.necesidad);

  const cities = await getCityCards();
  const options = categoryOptions(cities, scope);
  const active = options.some((option) => option.value === category) ? category : "todas";
  const matching = filterCities(cities, scope, active);
  const openNeeds = countNeeds(cities, scope, active);
  const featured = matching[0];

  const updatedAt =
    cities.map((city) => city.updated_at).sort((a, b) => b.localeCompare(a))[0] ?? null;

  const pins = matching.map((city, index) => ({
    id: city.id,
    name: city.name,
    slug: city.slug,
    lat: city.lat,
    lng: city.lng,
    index: index + 1,
    featured: index === 0,
  }));

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Lienzo: el mapa manda y el resto flota encima.                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative isolate overflow-hidden bg-canvas lg:h-[100svh]">
        {/* El mapa manda en la composición: centrado entre la columna de texto y
            la tarjeta flotante, y sangrando bajo la cabecera y la barra inferior,
            que al ser translúcidas dejan ver el terreno por debajo. */}
        <div className="pointer-events-none absolute inset-y-0 left-[26%] right-[22%] hidden items-center justify-center lg:flex">
          <ChocoMap
            pins={pins}
            linkBase="/ciudades"
            className="pointer-events-auto h-[88svh] w-auto"
          />
        </div>

        <div className="absolute left-6 top-1/2 hidden -translate-y-1/2 lg:block">
          <ScopeRail scope={scope} category={active} />
        </div>

        <div className="absolute left-24 top-1/2 hidden w-[330px] -translate-y-1/2 lg:block">
          <p className="enters enters-1 text-[15px] leading-snug text-muted">
            Después del terremoto, esto es lo que falta en el Chocó.
          </p>
          <div className="enters enters-2 mt-6">
            <CategoryList options={options} active={active} scope={scope} />
          </div>

          <div className="enters enters-3 mt-8 border-t border-line pt-6">
            <Link href="/ofrecer" className={`${button.primary} w-full`}>
              Quiero ayudar
            </Link>
            <div className="mt-5">
              <Steps compact />
            </div>
          </div>
        </div>

        <div className="absolute right-7 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-7 lg:flex">
          {matching.length > 0 && (
            <ul className="flex flex-col items-center gap-3">
              {matching.map((city, index) => (
                <li key={city.id}>
                  <Link
                    href={`/ciudades/${city.slug}`}
                    aria-label={city.name}
                    className="block size-1.5 rounded-full transition-colors"
                    style={undefined}
                  >
                    <span
                      className={`block size-1.5 rounded-full ${
                        index === 0 ? "bg-amber" : "bg-faint hover:bg-body"
                      }`}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link href="/ofrecer" className="group flex flex-col items-center gap-2">
            <span className="pulse-ring relative flex size-12 items-center justify-center rounded-full bg-amber text-base transition-[background-color,transform] duration-150 group-hover:bg-amber-bright group-active:scale-95">
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-faint transition-colors group-hover:text-body">
              Ayudar
            </span>
          </Link>
        </div>

        {/* Un filtro sin resultados no debe ser un callejón sin salida. */}
        {matching.length === 0 && (
          <div className="absolute left-24 bottom-[140px] hidden w-[330px] rounded-xl border border-line bg-panel/70 p-5 backdrop-blur-md lg:block">
            <p className="text-[15px] leading-snug text-body">
              Aquí no hay nada pendiente ahora mismo.
            </p>
            <Link
              href="/"
              className="smallcaps mt-3 inline-block text-[15px] text-amber hover:text-amber-bright"
            >
              Ver todo lo que falta
            </Link>
          </div>
        )}

        {featured && (
          <div className="absolute bottom-[140px] right-7 hidden lg:block">
            <FeatureCard city={featured} matchingNeeds={featured.matchingNeeds} />
          </div>
        )}

        <div className="absolute inset-x-5 bottom-5 hidden lg:block">
          <CanvasBottomBar
            openNeeds={openNeeds}
            updatedAt={updatedAt}
            cities={matching}
            contextLabel={active === "todas" ? "Necesidades abiertas" : "Abiertas en esta categoría"}
          />
        </div>

        {/* -------------------------- Móvil -------------------------- */}
        <div className="px-5 pb-8 pt-24 lg:hidden">
          <div className="enters enters-1 flex items-start gap-4">
            <ColombiaLocator className="h-auto w-14 shrink-0" />
            <p className="text-[15px] leading-snug text-muted">
              Después del terremoto, esto es lo que falta en el Chocó.
            </p>
          </div>

          <Link
            href="/ofrecer"
            className={`${button.primary} enters enters-2 mt-6 w-full`}
          >
            Quiero ayudar
          </Link>

          <div className="enters enters-2 mt-6 border-y border-line py-5">
            <Steps compact />
          </div>

          <div className="enters enters-3 mt-7">
            <p className="text-[11px] uppercase tracking-[0.18em] text-faint">A quién ayudar</p>
            <div className="mt-3">
              <ScopeRail scope={scope} category={active} orientation="horizontal" />
            </div>
          </div>

          <div className="mt-7">
            <CategoryList options={options} active={active} scope={scope} />
          </div>

          <ChocoMap pins={pins} linkBase="/ciudades" className="mt-8 h-auto w-full" />

          <div className="mt-6">
            <CanvasBottomBar
              openNeeds={openNeeds}
              updatedAt={updatedAt}
              cities={matching}
              contextLabel={
                active === "todas" ? "Necesidades abiertas" : "Abiertas en esta categoría"
              }
            />
          </div>

          {featured ? (
            <div className="mt-6">
              <FeatureCard city={featured} matchingNeeds={featured.matchingNeeds} />
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-line bg-panel/60 p-5">
              <p className="text-[15px] leading-snug text-body">
                Aquí no hay nada pendiente ahora mismo.
              </p>
              <Link
                href="/"
                className="smallcaps mt-3 inline-block text-[15px] text-amber hover:text-amber-bright"
              >
                Ver todo lo que falta
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Debajo del lienzo, el contenido completo.                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-16">
          <div>
            <h2 className="font-display text-3xl leading-tight text-ink">
              La situación tras el terremoto, municipio a municipio
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Este es el registro de lo que estamos viendo en terreno: qué pasó en cada municipio,
              qué necesita cada zona y qué necesitan las familias. Si puedes aportar algo concreto,
              puedes vincularlo directamente a la necesidad.
            </p>
            <div className="mt-6 hidden items-start gap-4 lg:flex">
              <ColombiaLocator className="h-auto w-16 shrink-0" />
              <p className="text-xs leading-relaxed text-faint">
                El Chocó está en la costa pacífica. Muchos de sus municipios solo se alcanzan por
                río, por avioneta o por lancha.
              </p>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-faint">
              Municipios documentados
            </p>
            {cities.length === 0 ? (
              <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-muted">
                Todavía no hay municipios publicados. El equipo los va publicando desde el terreno a
                medida que documenta cada zona.
              </p>
            ) : (
              <ul className="mt-5 space-y-3">
                {cities.map((city) => (
                  <CityCard key={city.id} city={city} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
