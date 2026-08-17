import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChocoMap } from "@/components/map/ChocoMap";
import { FoundationCard } from "@/components/FoundationCard";
import { NeedsList } from "@/components/NeedsList";
import { PhotoGrid } from "@/components/PhotoGrid";
import { DraftChip, IndexBadge } from "@/components/ui/Chip";
import { panel } from "@/components/ui/styles";
import { getCityPage } from "@/lib/data";
import { excerpt, formatDate, photoUrl, plural } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCityPage(slug);
  if (!data) return { title: "Municipio no encontrado" };
  return {
    title: data.city.name,
    description: data.city.summary ? excerpt(data.city.summary, 155) : undefined,
  };
}

export default async function CityPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCityPage(slug);
  if (!data) notFound();

  const { city, foundations, photos, zoneNeeds, cases } = data;
  const primary = foundations.find((foundation) => foundation.is_primary) ?? foundations[0];
  const others = foundations.filter((foundation) => foundation.id !== primary?.id);
  const openNeeds = zoneNeeds.filter((need) => need.status !== "cubierta").length;

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-16 pt-28 sm:px-8">
      <Link
        href="/"
        className="smallcaps inline-flex items-center gap-2 text-[15px] text-muted transition-colors hover:text-ink"
      >
        <span className="text-amber">←</span> Todos los municipios
      </Link>

      <header className="mt-6 border-b border-line pb-10">
        <p className="text-[11px] uppercase tracking-[0.18em] text-faint">Chocó · Colombia</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink sm:text-6xl">
          {city.name}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.12em] text-faint">
          <span>Actualizado {formatDate(city.updated_at)}</span>
          {openNeeds > 0 && (
            <span className="flex items-center gap-2 text-amber">
              <span className="size-1.5 rounded-full bg-amber" />
              {plural(openNeeds, "necesidad abierta", "necesidades abiertas")}
            </span>
          )}
          {cases.length > 0 && <span>{plural(cases.length, "caso", "casos")}</span>}
          {!city.published && <DraftChip label="Sin publicar" />}
        </div>
      </header>

      <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
        <div className="min-w-0">
          {city.summary && (
            <div className="max-w-prose space-y-5 text-[17px] leading-[1.75] text-body">
              {city.summary.split(/\n\s*\n/).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

          {photos.length > 0 && (
            <section className="mt-14">
              <h2 className="text-[11px] uppercase tracking-[0.18em] text-faint">La situación</h2>
              <div className="mt-5">
                <PhotoGrid photos={photos} featureFirst />
              </div>
            </section>
          )}

          <section className="mt-16">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-3xl leading-tight text-ink">
                Qué necesita la zona
                <sup className="ml-1.5 align-super text-[0.42em] font-normal text-muted">
                  ({openNeeds})
                </sup>
              </h2>
              <Link
                href={`/ofrecer?city=${city.slug}`}
                className="smallcaps text-[15px] text-amber hover:text-amber-bright"
              >
                Ofrecer algo para {city.name}
              </Link>
            </div>
            <div className="mt-6">
              <NeedsList
                needs={zoneNeeds}
                emptyLabel="Todavía no hemos registrado necesidades de la zona."
              />
            </div>
          </section>

          <section className="mt-16">
            <h2 className="font-display text-3xl leading-tight text-ink">
              Casos
              <sup className="ml-1.5 align-super text-[0.42em] font-normal text-muted">
                ({cases.length})
              </sup>
            </h2>
            {cases.length === 0 ? (
              <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-muted">
                Todavía no hay casos publicados de este municipio. Solo publicamos casos cuando la
                persona da su consentimiento.
              </p>
            ) : (
              <ul className="mt-6 grid gap-5 sm:grid-cols-2">
                {cases.map((caseRecord, index) => (
                  <li key={caseRecord.id}>
                    <Link
                      href={`/ciudades/${city.slug}/casos/${caseRecord.id}`}
                      className="group block overflow-hidden rounded-xl border border-line bg-panel/50 transition-colors hover:border-line-strong hover:bg-panel/80"
                    >
                      <div className="relative">
                        {caseRecord.coverPath ? (
                          <img
                            src={photoUrl(caseRecord.coverPath)}
                            alt=""
                            loading="lazy"
                            className="aspect-3/2 w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                          />
                        ) : (
                          <div className="flex aspect-3/2 w-full items-center justify-center bg-land text-[11px] text-faint">
                            Sin fotos
                          </div>
                        )}
                        <IndexBadge
                          index={index + 1}
                          tone="teal"
                          className="absolute left-3 top-3 border-2 border-panel"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-display text-xl leading-tight text-ink">
                          {caseRecord.display_name}
                        </h3>
                        {caseRecord.household && (
                          <p className="mt-1 text-sm text-muted">{caseRecord.household}</p>
                        )}
                        {caseRecord.story && (
                          <p className="mt-2 text-sm leading-snug text-faint">
                            {excerpt(caseRecord.story, 110)}
                          </p>
                        )}
                        {caseRecord.openNeeds > 0 && (
                          <p className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-amber">
                            <span className="size-1.5 rounded-full bg-amber" />
                            {plural(
                              caseRecord.openNeeds,
                              "necesidad abierta",
                              "necesidades abiertas",
                            )}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ------------------------------ Aparte ------------------------------ */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {primary && (
            <>
              <h2 className="text-[11px] uppercase tracking-[0.18em] text-faint">Dónde donar</h2>
              <p className="mt-2 text-xs leading-relaxed text-faint">
                El dinero va directo a la fundación que ya trabaja en {city.name}. Este portal solo
                enlaza su canal oficial: nada de lo que dones pasa por aquí.
              </p>
              <div className="mt-4 space-y-4">
                <FoundationCard foundation={primary} cityName={city.name} />
                {others.map((foundation) => (
                  <FoundationCard
                    key={foundation.id}
                    foundation={foundation}
                    cityName={city.name}
                  />
                ))}
              </div>
            </>
          )}

          <div className={`${panel} mt-6 p-5`}>
            <h2 className="font-display text-xl leading-tight text-ink">
              ¿Puedes aportar un recurso?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Si conoces a alguien que pueda donar o proporcionar algo de esta lista, déjanos el
              contacto y lo cruzamos con la necesidad.
            </p>
            <Link
              href={`/ofrecer?city=${city.slug}`}
              className="mt-5 flex min-h-11 items-center justify-center rounded-full bg-amber px-5 text-[11px] font-medium uppercase tracking-[0.16em] text-base transition-colors hover:bg-amber-bright"
            >
              Ofrecer un recurso
            </Link>
          </div>

          <div className="mt-6 flex items-start gap-5 border-t border-line pt-6">
            <ChocoMap
              pins={[
                {
                  id: city.id,
                  name: city.name,
                  slug: city.slug,
                  lat: city.lat,
                  lng: city.lng,
                },
              ]}
              activeSlug={city.slug}
              bare
              className="h-auto w-24 shrink-0"
            />
            <div>
              <h2 className="text-[11px] uppercase tracking-[0.18em] text-faint">Ubicación</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {city.name} dentro del departamento del Chocó.
              </p>
              <p className="mt-1.5 text-[11px] tabular-nums text-faint">
                {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
