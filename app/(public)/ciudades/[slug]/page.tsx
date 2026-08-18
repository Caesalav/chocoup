import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CaseBigCard } from "@/components/cards/CaseBigCard";
import { parseCitySection, SectionTabs } from "@/components/city/SectionTabs";
import { TransferKey } from "@/components/donations/TransferKey";
import { FoundationCard } from "@/components/FoundationCard";
import { ChocoMap } from "@/components/map/ChocoMap";
import { NeedsList } from "@/components/NeedsList";
import { PhotoGrid } from "@/components/PhotoGrid";
import { ShareLink } from "@/components/ShareLink";
import { SiteFooter } from "@/components/SiteFooter";
import { Photo } from "@/components/ui/Photo";
import { DraftChip } from "@/components/ui/Chip";
import { BackIcon, ShareIcon } from "@/components/ui/icons";
import {
  card,
  iconOnPaper,
  iconOnPhoto,
  pillOnPhoto,
  screenTitle,
  shell,
} from "@/components/ui/styles";
import { getCityPage, getDonationKey } from "@/lib/data";
import { excerpt, formatDate, plural } from "@/lib/format";
import { savedFrame } from "@/lib/photo-frame";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ver?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCityPage(slug);
  if (!data) return { title: "Municipio no encontrado" };
  return {
    title: data.city.name,
    description: data.city.summary ? excerpt(data.city.summary, 155) : undefined,
  };
}

export default async function CityPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { ver } = await searchParams;
  const [data, donationKey] = await Promise.all([getCityPage(slug), getDonationKey()]);
  if (!data) notFound();

  const { city, foundation, photos, zoneNeeds, caseNeeds, cases } = data;
  const openNeeds = zoneNeeds.filter((need) => need.status !== "cubierta").length;
  const listedNeeds = [...zoneNeeds, ...caseNeeds];
  const section = parseCitySection(ver);

  const cover = photos[0]?.storage_path ?? null;
  const shareUrl = await absoluteUrl(`/ciudades/${city.slug}`);
  const summaryParagraphs = city.summary ? city.summary.split(/\n\s*\n/) : [];

  return (
    <div className="relative">
      {cover ? (
        <section className="relative isolate">
          <div className="absolute inset-0 overflow-hidden">
            <Photo path={cover} frame={savedFrame(photos[0])} alt="" eager className="size-full" />
            <span aria-hidden className="veil-t absolute inset-x-0 top-0 h-40" />
            <span aria-hidden className="veil-hero absolute inset-0" />
          </div>

          <div className="relative flex min-h-[72svh] flex-col pt-4">
            <div className={`${shell} flex items-center justify-between gap-3`}>
              <Link
                href="/municipios"
                aria-label="Todos los municipios"
                className={iconOnPhoto}
              >
                <BackIcon className="size-5" />
              </Link>

              <ShareLink
                url={shareUrl}
                title={`${city.name}, Chocó · ${plural(openNeeds, "necesidad abierta", "necesidades abiertas")}`}
                className={iconOnPhoto}
              >
                <ShareIcon className="size-5" />
                <span className="sr-only">Compartir {city.name}</span>
              </ShareLink>
            </div>

            <header className={`${shell} mt-auto pt-24 lg:pb-2`}>
              <h1 className="font-display text-[32px] leading-none text-paper lg:text-[46px]">
                {city.name}, <span className="text-paper/65">Chocó</span>
              </h1>
              <p className="mt-2.5 text-[14px] text-paper/85">
                {plural(openNeeds, "necesidad abierta", "necesidades abiertas")}
                {cases.length > 0 && ` · ${plural(cases.length, "caso", "casos")}`}
              </p>
              {!city.published && (
                <p className="mt-3">
                  <span className={pillOnPhoto}>Sin publicar</span>
                </p>
              )}
              {summaryParagraphs.length > 0 && (
                <div className="mt-5 max-w-[68ch] space-y-3 text-[15px] leading-relaxed text-paper">
                  {summaryParagraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              )}
              <p className="mt-4 text-[12px] text-paper/70">
                Actualizado el {formatDate(city.updated_at)}
              </p>
            </header>

            {/* El aire de abajo no es respiración: es el hueco que necesita la
                hoja de contenido para montarse encima sin comerse el carrete.
                Sube 28 px, así que aquí hacen falta más de 28. */}
            {photos.length > 0 && (
              <div className="mt-6 pb-14">
                <PhotoGrid photos={photos} overlay />
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className={`${shell} relative pt-4 lg:pt-8`}>
          <div className="flex items-center justify-between gap-3">
            <Link href="/municipios" aria-label="Todos los municipios" className={iconOnPaper}>
              <BackIcon className="size-5" />
            </Link>

            <ShareLink
              url={shareUrl}
              title={`${city.name}, Chocó · ${plural(openNeeds, "necesidad abierta", "necesidades abiertas")}`}
              className={iconOnPaper}
            >
              <ShareIcon className="size-5" />
              <span className="sr-only">Compartir {city.name}</span>
            </ShareLink>
          </div>

          <header className="mt-10">
            <h1 className="font-display text-[32px] leading-none text-ink lg:text-[46px]">
              {city.name}, <span className="text-faint">Chocó</span>
            </h1>
            <p className="mt-2.5 text-[14px] text-muted">
              {plural(openNeeds, "necesidad abierta", "necesidades abiertas")}
              {cases.length > 0 && ` · ${plural(cases.length, "caso", "casos")}`}
            </p>
            {!city.published && (
              <p className="mt-3">
                <DraftChip label="Sin publicar" />
              </p>
            )}
            {summaryParagraphs.length > 0 && (
              <div className="mt-6 max-w-[68ch] space-y-4 text-[15px] leading-relaxed text-body">
                {summaryParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}
            <p className="mt-4 text-[12px] text-faint">
              Actualizado el {formatDate(city.updated_at)}
            </p>
          </header>

          {photos.length > 0 && (
            <div className="mt-6">
              <PhotoGrid photos={photos} />
            </div>
          )}
        </div>
      )}

      {/* La hoja de contenido sube y se monta sobre la foto con las dos esquinas
          de arriba redondeadas. No es un remate: es la transición entre el
          encabezado fotográfico y el documento, y lo que dice que lo de arriba y
          lo de abajo son dos planos y no una página que cambia de color a la
          mitad. Se monta la hoja encima —y no se curva la foto por abajo— porque
          lo que avanza es el contenido; la foto se queda donde está, entera y
          detrás. La ficha de un caso hace exactamente esto mismo.

          Sin foto de portada no hay nada sobre lo que montarse y la curva
          desaparece: una esquina redondeada contra el papel no sería una
          transición, sería un adorno. */}
      <div className={cover ? "relative -mt-7 rounded-t-[28px] bg-paper pt-7" : ""}>
        {/* En el móvil todo esto es una pila y hay que bajar hasta el final para
            encontrar a la fundación. En escritorio se parte en dos: a la
            izquierda el documento —lo que se lee: fotos, personas, lo que hace
            falta— y a la derecha lo que se hace —donar, situarse, ofrecer—, que
            deja de estar al fondo y pasa a acompañar la lectura entera.

            El orden del HTML no cambia, así que en el móvil sigue siendo la
            misma pila y en el mismo orden. */}
        <div
          className={`${shell} lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-x-12`}
        >
          <div className="lg:col-start-1 lg:row-start-1">
            {/* Aquí había una tira con todas las fotos de todos los casos del
                municipio, sueltas y en su propia sección. Se fue: cada una de
                esas fotos es de una persona concreta, que dio su consentimiento
                para que se contara SU situación, y amontonadas fuera de su ficha
                se leían como un muestrario de daños del pueblo. Ahora van dentro
                de la tarjeta de quien es, en la sección de personas. */}
            <section className="mt-4">
              <h2 className={screenTitle}>Contenido</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted lg:text-[15px]">
                Las personas de {city.name} y lo que hace falta, de la zona y de cada caso.
              </p>
              <div className="mt-5">
                <SectionTabs
                  slug={city.slug}
                  active={section}
                  peopleCount={cases.length}
                  needsCount={listedNeeds.length}
                />
              </div>

              {section === "personas" ? (
                <div className="mt-6">
                  {cases.length === 0 ? (
                    <p className={`${card} max-w-[68ch] p-5 text-[14px] leading-relaxed text-muted`}>
                      Todavía no hay casos publicados de este municipio. Solo publicamos un caso
                      cuando la persona da su consentimiento.
                    </p>
                  ) : (
                    /* Dos columnas como techo y no cuatro: cada tarjeta lleva
                       ahora retrato, qué le está pasando y el carrusel de esa
                       persona, y en una columna de 300 px el carrusel serían
                       sellos de correos. */
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {cases.map((caseRecord) => (
                        <li key={caseRecord.id}>
                          <CaseBigCard caseRecord={caseRecord} citySlug={city.slug} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="mt-6">
                  <NeedsList
                    needs={listedNeeds.map((need) => ({
                      ...need,
                      cityName: city.name,
                      citySlug: city.slug,
                      caseName: need.case_id
                        ? (cases.find((row) => row.id === need.case_id)?.display_name ?? null)
                        : null,
                    }))}
                    emptyLabel="Todavía no hemos registrado necesidades de este municipio."
                    showOrigin
                    columns
                  />
                </div>
              )}
            </section>
          </div>

          <div className="mt-14 lg:col-start-2 lg:row-start-1 lg:mt-0">
            {/* Una fundación, y aquí ya no hay que elegirla: la base de datos
                garantiza que hay una o ninguna (0004). Debajo iba una lista de
                «organizaciones aliadas», que era la otra mitad de la misma
                confusión: dos tarjetas con botón de donar en la misma columna y
                nada en la pantalla que dijera cuál recibe. */}
            {foundation && (
              <section id="fundacion">
                <FoundationCard foundation={foundation} cityName={city.name} featured />
              </section>
            )}

            {/* La llave va debajo de la fundación cuando hay fundación, y ocupa su
                sitio cuando no. No compite con ella: la fundación es de este
                municipio y recauda para él, y la llave es del portal entero. El
                orden dice eso —primero lo de aquí, luego lo de todos— y cuando no
                hay fundación registrada, que es como está hoy la base real, la
                llave es lo único que evita que esta columna no ofrezca ninguna
                forma de dar dinero. */}
            {donationKey && (
              <section
                className={foundation ? "mt-6" : ""}
                aria-label="Llave de transferencia"
              >
                <TransferKey donationKey={donationKey} featured={!foundation} />
                <p className="mt-3 text-[13px] leading-relaxed text-muted">
                  Es la llave del portal y sirve para cualquier municipio del Chocó.
                  {foundation
                    ? ` Si prefieres que entre por ${foundation.name}, usa su enlace de arriba.`
                    : ` ${city.name} todavía no tiene fundación registrada, así que por ahora es la única vía.`}
                </p>
              </section>
            )}

            <section className="mt-12">
              <h2 className={screenTitle}>Dónde queda</h2>
              <div className={`${card} mt-4 flex items-center gap-5 p-4`}>
                <ChocoMap
                  pins={[
                    { id: city.id, name: city.name, slug: city.slug, lat: city.lat, lng: city.lng },
                  ]}
                  activeSlug={city.slug}
                  bare
                  className="h-auto w-20 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[14px] leading-relaxed text-muted">
                    {city.name} dentro del departamento del Chocó.
                  </p>
                  <p className="mt-1.5 text-[12px] tabular-nums text-faint">
                    {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
                  </p>
                  <Link
                    href="/mapa"
                    className="mt-2 inline-block text-[13px] text-accent-strong hover:text-accent"
                  >
                    Ver el mapa entero
                  </Link>
                </div>
              </div>
            </section>

            <Link
              href={`/ofrecer?city=${city.slug}`}
              className="mt-12 flex min-h-13 w-full items-center justify-center rounded-full bg-accent px-6 text-[15px] font-medium text-paper transition-[background-color,scale] duration-150 hover:bg-accent-strong active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Ofrecer un recurso para {city.name}
            </Link>

            {/* La otra mitad del botón de arriba: lo que se puede dar y lo que ya
                llegó, uno debajo del otro. El enlace se pinta siempre y no solo
                cuando hay entregas, porque saberlo costaría una consulta más y
                el registro filtrado ya dice con claridad que aún no hay ninguna.
                Es la única puerta del municipio hacia sus ayudas: hasta ahora se
                llegaba en el sentido contrario y no había vuelta. */}
            <Link
              href={`/ayudas?municipio=${city.slug}`}
              className="mt-3 flex min-h-11 w-full items-center justify-center text-[14px] text-accent-strong hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Ver lo que ya llegó a {city.name}
            </Link>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
